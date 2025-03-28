-- supabase/migrations/20250328150000_account_sprocs.sql

-- Create a stored procedure to update a user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  user_id_param UUID,
  full_name_param TEXT DEFAULT NULL,
  bio_param TEXT DEFAULT NULL,
  avatar_url_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = user_id_param
  ) INTO profile_exists;
  
  IF profile_exists THEN
    -- Update existing profile
    UPDATE profiles
    SET 
      full_name = COALESCE(full_name_param, full_name),
      bio = COALESCE(bio_param, bio),
      avatar_url = COALESCE(avatar_url_param, avatar_url),
      updated_at = NOW()
    WHERE id = user_id_param;
  ELSE
    -- Get user email from auth.users
    DECLARE user_email TEXT;
    BEGIN
      SELECT email INTO user_email
      FROM auth.users
      WHERE id = user_id_param;
      
      -- Create new profile
      INSERT INTO profiles (
        id, 
        email, 
        full_name, 
        bio, 
        avatar_url
      )
      VALUES (
        user_id_param,
        user_email,
        full_name_param,
        bio_param,
        avatar_url_param
      );
    END;
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Create a stored procedure to get user profile data
CREATE OR REPLACE FUNCTION get_user_profile(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.bio,
    p.avatar_url,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = user_id_param;
  
  -- If no profile exists, try to get just the basic info from auth.users
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      u.id,
      u.email,
      NULL::TEXT as full_name,
      NULL::TEXT as bio,
      NULL::TEXT as avatar_url,
      u.created_at,
      u.created_at as updated_at
    FROM auth.users u
    WHERE u.id = user_id_param;
  END IF;
END;
$$;

-- Create a stored procedure to delete a user account and all associated data
CREATE OR REPLACE FUNCTION delete_user_account(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete profile
  DELETE FROM profiles WHERE id = user_id_param;
  
  -- Delete all store-related data
  DELETE FROM stores WHERE user_id = user_id_param;
  
  -- Delete wishlist items
  DELETE FROM wishlists WHERE user_id = user_id_param;
  
  -- Delete follows
  DELETE FROM follows WHERE user_id = user_id_param;
  
  -- Delete shopping cart
  DELETE FROM shopping_cart WHERE user_id = user_id_param;
  
  -- Note: This doesn't delete the actual auth.users record
  -- That would need to be done via Supabase auth.admin.deleteUser
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Grant execute privileges to authenticated users
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_account TO authenticated;