-- File: supabase/migrations/20250328145853_favorites_sprocs.sql

-- ==================== WISHLIST FUNCTIONS ====================

-- Add an item to the wishlist with upsert logic
CREATE OR REPLACE FUNCTION add_to_wishlist(
  user_id_param UUID,
  listing_id_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wishlist_id UUID;
BEGIN
  -- Check if the item is already in the wishlist
  SELECT id INTO wishlist_id
  FROM wishlists
  WHERE user_id = user_id_param AND listing_id = listing_id_param;
  
  IF FOUND THEN
    -- Update existing wishlist item if notes were provided
    IF notes_param IS NOT NULL THEN
      UPDATE wishlists
      SET notes = notes_param
      WHERE id = wishlist_id;
    END IF;
  ELSE
    -- Insert new wishlist item
    INSERT INTO wishlists (user_id, listing_id, notes)
    VALUES (user_id_param, listing_id_param, notes_param)
    RETURNING id INTO wishlist_id;
  END IF;
  
  RETURN wishlist_id;
END;
$$;

-- Remove an item from the wishlist
CREATE OR REPLACE FUNCTION remove_from_wishlist(
  user_id_param UUID,
  listing_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM wishlists
  WHERE user_id = user_id_param AND listing_id = listing_id_param
  RETURNING 1 INTO rows_deleted;
  
  -- Return true if rows were deleted, false otherwise
  RETURN rows_deleted > 0;
END;
$$;

-- Check if a listing is in the user's wishlist
CREATE OR REPLACE FUNCTION is_in_wishlist(
  user_id_param UUID,
  listing_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM wishlists
    WHERE user_id = user_id_param AND listing_id = listing_id_param
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Get the user's wishlist with listing details
CREATE OR REPLACE FUNCTION get_user_wishlist(
  user_id_param UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  listing_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ,
  listing_name TEXT,
  listing_slug TEXT, 
  listing_description TEXT,
  listing_price DECIMAL,
  listing_image_url TEXT,
  listing_status TEXT,
  store_id UUID,
  store_name TEXT,
  store_slug TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.user_id,
    w.listing_id,
    w.notes,
    w.created_at,
    l.name AS listing_name,
    l.slug AS listing_slug,
    l.description AS listing_description,
    l.price AS listing_price,
    l.image_url AS listing_image_url,
    l.status AS listing_status,
    s.id AS store_id,
    s.name AS store_name,
    s.slug AS store_slug
  FROM 
    wishlists w
  JOIN
    listings l ON w.listing_id = l.id
  JOIN
    stores s ON l.store_id = s.id
  WHERE
    w.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Get the count of users who have favorited a listing
CREATE OR REPLACE FUNCTION get_listing_favorites_count(
  listing_id_param UUID
)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO count
  FROM wishlists
  WHERE listing_id = listing_id_param;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- ==================== STORE FOLLOW FUNCTIONS ====================

-- Follow a store with upsert logic
CREATE OR REPLACE FUNCTION follow_store(
  user_id_param UUID,
  store_id_param UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follow_id UUID;
BEGIN
  -- Check if already following
  SELECT id INTO follow_id
  FROM follows
  WHERE user_id = user_id_param AND store_id = store_id_param;
  
  IF FOUND THEN
    -- Already following, do nothing
    NULL;
  ELSE
    -- Insert new follow
    INSERT INTO follows (user_id, store_id)
    VALUES (user_id_param, store_id_param)
    RETURNING id INTO follow_id;
  END IF;
  
  RETURN follow_id;
END;
$$;

-- Unfollow a store
CREATE OR REPLACE FUNCTION unfollow_store(
  user_id_param UUID,
  store_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM follows
  WHERE user_id = user_id_param AND store_id = store_id_param
  RETURNING 1 INTO rows_deleted;
  
  -- Return true if rows were deleted, false otherwise
  RETURN rows_deleted > 0;
END;
$$;

-- Check if a user is following a store
CREATE OR REPLACE FUNCTION is_following_store(
  user_id_param UUID,
  store_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM follows
    WHERE user_id = user_id_param AND store_id = store_id_param
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Get all stores followed by the user
CREATE OR REPLACE FUNCTION get_followed_stores(
  user_id_param UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  store_id UUID,
  created_at TIMESTAMPTZ,
  store_name TEXT,
  store_slug TEXT,
  store_description TEXT,
  store_location TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.user_id,
    f.store_id,
    f.created_at,
    s.name AS store_name,
    s.slug AS store_slug,
    s.description AS store_description,
    s.location AS store_location
  FROM 
    follows f
  JOIN
    stores s ON f.store_id = s.id
  WHERE
    f.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Get the count of followers for a store
CREATE OR REPLACE FUNCTION get_store_followers_count(
  store_id_param UUID
)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO count
  FROM follows
  WHERE store_id = store_id_param;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute privileges to authenticated users
GRANT EXECUTE ON FUNCTION add_to_wishlist TO authenticated;
GRANT EXECUTE ON FUNCTION remove_from_wishlist TO authenticated;
GRANT EXECUTE ON FUNCTION is_in_wishlist TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_wishlist TO authenticated;
GRANT EXECUTE ON FUNCTION get_listing_favorites_count TO authenticated;
GRANT EXECUTE ON FUNCTION follow_store TO authenticated;
GRANT EXECUTE ON FUNCTION unfollow_store TO authenticated;
GRANT EXECUTE ON FUNCTION is_following_store TO authenticated;
GRANT EXECUTE ON FUNCTION get_followed_stores TO authenticated;
GRANT EXECUTE ON FUNCTION get_store_followers_count TO authenticated;