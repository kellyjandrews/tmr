-- Create types for better organization
CREATE TYPE listing_data AS (
    name text,
    description text,
    price decimal,
    quantity integer,
    status text,
    store_id uuid,
    image_url text,
    slug text
);

CREATE TYPE listing_result AS (
    id uuid,
    name text,
    description text,
    price decimal,
    quantity integer,
    status text,
    store_id uuid,
    image_url text,
    slug text,
    created_at timestamptz,
    updated_at timestamptz
);

-- Create Listing
CREATE OR REPLACE FUNCTION create_listing(
    p_listing listing_data,
    p_categories uuid[],
    p_images jsonb[],
    p_shipping_cost decimal,
    p_user_id uuid
)
RETURNS listing_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_store_id uuid;
    v_listing_id uuid;
    v_result listing_result;
BEGIN
    -- Verify user owns the store
    SELECT id INTO v_store_id
    FROM stores
    WHERE user_id = p_user_id
    AND id = p_listing.store_id;

    IF v_store_id IS NULL THEN
        RAISE EXCEPTION 'User does not own this store';
    END IF;

    -- Insert listing
    INSERT INTO listings (
        name, description, price, quantity, status,
        store_id, image_url, slug
    )
    VALUES (
        p_listing.name, p_listing.description, p_listing.price,
        p_listing.quantity, p_listing.status, v_store_id,
        p_listing.image_url, p_listing.slug
    )
    RETURNING * INTO v_result;

    -- Insert categories
    INSERT INTO listing_categories (listing_id, category_id)
    SELECT v_result.id, unnest(p_categories);

    -- Insert images
    INSERT INTO listing_images (listing_id, image_url, display_order)
    SELECT v_result.id, (value->>'image_url')::text, (value->>'display_order')::int
    FROM unnest(p_images) WITH ORDINALITY AS a(value, idx);

    -- Insert shipping
    IF p_shipping_cost IS NOT NULL THEN
        INSERT INTO listing_shipping (listing_id, flat_rate)
        VALUES (v_result.id, p_shipping_cost);
    END IF;

    RETURN v_result;
END;
$$;

-- Update Listing
CREATE OR REPLACE FUNCTION update_listing(
    p_listing_id uuid,
    p_listing listing_data,
    p_categories uuid[],
    p_images jsonb[],
    p_shipping_cost decimal,
    p_user_id uuid
)
RETURNS listing_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result listing_result;
BEGIN
    -- Verify user owns the listing
    IF NOT EXISTS (
        SELECT 1 FROM listings l
        JOIN stores s ON s.id = l.store_id
        WHERE l.id = p_listing_id
        AND s.user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User does not own this listing';
    END IF;

    -- Update listing
    UPDATE listings
    SET name = p_listing.name,
        description = p_listing.description,
        price = p_listing.price,
        quantity = p_listing.quantity,
        status = p_listing.status,
        image_url = p_listing.image_url,
        slug = p_listing.slug,
        updated_at = NOW()
    WHERE id = p_listing_id
    RETURNING * INTO v_result;

    -- Update categories
    DELETE FROM listing_categories WHERE listing_id = p_listing_id;
    INSERT INTO listing_categories (listing_id, category_id)
    SELECT p_listing_id, unnest(p_categories);

    -- Update images
    DELETE FROM listing_images WHERE listing_id = p_listing_id;
    INSERT INTO listing_images (listing_id, image_url, display_order)
    SELECT p_listing_id, (value->>'image_url')::text, (value->>'display_order')::int
    FROM unnest(p_images) WITH ORDINALITY AS a(value, idx);

    -- Update shipping
    DELETE FROM listing_shipping WHERE listing_id = p_listing_id;
    IF p_shipping_cost IS NOT NULL THEN
        INSERT INTO listing_shipping (listing_id, flat_rate)
        VALUES (p_listing_id, p_shipping_cost);
    END IF;

    RETURN v_result;
END;
$$;

-- Delete Listing
CREATE OR REPLACE FUNCTION delete_listing(
    p_listing_id uuid,
    p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify user owns the listing
    IF NOT EXISTS (
        SELECT 1 FROM listings l
        JOIN stores s ON s.id = l.store_id
        WHERE l.id = p_listing_id
        AND s.user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User does not own this listing';
    END IF;

    -- Delete related records
    DELETE FROM listing_categories WHERE listing_id = p_listing_id;
    DELETE FROM listing_images WHERE listing_id = p_listing_id;
    DELETE FROM listing_shipping WHERE listing_id = p_listing_id;
    DELETE FROM listings WHERE id = p_listing_id;

    RETURN TRUE;
END;
$$;

-- Get Listing for Edit
CREATE OR REPLACE FUNCTION get_listing_for_edit(
    p_listing_id uuid,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'listing', jsonb_build_object(
            'id', l.id,
            'name', l.name,
            'description', l.description,
            'price', l.price,
            'quantity', l.quantity,
            'status', l.status,
            'store_id', l.store_id,
            'image_url', l.image_url,
            'slug', l.slug
        ),
        'categories', (
            SELECT jsonb_agg(category_id)
            FROM listing_categories
            WHERE listing_id = l.id
        ),
        'images', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'image_url', image_url,
                    'display_order', display_order
                )
            )
            FROM listing_images
            WHERE listing_id = l.id
            ORDER BY display_order
        ),
        'shipping', (
            SELECT jsonb_build_object('flat_rate', flat_rate)
            FROM listing_shipping
            WHERE listing_id = l.id
        )
    ) INTO v_result
    FROM listings l
    JOIN stores s ON s.id = l.store_id
    WHERE l.id = p_listing_id
    AND s.user_id = p_user_id;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Listing not found or access denied';
    END IF;

    RETURN v_result;
END;
$$;
