-- File: supabase/migrations/20250328000000_cart_procedures.sql

-- Get cart items with product details
CREATE OR REPLACE FUNCTION get_cart_with_details(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  listing_id UUID,
  quantity INTEGER,
  added_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  listing_name TEXT,
  listing_price DECIMAL,
  listing_image_url TEXT,
  store_id UUID,
  store_name TEXT,
  store_slug TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.user_id,
    sc.listing_id,
    sc.quantity,
    sc.added_at,
    sc.updated_at,
    l.name AS listing_name,
    l.price AS listing_price,
    l.image_url AS listing_image_url,
    s.id AS store_id,
    s.name AS store_name,
    s.slug AS store_slug
  FROM 
    shopping_cart sc
  JOIN
    listings l ON sc.listing_id = l.id
  JOIN
    stores s ON l.store_id = s.id
  WHERE
    sc.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Count how many users have an item in their cart
CREATE OR REPLACE FUNCTION get_item_interest(listing_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  interest_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO interest_count
  FROM shopping_cart
  WHERE listing_id = listing_id_param;
  
  RETURN interest_count;
END;
$$ LANGUAGE plpgsql;

-- Add to cart with upsert logic
CREATE OR REPLACE FUNCTION add_to_cart(
  user_id_param UUID,
  listing_id_param UUID,
  quantity_param INTEGER
)
RETURNS UUID AS $$
DECLARE
  cart_id UUID;
  existing_quantity INTEGER;
BEGIN
  -- Check if item already exists in cart
  SELECT id, quantity INTO cart_id, existing_quantity
  FROM shopping_cart
  WHERE user_id = user_id_param AND listing_id = listing_id_param;
  
  IF FOUND THEN
    -- Update existing item
    UPDATE shopping_cart
    SET quantity = existing_quantity + quantity_param,
        updated_at = NOW()
    WHERE id = cart_id;
  ELSE
    -- Insert new item
    INSERT INTO shopping_cart (user_id, listing_id, quantity)
    VALUES (user_id_param, listing_id_param, quantity_param)
    RETURNING id INTO cart_id;
  END IF;
  
  RETURN cart_id;
END;
$$ LANGUAGE plpgsql;