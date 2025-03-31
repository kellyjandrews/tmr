-- File: supabase/migrations/20250329150000_listings_actions_sprocs.sql

-- Type for returning listing with store info
CREATE TYPE listing_with_store AS (
    id UUID,
    store_id UUID,
    name TEXT,
    description TEXT,
    price DECIMAL,
    quantity INTEGER,
    status TEXT,
    image_url TEXT,
    slug TEXT,
    category_id UUID,
    views_count INTEGER,
    featured BOOLEAN,
    is_digital BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    store_name TEXT,
    store_slug TEXT,
    store_user_id UUID,
    store_created_at TIMESTAMPTZ
);

-- Type for listing category with name
CREATE TYPE listing_category AS (
    id UUID,
    name TEXT,
    slug TEXT
);

-- Type for listing shipping details
CREATE TYPE listing_shipping_details AS (
    flat_rate DECIMAL,
    free_shipping BOOLEAN,
    ships_from TEXT,
    ships_to TEXT[],
    estimated_days_min INTEGER,
    estimated_days_max INTEGER
);

-- Get Featured Listings
CREATE OR REPLACE FUNCTION get_featured_listings(
    limit_param INTEGER DEFAULT 4
)
RETURNS SETOF listing_with_store
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.store_id,
        l.name,
        l.description,
        l.price,
        l.quantity,
        l.status,
        l.image_url,
        l.slug,
        l.category_id,
        l.views_count,
        l.featured,
        l.is_digital,
        l.created_at,
        l.updated_at,
        s.name AS store_name,
        s.slug AS store_slug,
        s.user_id AS store_user_id,
        s.created_at AS store_created_at
    FROM 
        listings l
    JOIN 
        stores s ON l.store_id = s.id
    WHERE 
        l.status = 'active'
    ORDER BY 
        l.featured DESC,
        l.created_at DESC
    LIMIT limit_param;
END;
$$;

-- Fetch Listings with Filters
CREATE OR REPLACE FUNCTION fetch_listings(
    store_id_param UUID DEFAULT NULL,
    category_id_param UUID DEFAULT NULL,
    limit_param INTEGER DEFAULT 10,
    offset_param INTEGER DEFAULT 0,
    sort_by_param TEXT DEFAULT 'created_at',
    sort_order_param TEXT DEFAULT 'desc',
    search_param TEXT DEFAULT NULL,
    min_price_param DECIMAL DEFAULT NULL,
    max_price_param DECIMAL DEFAULT NULL,
    status_param TEXT DEFAULT 'active'
)
RETURNS TABLE (
    listing listing_with_store,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    query_sql TEXT;
    count_sql TEXT;
    category_listing_ids UUID[];
BEGIN
    -- If category_id is provided, get listings with that category
    IF category_id_param IS NOT NULL THEN
        SELECT array_agg(listing_id)
        INTO category_listing_ids
        FROM listing_categories
        WHERE category_id = category_id_param;
        
        -- If no listings found in this category, return empty set
        IF category_listing_ids IS NULL OR array_length(category_listing_ids, 1) IS NULL THEN
            RETURN;
        END IF;
    END IF;

    -- Base query
    query_sql := 'SELECT 
                   ROW(
                        l.id,
                        l.store_id,
                        l.name,
                        l.description,
                        l.price,
                        l.quantity,
                        l.status,
                        l.image_url,
                        l.slug,
                        l.category_id,
                        l.views_count,
                        l.featured,
                        l.is_digital,
                        l.created_at,
                        l.updated_at,
                        s.name,
                        s.slug,
                        s.user_id,
                        s.created_at)::listing_with_store as listing,
                    COUNT(*) OVER() AS total_count
                FROM 
                    listings l
                JOIN 
                    stores s ON l.store_id = s.id
                WHERE 1=1';

    -- Apply filters
    IF status_param IS NOT NULL THEN
        query_sql := query_sql || ' AND l.status = ' || quote_literal(status_param);
    END IF;

    IF store_id_param IS NOT NULL THEN
        query_sql := query_sql || ' AND l.store_id = ' || quote_literal(store_id_param);
    END IF;

    IF category_listing_ids IS NOT NULL THEN
        query_sql := query_sql || ' AND l.id = ANY(' || quote_literal(category_listing_ids) || ')';
    END IF;

    IF search_param IS NOT NULL AND search_param != '' THEN
        query_sql := query_sql || ' AND (l.name ILIKE ' || quote_literal('%' || search_param || '%') 
                                || ' OR l.description ILIKE ' || quote_literal('%' || search_param || '%') || ')';
    END IF;

    IF min_price_param IS NOT NULL THEN
        query_sql := query_sql || ' AND l.price >= ' || min_price_param;
    END IF;

    IF max_price_param IS NOT NULL THEN
        query_sql := query_sql || ' AND l.price <= ' || max_price_param;
    END IF;

    -- Add sorting
    IF sort_by_param IS NOT NULL THEN
        -- Sanitize sort_by to prevent SQL injection
        IF sort_by_param = 'price' THEN
            query_sql := query_sql || ' ORDER BY l.price';
        ELSIF sort_by_param = 'name' THEN
            query_sql := query_sql || ' ORDER BY l.name';
        ELSIF sort_by_param = 'views_count' THEN
            query_sql := query_sql || ' ORDER BY l.views_count';
        ELSE
            -- Default to created_at
            query_sql := query_sql || ' ORDER BY l.created_at';
        END IF;

        -- Add sort direction
        IF sort_order_param = 'asc' THEN
            query_sql := query_sql || ' ASC';
        ELSE
            query_sql := query_sql || ' DESC';
        END IF;
    END IF;

    -- Add pagination
    query_sql := query_sql || ' LIMIT ' || limit_param || ' OFFSET ' || offset_param;

    -- Execute query and return results
    RETURN QUERY EXECUTE query_sql;
    
END;
$$;

-- Get Listing by ID
CREATE OR REPLACE FUNCTION get_listing_by_id(
    listing_id_param UUID
)
RETURNS TABLE (
    listing_details listing_with_store,
    categories listing_category[],
    images TEXT[],
    shipping listing_shipping_details
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_listing listing_with_store;
    v_categories listing_category[];
    v_images TEXT[];
    v_shipping listing_shipping_details;
BEGIN
    -- Get the main listing data
    SELECT 
        l.id,
        l.store_id,
        l.name,
        l.description,
        l.price,
        l.quantity,
        l.status,
        l.image_url,
        l.slug,
        l.category_id,
        l.views_count,
        l.featured,
        l.is_digital,
        l.created_at,
        l.updated_at,
        s.name,
        s.slug,
        s.user_id,
        s.created_at
    INTO v_listing
    FROM 
        listings l
    JOIN 
        stores s ON l.store_id = s.id
    WHERE 
        l.id = listing_id_param;
    
    -- Return null if listing not found
    IF v_listing IS NULL THEN
        RETURN;
    END IF;

    -- Get categories for the listing
    SELECT array_agg(ROW(c.id, c.name, c.slug)::listing_category)
    INTO v_categories
    FROM categories c
    JOIN listing_categories lc ON c.id = lc.category_id
    WHERE lc.listing_id = listing_id_param;

    -- Get all images for the listing
    SELECT array_agg(image_url ORDER BY display_order)
    INTO v_images
    FROM listing_images
    WHERE listing_id = listing_id_param;

    -- Get shipping info
    SELECT 
        flat_rate,
        free_shipping,
        ships_from,
        ships_to,
        estimated_days_min,
        estimated_days_max
    INTO v_shipping
    FROM 
        listing_shipping
    WHERE 
        listing_id = listing_id_param;

    -- Return the data
    listing_details := v_listing;
    categories := v_categories;
    images := v_images;
    shipping := v_shipping;
    
    RETURN NEXT;
END;
$$;

-- Get Listing by Slug
CREATE OR REPLACE FUNCTION get_listing_by_slug(
    slug_param TEXT
)
RETURNS TABLE (
    listing_details listing_with_store,
    categories listing_category[],
    images TEXT[],
    shipping listing_shipping_details
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_listing_id UUID;
BEGIN
    -- Get the listing ID from slug
    SELECT id
    INTO v_listing_id
    FROM listings
    WHERE slug = slug_param;
    
    -- Return null if listing not found
    IF v_listing_id IS NULL THEN
        RETURN;
    END IF;

    -- Use the get_listing_by_id function
    RETURN QUERY
    SELECT * FROM get_listing_by_id(v_listing_id);
END;
$$;

-- Get Related Listings
CREATE OR REPLACE FUNCTION get_related_listings(
    listing_id_param UUID,
    limit_param INTEGER DEFAULT 4
)
RETURNS SETOF listing_with_store
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_store_id UUID;
    v_category_ids UUID[];
BEGIN
    -- Get the current listing's store and categories
    SELECT store_id
    INTO v_store_id
    FROM listings
    WHERE id = listing_id_param;
    
    -- Get categories of the current listing
    SELECT array_agg(category_id)
    INTO v_category_ids
    FROM listing_categories
    WHERE listing_id = listing_id_param;
    
    -- Get related listings by category first, then by store
    RETURN QUERY
    (
        -- Get listings in the same categories, excluding the current listing
        SELECT 
            l.id,
            l.store_id,
            l.name,
            l.description,
            l.price,
            l.quantity,
            l.status,
            l.image_url,
            l.slug,
            l.category_id,
            l.views_count,
            l.featured,
            l.is_digital,
            l.created_at,
            l.updated_at,
            s.name AS store_name,
            s.slug AS store_slug,
            s.user_id AS store_user_id,
            s.created_at as store_created_at
        FROM 
            listings l
        JOIN 
            stores s ON l.store_id = s.id
        JOIN 
            listing_categories lc ON l.id = lc.listing_id
        WHERE 
            l.id != listing_id_param
            AND l.status = 'active'
            AND lc.category_id = ANY(v_category_ids)
        GROUP BY
            l.id, s.name, s.slug, s.user_id
        ORDER BY 
            COUNT(DISTINCT lc.category_id) DESC,
            l.created_at DESC
        LIMIT limit_param
    )
    UNION
    (
        -- Get listings from the same store, excluding the current listing
        SELECT 
            l.id,
            l.store_id,
            l.name,
            l.description,
            l.price,
            l.quantity,
            l.status,
            l.image_url,
            l.slug,
            l.category_id,
            l.views_count,
            l.featured,
            l.is_digital,
            l.created_at,
            l.updated_at,
            s.name AS store_name,
            s.slug AS store_slug,
            s.user_id AS store_user_id,
            s.created_at as store_created_at
        FROM 
            listings l
        JOIN 
            stores s ON l.store_id = s.id
        WHERE 
            l.id != listing_id_param
            AND l.status = 'active'
            AND l.store_id = v_store_id
            AND NOT EXISTS (
                SELECT 1
                FROM listing_categories lc
                WHERE lc.listing_id = l.id
                AND lc.category_id = ANY(v_category_ids)
            )
        ORDER BY 
            l.created_at DESC
        LIMIT limit_param
    )
    LIMIT limit_param;
END;
$$;

-- Get Listings by Category Slug
CREATE OR REPLACE FUNCTION get_listings_by_category_slug(
    slug_param TEXT,
    limit_param INTEGER DEFAULT 10,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    listing listing_with_store,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_category_id UUID;
BEGIN
    -- Get the category ID from slug
    SELECT id
    INTO v_category_id
    FROM categories
    WHERE slug = slug_param;
    
    -- Return empty set if category not found
    IF v_category_id IS NULL THEN
        RETURN;
    END IF;

    -- Use the fetch_listings function with the category_id
    RETURN QUERY
    SELECT * FROM fetch_listings(
        category_id_param := v_category_id,
        limit_param := limit_param,
        offset_param := offset_param
    );
END;
$$;

-- Increment listing view count
CREATE OR REPLACE FUNCTION increment_listing_view(
    listing_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE listings
    SET views_count = views_count + 1
    WHERE id = listing_id_param;
    
    RETURN FOUND;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_featured_listings TO authenticated;
GRANT EXECUTE ON FUNCTION fetch_listings TO authenticated;
GRANT EXECUTE ON FUNCTION get_listing_by_id TO authenticated;
GRANT EXECUTE ON FUNCTION get_listing_by_slug TO authenticated;
GRANT EXECUTE ON FUNCTION get_related_listings TO authenticated;
GRANT EXECUTE ON FUNCTION get_listings_by_category_slug TO authenticated;
GRANT EXECUTE ON FUNCTION increment_listing_view TO authenticated;