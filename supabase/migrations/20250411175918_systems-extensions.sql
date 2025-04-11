-- System Database Functions and Procedures

-- Function to generate URL-friendly slugs
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
BEGIN
    -- Convert to lowercase
    slug := lower(input_text);
    
    -- Replace non-alphanumeric characters with hyphens
    slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
    
    -- Remove leading and trailing hyphens
    slug := trim(both '-' from slug);
    
    -- Ensure unique slug by appending random string if needed
    -- This is a simplified approach - in production you might want to check for duplicates
    -- and append a counter or timestamp instead
    RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Function to build category path (for breadcrumbs)
CREATE OR REPLACE FUNCTION get_category_path(category_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    level INTEGER,
    path_order INTEGER
) AS $$
WITH RECURSIVE category_tree AS (
    -- Base case: start with the given category
    SELECT 
        c.id,
        c.name,
        c.level,
        1 AS path_order
    FROM public.categories c
    WHERE c.id = category_id
    
    UNION ALL
    
    -- Recursive case: join with parent categories
    SELECT
        p.id,
        p.name,
        p.level,
        ct.path_order + 1
    FROM category_tree ct
    JOIN public.categories c ON ct.id = c.id
    JOIN public.categories p ON c.parent_category_id = p.id
)
-- Return results in reverse order (root first)
SELECT 
    id, 
    name, 
    level, 
    path_order
FROM category_tree
ORDER BY path_order DESC;
$$ LANGUAGE SQL;

-- Function to get all child categories
CREATE OR REPLACE FUNCTION get_child_categories(parent_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    level INTEGER,
    is_active BOOLEAN
) AS $$
WITH RECURSIVE subcategories AS (
    -- Base case: direct children of the given category
    SELECT 
        c.id,
        c.name,
        c.slug,
        c.level,
        c.is_active
    FROM public.categories c
    WHERE c.parent_category_id = parent_id
    
    UNION ALL
    
    -- Recursive case: children of children
    SELECT
        c.id,
        c.name,
        c.slug,
        c.level,
        c.is_active
    FROM subcategories s
    JOIN public.categories c ON s.id = c.parent_category_id
)
-- Return all subcategories
SELECT 
    id, 
    name, 
    slug, 
    level, 
    is_active
FROM subcategories
WHERE is_active = true
ORDER BY level, name;
$$ LANGUAGE SQL;

-- Function to get related tags for a given tag
CREATE OR REPLACE FUNCTION get_related_tags(tag_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    relevance_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH tag_listings AS (
        -- Get all listings with the given tag
        SELECT listing_id
        FROM public.listing_tags
        WHERE tag_id = $1
    ),
    co_occurring_tags AS (
        -- Find tags that appear on the same listings
        SELECT 
            t.id,
            t.name,
            t.slug,
            COUNT(lt.listing_id) AS occurrence_count
        FROM tag_listings tl
        JOIN public.listing_tags lt ON tl.listing_id = lt.listing_id
        JOIN public.tags t ON lt.tag_id = t.id
        WHERE lt.tag_id != $1  -- Exclude the original tag
        GROUP BY t.id, t.name, t.slug
    )
    SELECT 
        id,
        name,
        slug,
        (occurrence_count::FLOAT / (
            SELECT COUNT(*) FROM tag_listings
        )) AS relevance_score  -- Calculate relevance as percentage of co-occurrence
    FROM co_occurring_tags
    ORDER BY relevance_score DESC, name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to search across categories, tags, and brands
CREATE OR REPLACE FUNCTION search_taxonomy(search_term TEXT, taxonomy_type TEXT DEFAULT NULL)
RETURNS TABLE (
    entity_type TEXT,
    id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    relevance FLOAT
) AS $$
BEGIN
    RETURN QUERY
    -- Search in categories
    SELECT 
        'category'::TEXT AS entity_type,
        c.id,
        c.name,
        c.slug,
        c.description,
        ts_rank(
            to_tsvector('english', coalesce(c.name, '') || ' ' || coalesce(c.description, '')),
            to_tsquery('english', regexp_replace(search_term, '\s+', ':* & ', 'g') || ':*')
        ) AS relevance
    FROM public.categories c
    WHERE 
        (taxonomy_type IS NULL OR c.taxonomy_type = taxonomy_type)
        AND (
            c.name ILIKE '%' || search_term || '%'
            OR c.description ILIKE '%' || search_term || '%'
            OR to_tsvector('english', coalesce(c.name, '') || ' ' || coalesce(c.description, '')) @@ 
               to_tsquery('english', regexp_replace(search_term, '\s+', ':* & ', 'g') || ':*')
        )
    
    UNION ALL
    
    -- Search in tags
    SELECT 
        'tag'::TEXT AS entity_type,
        t.id,
        t.name,
        t.slug,
        t.description,
        ts_rank(
            to_tsvector('english', coalesce(t.name, '') || ' ' || coalesce(t.description, '')),
            to_tsquery('english', regexp_replace(search_term, '\s+', ':* & ', 'g') || ':*')
        ) AS relevance
    FROM public.tags t
    WHERE 
        (taxonomy_type IS NULL OR t.type = CASE 
            WHEN taxonomy_type = 'product' THEN 'product'
            WHEN taxonomy_type = 'store' THEN 'store'
            ELSE t.type
        END)
        AND (
            t.name ILIKE '%' || search_term || '%'
            OR t.description ILIKE '%' || search_term || '%'
            OR to_tsvector('english', coalesce(t.name, '') || ' ' || coalesce(t.description, '')) @@ 
               to_tsquery('english', regexp_replace(search_term, '\s+', ':* & ', 'g') || ':*')
        )
    
    UNION ALL
    
    -- Search in brands
    SELECT 
        'brand'::TEXT AS entity_type,
        b.id,
        b.name,
        b.slug,
        b.description,
        ts_rank(
            to_tsvector('english', coalesce(b.name, '') || ' ' || coalesce(b.description, '')),
            to_tsquery('english', regexp_replace(search_term, '\s+', ':* & ', 'g') || ':*')
        ) AS relevance
    FROM public.brands b
    WHERE 
        (taxonomy_type IS NULL OR taxonomy_type = 'product')
        AND (
            b.name ILIKE '%' || search_term || '%'
            OR b.description ILIKE '%' || search_term || '%'
            OR to_tsvector('english', coalesce(b.name, '') || ' ' || coalesce(b.description, '')) @@ 
               to_tsquery('english', regexp_replace(search_term, '\s+', ':* & ', 'g') || ':*')
        )
    
    ORDER BY relevance DESC, name
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Function to log a global event
CREATE OR REPLACE FUNCTION log_global_event(
    p_event_namespace TEXT,
    p_event_type TEXT,
    p_entity_id UUID,
    p_related_entity_id UUID DEFAULT NULL,
    p_account_id UUID DEFAULT NULL,
    p_data JSONB DEFAULT '{}'::JSONB,
    p_severity TEXT DEFAULT 'info',
    p_source TEXT DEFAULT 'system'
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
    client_ip TEXT;
    client_user_agent TEXT;
BEGIN
    -- Attempt to get client IP and user agent from request headers
    BEGIN
        client_ip := nullif(current_setting('request.headers', true)::json->>'x-forwarded-for', '')::TEXT;
        client_user_agent := nullif(current_setting('request.headers', true)::json->>'user-agent', '')::TEXT;
    EXCEPTION
        WHEN OTHERS THEN
            client_ip := NULL;
            client_user_agent := NULL;
    END;

    -- Insert the event
    INSERT INTO public.global_events (
        id,
        event_namespace,
        event_type,
        entity_id,
        related_entity_id,
        account_id,
        ip_address,
        user_agent,
        severity,
        data,
        source,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        p_event_namespace,
        p_event_type,
        p_entity_id,
        p_related_entity_id,
        p_account_id,
        client_ip,
        client_user_agent,
        p_severity,
        p_data,
        p_source,
        now()
    )
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get nested hierarchical categories
CREATE OR REPLACE FUNCTION get_hierarchical_categories(taxonomy_type_filter TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    level INTEGER,
    parent_id UUID,
    has_children BOOLEAN,
    children JSONB
) AS $$
WITH RECURSIVE category_hierarchy AS (
    -- Base case: top-level categories (no parent)
    SELECT 
        c.id,
        c.name,
        c.slug,
        c.level,
        c.parent_category_id AS parent_id,
        (EXISTS (SELECT 1 FROM public.categories WHERE parent_category_id = c.id)) AS has_children,
        '[]'::JSONB AS children
    FROM public.categories c
    WHERE 
        c.parent_category_id IS NULL
        AND (taxonomy_type_filter IS NULL OR c.taxonomy_type = taxonomy_type_filter)
        AND c.is_active = true
    
    UNION ALL
    
    -- Recursive case: child categories
    SELECT
        c.id,
        c.name,
        c.slug,
        c.level,
        c.parent_category_id AS parent_id,
        (EXISTS (SELECT 1 FROM public.categories WHERE parent_category_id = c.id)) AS has_children,
        '[]'::JSONB AS children
    FROM public.categories c
    JOIN category_hierarchy ch ON c.parent_category_id = ch.id
    WHERE c.is_active = true
),
-- Transform flat hierarchy into nested JSON structure
nested_categories AS (
    SELECT
        id,
        name,
        slug,
        level,
        parent_id,
        has_children,
        CASE
            WHEN NOT has_children THEN '[]'::JSONB
            ELSE (
                SELECT jsonb_agg(jsonb_build_object(
                    'id', c.id,
                    'name', c.name,
                    'slug', c.slug,
                    'level', c.level,
                    'has_children', c.has_children,
                    'children', c.children
                ))
                FROM category_hierarchy c
                WHERE c.parent_id = ch.id
            )
        END AS children
    FROM category_hierarchy ch
)
-- Return only top-level categories with nested children
SELECT 
    id,
    name,
    slug,
    level,
    parent_id,
    has_children,
    children
FROM nested_categories
WHERE parent_id IS NULL
ORDER BY name;
$$ LANGUAGE SQL;


-- Comments for future reference
COMMENT ON FUNCTION generate_slug IS 'Generates a URL-friendly slug from any text input';
COMMENT ON FUNCTION get_category_path IS 'Returns the full path from root to specified category for breadcrumb navigation';
COMMENT ON FUNCTION get_child_categories IS 'Returns all child categories at any level below a specified parent';
COMMENT ON FUNCTION get_related_tags IS 'Finds tags that frequently appear together with a given tag';
COMMENT ON FUNCTION search_taxonomy IS 'Unified search across categories, tags, and brands with relevance scoring';
COMMENT ON FUNCTION log_global_event IS 'Centralized event logging for system-wide activity tracking';
COMMENT ON FUNCTION get_hierarchical_categories IS 'Returns a nested JSON structure of categories for navigation menus';
