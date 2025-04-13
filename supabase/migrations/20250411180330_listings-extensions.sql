-- Listings-specific Extensions and Advanced Functionality

-- Full-text search configuration for listings
-- Creates a powerful search vector that covers multiple listing fields
CREATE OR REPLACE FUNCTION listings_search_vector(p_listing_id UUID)
RETURNS tsvector AS $$
DECLARE
    v_title text;
    v_description text;
    v_model text;
    v_condition text;
    v_brand_name text;
    v_category_names text;
    v_tags text;
    v_search_vector tsvector;
BEGIN
    -- Get the listing details more efficiently with one query
    SELECT 
        l.title,
        l.description,
        l.model,
        l.condition,
        b.name as brand_name
    INTO
        v_title,
        v_description,
        v_model,
        v_condition,
        v_brand_name
    FROM public.listings l
    LEFT JOIN public.brands b ON l.brand_id = b.id
    WHERE l.id = p_listing_id;
    
    -- Get category names with one efficient query
    SELECT string_agg(c.name, ' ')
    INTO v_category_names
    FROM public.categories c
    JOIN public.listing_categories lc ON c.id = lc.category_id AND lc.listing_id = p_listing_id;
    
    -- Get tag names with one efficient query
    SELECT string_agg(t.name, ' ')
    INTO v_tags
    FROM public.tags t
    JOIN public.listing_tags lt ON t.id = lt.tag_id AND lt.listing_id = p_listing_id;
    
    -- Build the search vector with weights for different fields
    v_search_vector := 
        setweight(to_tsvector('english', coalesce(v_title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(v_brand_name, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(v_model, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(v_category_names, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(v_tags, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(v_condition, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(v_description, '')), 'D');
    
    RETURN v_search_vector;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add search_vector column to listings table
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_listings_search_vector ON public.listings USING GIN (search_vector);

-- Function to update search vector when a listing is modified
CREATE OR REPLACE FUNCTION update_listing_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := listings_search_vector(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector
CREATE TRIGGER update_listing_search_vector_trigger
    BEFORE INSERT OR UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION update_listing_search_vector();

-- Periodic background job to update all search vectors (runs via cron)
CREATE OR REPLACE FUNCTION refresh_all_listing_search_vectors()
RETURNS void AS $$
DECLARE
    listing_cursor CURSOR FOR 
        SELECT id FROM public.listings 
        WHERE deleted_at IS NULL;
    v_listing_id UUID;
    v_search_vector tsvector;
BEGIN
    OPEN listing_cursor;
    
    LOOP
        FETCH listing_cursor INTO v_listing_id;
        EXIT WHEN NOT FOUND;
        
        v_search_vector := listings_search_vector(v_listing_id);
        
        UPDATE public.listings
        SET search_vector = v_search_vector
        WHERE id = v_listing_id;
    END LOOP;
    
    CLOSE listing_cursor;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comprehensive listing search function
CREATE OR REPLACE FUNCTION search_listings(
    search_query TEXT DEFAULT NULL,
    min_price DECIMAL DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL,
    conditions TEXT[] DEFAULT NULL,
    brands UUID[] DEFAULT NULL,
    categories UUID[] DEFAULT NULL,
    sort_by TEXT DEFAULT 'relevance',
    sort_direction TEXT DEFAULT 'desc',
    offset_val INTEGER DEFAULT 0,
    limit_val INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    price DECIMAL(10,2),
    condition TEXT,
    brand_name TEXT,
    primary_image_url TEXT,
    slug TEXT,
    rank FLOAT
) AS $$
DECLARE
    query_tsquery tsquery;
    sort_sql TEXT;
BEGIN
    -- Convert search query to tsquery if provided
    IF search_query IS NOT NULL AND length(trim(search_query)) > 0 THEN
        query_tsquery := to_tsquery('english', regexp_replace(search_query, '\s+', ' & ', 'g'));
    END IF;
    
    -- Build sort clause
    CASE sort_by
        WHEN 'price' THEN sort_sql := 'lp.price ' || sort_direction;
        WHEN 'created_at' THEN sort_sql := 'l.created_at ' || sort_direction;
        WHEN 'relevance' THEN 
            IF query_tsquery IS NOT NULL THEN
                sort_sql := 'ts_rank(l.search_vector, query_tsquery) DESC';
            ELSE
                sort_sql := 'l.created_at DESC';
            END IF;
        ELSE sort_sql := 'l.created_at DESC';
    END CASE;
    
    -- Perform the search
    RETURN QUERY EXECUTE '
        SELECT 
            l.id, 
            l.title, 
            lp.price, 
            l.condition, 
            b.name as brand_name,
            (SELECT image_url FROM public.listing_images 
             WHERE listing_id = l.id AND is_primary = true 
             LIMIT 1) as primary_image_url,
            l.slug,
            CASE WHEN $1 IS NOT NULL THEN ts_rank(l.search_vector, $1) ELSE 1 END as rank
        FROM 
            public.listings l
        JOIN
            public.listing_prices lp ON l.id = lp.listing_id AND lp.is_current = true
        LEFT JOIN
            public.brands b ON l.brand_id = b.id
        WHERE 
            l.status = ''published''
            AND l.deleted_at IS NULL
            AND ($1 IS NULL OR l.search_vector @@ $1)
            AND ($2 IS NULL OR lp.price >= $2)
            AND ($3 IS NULL OR lp.price <= $3)
            AND ($4 IS NULL OR l.condition = ANY($4))
            AND ($5 IS NULL OR l.brand_id = ANY($5))
            AND ($6 IS NULL OR l.id IN (
                SELECT listing_id FROM public.listing_categories 
                WHERE category_id = ANY($6)
            ))
        ORDER BY ' || sort_sql || '
        OFFSET $7
        LIMIT $8
    ' USING query_tsquery, min_price, max_price, conditions, brands, categories, offset_val, limit_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically manage expiration of offers
CREATE OR REPLACE FUNCTION expire_listing_offers()
RETURNS void AS $$
BEGIN
    UPDATE public.listing_offers
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at < now();
      
    -- Log the expired offers as listing events
    INSERT INTO public.listing_events(
        listing_id,
        event_type,
        data
    )
    SELECT 
        listing_id,
        'offer_expired',
        jsonb_build_object(
            'offer_id', id,
            'offer_amount', offer_amount,
            'expired_at', now()
        )
    FROM public.listing_offers
    WHERE status = 'expired'
      AND updated_at > now() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check listing availability (for "buy it now" flow)
CREATE OR REPLACE FUNCTION check_listing_availability(p_listing_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'available', 
        CASE 
            WHEN l.status = 'published' AND l.deleted_at IS NULL THEN true
            ELSE false
        END,
        'status', l.status,
        'reason', 
        CASE
            WHEN l.status = 'sold' THEN 'This item has already been sold.'
            WHEN l.status = 'archived' THEN 'This listing is no longer available.'
            WHEN l.deleted_at IS NOT NULL THEN 'This listing has been removed.'
            ELSE NULL
        END
    ) INTO v_result
    FROM public.listings l
    WHERE l.id = p_listing_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track listing views with rate limiting
CREATE OR REPLACE FUNCTION track_listing_view(
    p_listing_id UUID,
    p_viewer_id UUID,
    p_ip_address TEXT
)
RETURNS void AS $$
DECLARE
    recent_view_exists BOOLEAN;
BEGIN
    -- Check if this user/IP has viewed this listing recently (last 24 hours)
    SELECT EXISTS (
        SELECT 1 
        FROM public.listing_events
        WHERE listing_id = p_listing_id
          AND event_type = 'view'
          AND (
              (p_viewer_id IS NOT NULL AND user_id = p_viewer_id) OR
              (data->>'ip_address' = p_ip_address)
          )
          AND created_at > now() - INTERVAL '24 hours'
    ) INTO recent_view_exists;
    
    -- Only log a new view if no recent view exists
    IF NOT recent_view_exists THEN
        INSERT INTO public.listing_events(
            listing_id,
            user_id,
            event_type,
            data
        ) VALUES (
            p_listing_id,
            p_viewer_id,
            'view',
            jsonb_build_object(
                'ip_address', p_ip_address,
                'timestamp', now()
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a listing duplicate (for relisting or similar listings)
CREATE OR REPLACE FUNCTION duplicate_listing(
    p_listing_id UUID,
    p_new_title TEXT DEFAULT NULL,
    p_include_images BOOLEAN DEFAULT true,
    p_include_shipping BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
    v_new_listing_id UUID;
    v_new_price_id UUID;
    v_original record;
    v_price record;
    v_image record;
    v_shipping record;
BEGIN
    -- Get the original listing
    SELECT * INTO v_original
    FROM public.listings
    WHERE id = p_listing_id;
    
    -- Get current price
    SELECT * INTO v_price
    FROM public.listing_prices
    WHERE listing_id = p_listing_id
      AND is_current = true;
    
    -- Insert new listing
    INSERT INTO public.listings(
        store_id,
        title,
        slug,
        description,
        brand_id,
        year,
        condition,
        model,
        as_is,
        is_digital,
        status,
        location,
        metadata
    ) VALUES (
        v_original.store_id,
        COALESCE(p_new_title, v_original.title || ' (Copy)'),
        generate_listing_slug(COALESCE(p_new_title, v_original.title || ' (Copy)')),
        v_original.description,
        v_original.brand_id,
        v_original.year,
        v_original.condition,
        v_original.model,
        v_original.as_is,
        v_original.is_digital,
        'draft', -- Always start as draft
        v_original.location,
        v_original.metadata
    )
    RETURNING id INTO v_new_listing_id;
    
    -- Insert new price
    INSERT INTO public.listing_prices(
        listing_id,
        price,
        is_current
    ) VALUES (
        v_new_listing_id,
        v_price.price,
        true
    )
    RETURNING id INTO v_new_price_id;
    
    -- Copy images if requested
    IF p_include_images THEN
        FOR v_image IN
            SELECT * FROM public.listing_images
            WHERE listing_id = p_listing_id
            ORDER BY display_order
        LOOP
            INSERT INTO public.listing_images(
                listing_id,
                image_url,
                display_order,
                alt_text,
                is_primary
            ) VALUES (
                v_new_listing_id,
                v_image.image_url,
                v_image.display_order,
                v_image.alt_text,
                v_image.is_primary
            );
        END LOOP;
    END IF;
    
    -- Copy shipping info if requested
    IF p_include_shipping THEN
        SELECT * INTO v_shipping
        FROM public.listing_shipping
        WHERE listing_id = p_listing_id;
        
        IF FOUND THEN
            INSERT INTO public.listing_shipping(
                listing_id,
                shipping_type,
                flat_rate,
                dimensions,
                weight,
                carrier,
                international_shipping
            ) VALUES (
                v_new_listing_id,
                v_shipping.shipping_type,
                v_shipping.flat_rate,
                v_shipping.dimensions,
                v_shipping.weight,
                v_shipping.carrier,
                v_shipping.international_shipping
            );
        END IF;
    END IF;
    
    -- Copy categories
    INSERT INTO public.listing_categories(
        listing_id,
        category_id,
        is_primary
    )
    SELECT 
        v_new_listing_id,
        category_id,
        is_primary
    FROM public.listing_categories
    WHERE listing_id = p_listing_id;
    
    -- Copy tags
    INSERT INTO public.listing_tags(
        listing_id,
        tag_id
    )
    SELECT 
        v_new_listing_id,
        tag_id
    FROM public.listing_tags
    WHERE listing_id = p_listing_id;
    
    -- Log the duplication event
    INSERT INTO public.listing_events(
        listing_id,
        user_id,
        event_type,
        data
    ) VALUES (
        v_new_listing_id,
        current_setting('request.jwt.claims', true)::jsonb->>'sub',
        'create',
        jsonb_build_object(
            'duplicated_from', p_listing_id,
            'include_images', p_include_images,
            'include_shipping', p_include_shipping
        )
    );
    
    RETURN v_new_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get listings with similar attributes (for "you may also like" feature)
CREATE OR REPLACE FUNCTION get_similar_listings(
    p_listing_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    price DECIMAL(10,2),
    primary_image_url TEXT,
    similarity_score FLOAT
) AS $$
DECLARE
    v_listing RECORD;
    v_category_ids UUID[];
    v_tag_ids UUID[];
BEGIN
    -- Get the original listing details
    SELECT 
        l.*, 
        b.id as brand_id,
        lp.price
    INTO v_listing
    FROM 
        public.listings l
    LEFT JOIN 
        public.brands b ON l.brand_id = b.id
    LEFT JOIN
        public.listing_prices lp ON l.id = lp.listing_id AND lp.is_current = true
    WHERE 
        l.id = p_listing_id;
    
    -- Get the listing's categories
    SELECT array_agg(category_id)
    INTO v_category_ids
    FROM public.listing_categories
    WHERE listing_id = p_listing_id;
    
    -- Get the listing's tags
    SELECT array_agg(tag_id)
    INTO v_tag_ids
    FROM public.listing_tags
    WHERE listing_id = p_listing_id;
    
    -- Return similar listings based on multiple factors
    RETURN QUERY
    SELECT 
        l.id,
        l.title,
        lp.price,
        (SELECT image_url FROM public.listing_images 
         WHERE listing_id = l.id AND is_primary = true 
         LIMIT 1) as primary_image_url,
        (
            -- Base similarity score
            0.0
            -- Same brand bonus
            + CASE WHEN l.brand_id = v_listing.brand_id AND v_listing.brand_id IS NOT NULL THEN 0.3 ELSE 0 END
            -- Same condition bonus
            + CASE WHEN l.condition = v_listing.condition THEN 0.2 ELSE 0 END
            -- Price similarity (inverse of price difference percentage)
            + CASE 
                WHEN lp.price > 0 AND v_listing.price > 0 
                THEN 0.2 * (1.0 - LEAST(ABS(lp.price - v_listing.price) / GREATEST(lp.price, v_listing.price), 1.0))
                ELSE 0 
              END
            -- Category overlap (up to 0.3 based on % of categories in common)
            + CASE 
                WHEN v_category_ids IS NOT NULL 
                THEN 0.3 * (
                    SELECT COUNT(*)::float / GREATEST(array_length(v_category_ids, 1), 1)
                    FROM public.listing_categories 
                    WHERE listing_id = l.id AND category_id = ANY(v_category_ids)
                )
                ELSE 0
              END
            -- Tag overlap (up to 0.2 based on % of tags in common)
            + CASE 
                WHEN v_tag_ids IS NOT NULL 
                THEN 0.2 * (
                    SELECT COUNT(*)::float / GREATEST(array_length(v_tag_ids, 1), 1)
                    FROM public.listing_tags 
                    WHERE listing_id = l.id AND tag_id = ANY(v_tag_ids)
                )
                ELSE 0
              END
        ) as similarity_score
    FROM 
        public.listings l
    JOIN 
        public.listing_prices lp ON l.id = lp.listing_id AND lp.is_current = true
    WHERE 
        l.id != p_listing_id
        AND l.status = 'published'
        AND l.deleted_at IS NULL
        AND l.store_id = v_listing.store_id  -- Same store
    ORDER BY 
        similarity_score DESC,
        l.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Function to get related listings based on category, tags and brand
CREATE OR REPLACE FUNCTION get_related_listings(
    p_listing_id UUID,
    p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    price DECIMAL(10,2),
    relevance_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH listing_categories AS (
        -- Get categories of the source listing
        SELECT category_id
        FROM public.listing_categories
        WHERE listing_id = p_listing_id
    ),
    listing_tags AS (
        -- Get tags of the source listing
        SELECT tag_id
        FROM public.listing_tags
        WHERE listing_id = p_listing_id
    ),
    listing_brand AS (
        -- Get brand of the source listing
        SELECT brand_id
        FROM public.listings
        WHERE id = p_listing_id
    ),
    candidate_listings AS (
        -- Get listings with matching categories
        SELECT 
            l.id,
            l.title,
            lp.price,
            2 AS category_score  -- Base score for category match
        FROM public.listings l
        JOIN public.listing_categories lc ON l.id = lc.listing_id
        JOIN public.listing_prices lp ON l.id = lp.listing_id AND lp.is_current = true
        WHERE 
            lc.category_id IN (SELECT category_id FROM listing_categories)
            AND l.id != p_listing_id  -- Exclude the source listing
            AND l.status = 'published'  -- Only include active listings
        
        UNION ALL
        
        -- Get listings with matching tags
        SELECT 
            l.id,
            l.title,
            lp.price,
            1 AS category_score  -- Base score for tag match
        FROM public.listings l
        JOIN public.listing_tags lt ON l.id = lt.listing_id
        JOIN public.listing_prices lp ON l.id = lp.listing_id AND lp.is_current = true
        WHERE 
            lt.tag_id IN (SELECT tag_id FROM listing_tags)
            AND l.id != p_listing_id
            AND l.status = 'published'
        
        UNION ALL
        
        -- Get listings with matching brand
        SELECT 
            l.id,
            l.title,
            lp.price,
            3 AS category_score  -- Base score for brand match
        FROM public.listings l
        JOIN public.listing_prices lp ON l.id = lp.listing_id AND lp.is_current = true
        WHERE 
            l.brand_id IN (SELECT brand_id FROM listing_brand)
            AND l.id != p_listing_id
            AND l.status = 'published'
    ),
    scored_listings AS (
        -- Combine and score all candidates
        SELECT 
            id,
            title,
            price,
            SUM(category_score) AS relevance_score
        FROM candidate_listings
        GROUP BY id, title, price
    )
    SELECT 
        id,
        title,
        price,
        relevance_score
    FROM scored_listings
    ORDER BY relevance_score DESC, id
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Automatic notification system for offers and messages
CREATE OR REPLACE FUNCTION notify_listing_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_store_owner_id UUID;
    v_listing_title TEXT;
    v_notification_type TEXT;
    v_notification_data JSONB;
BEGIN
    -- Set notification type based on trigger source
    IF TG_TABLE_NAME = 'listing_offers' THEN
        v_notification_type := 'offer';
    ELSIF TG_TABLE_NAME = 'listing_messages' THEN
        v_notification_type := 'message';
    END IF;
    
    -- Get listing details and store owner
    SELECT l.title, s.owner_id
    INTO v_listing_title, v_store_owner_id
    FROM public.listings l
    JOIN public.stores s ON l.store_id = s.id
    WHERE l.id = NEW.listing_id;
    
    -- Prepare notification data
    v_notification_data := jsonb_build_object(
        'listing_id', NEW.listing_id,
        'listing_title', v_listing_title,
        'notification_type', v_notification_type
    );
    
    -- Add specific data based on notification type
    IF v_notification_type = 'offer' THEN
        v_notification_data := v_notification_data || jsonb_build_object(
            'offer_id', NEW.id,
            'offer_amount', NEW.offer_amount,
            'sender_id', NEW.sender_id
        );
    ELSIF v_notification_type = 'message' THEN
        v_notification_data := v_notification_data || jsonb_build_object(
            'message_id', NEW.id,
            'sender_id', NEW.sender_id,
            'content_preview', substring(NEW.content from 1 for 50)
        );
    END IF;
    
-- Insert notification
    INSERT INTO public.notifications(
        account_id,
        notification_type,
        title,
        content,
        related_entity_id,
        related_entity_type,
        importance,
        created_at
    ) VALUES (
        v_store_owner_id,
        CASE 
            WHEN v_notification_type = 'offer' THEN 'order_update'
            WHEN v_notification_type = 'message' THEN 'message'
            ELSE 'system_alert'
        END,
        CASE 
            WHEN v_notification_type = 'offer' THEN 'New offer received'
            WHEN v_notification_type = 'message' THEN 'New message received'
            ELSE 'New activity on your listing'
        END,
        CASE 
            WHEN v_notification_type = 'offer' THEN 'You received a new offer on ' || v_listing_title
            WHEN v_notification_type = 'message' THEN 'You received a new message about ' || v_listing_title
            ELSE 'There is new activity on your listing: ' || v_listing_title
        END,
        NEW.listing_id,
        'listing',
        'medium',
        now()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-tag a listing based on its description and title
CREATE OR REPLACE FUNCTION auto_tag_listing(
    p_listing_id UUID,
    p_max_tags INTEGER DEFAULT 5
)
RETURNS INTEGER AS $$
DECLARE
    listing_text TEXT;
    tag_count INTEGER := 0;
    tag_record RECORD;
BEGIN
    -- Get listing text (title and description)
    SELECT title || ' ' || COALESCE(description, '') INTO listing_text
    FROM public.listings
    WHERE id = p_listing_id;
    
    IF listing_text IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Find relevant tags based on content similarity
    FOR tag_record IN (
        SELECT 
            t.id,
            ts_rank(
                to_tsvector('english', listing_text),
                to_tsquery('english', regexp_replace(t.name, '\s+', ':* & ', 'g') || ':*')
            ) AS relevance
        FROM public.tags t
        WHERE 
            t.type = 'product'
            AND t.is_active = true
            -- Check if tag name appears in listing text or if there's keyword relevance
            AND (
                listing_text ILIKE '%' || t.name || '%'
                OR to_tsvector('english', listing_text) @@ 
                   to_tsquery('english', regexp_replace(t.name, '\s+', ':* & ', 'g') || ':*')
            )
            -- Skip if this tag is already applied
            AND NOT EXISTS (
                SELECT 1 FROM public.listing_tags 
                WHERE listing_id = p_listing_id AND tag_id = t.id
            )
        ORDER BY relevance DESC
        LIMIT p_max_tags
    )
    LOOP
        -- Apply the tag to the listing
        INSERT INTO public.listing_tags (listing_id, tag_id)
        VALUES (p_listing_id, tag_record.id);
        
        tag_count := tag_count + 1;
    END LOOP;
    
    RETURN tag_count;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for notifications
CREATE TRIGGER notify_new_offer
    AFTER INSERT ON public.listing_offers
    FOR EACH ROW
    WHEN (NEW.status = 'active')
    EXECUTE FUNCTION notify_listing_activity();

CREATE TRIGGER notify_new_message
    AFTER INSERT ON public.listing_messages
    FOR EACH ROW
    WHEN (NEW.parent_message_id IS NULL)
    EXECUTE FUNCTION notify_listing_activity();

-- Create a view for listing analytics
CREATE OR REPLACE VIEW listing_analytics AS
SELECT 
    l.id as listing_id,
    l.title,
    l.store_id,
    s.name as store_name,
    l.status,
    lp.price,
    COUNT(DISTINCT CASE WHEN le.event_type = 'view' THEN le.id END) as view_count,
    COUNT(DISTINCT CASE WHEN le.event_type = 'favorite' THEN le.id END) as favorite_count,
    COUNT(DISTINCT CASE WHEN le.event_type = 'share' THEN le.id END) as share_count,
    COUNT(DISTINCT lo.id) as offer_count,
    COALESCE(MAX(CASE WHEN lo.status = 'active' THEN lo.offer_amount END), 0) as highest_active_offer,
    l.created_at,
    EXTRACT(EPOCH FROM (now() - l.created_at))/86400 as days_listed
FROM 
    public.listings l
JOIN 
    public.stores s ON l.store_id = s.id
LEFT JOIN 
    public.listing_prices lp ON l.id = lp.listing_id AND lp.is_current = true
LEFT JOIN 
    public.listing_events le ON l.id = le.listing_id
LEFT JOIN 
    public.listing_offers lo ON l.id = lo.listing_id
WHERE 
    l.deleted_at IS NULL
GROUP BY 
    l.id, l.title, l.store_id, s.name, l.status, lp.price, l.created_at;

-- Comments and documentation
COMMENT ON FUNCTION listings_search_vector IS 'Creates a weighted search vector for comprehensive listing search';
COMMENT ON FUNCTION search_listings IS 'Powerful listing search with multiple filtering and sorting options';
COMMENT ON FUNCTION duplicate_listing IS 'Creates a copy of an existing listing with optional customizations';
COMMENT ON FUNCTION get_similar_listings IS 'Finds listings similar to a given listing for recommendation features';
COMMENT ON VIEW listing_analytics IS 'Consolidated view of listing performance metrics';
COMMENT ON FUNCTION track_listing_view IS 'Records listing views with rate limiting to prevent inflation';
COMMENT ON FUNCTION notify_listing_activity IS 'Handles notifications for listing interactions like offers and messages';
COMMENT ON FUNCTION auto_tag_listing IS 'Automatically applies relevant tags to a listing based on content analysis';
COMMENT ON FUNCTION get_related_listings IS 'Identifies related listings based on shared categories, tags, and brand';