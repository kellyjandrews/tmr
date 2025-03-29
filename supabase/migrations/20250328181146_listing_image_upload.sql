-- File: supabase/migrations/20250329150001_listing_image_upload_sproc.sql

-- Create a function to generate a unique filename for uploads
CREATE OR REPLACE FUNCTION generate_unique_filename(
    extension TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    unique_id TEXT;
BEGIN
    -- Generate a unique ID based on UUID
    unique_id := replace(uuid_generate_v4()::text, '-', '');
    
    -- Return filename with extension
    RETURN unique_id || '.' || extension;
END;
$$;

-- Generate a signed URL for image upload
CREATE OR REPLACE FUNCTION get_listing_image_upload_url(
    user_id_param UUID,
    content_type TEXT
)
RETURNS TABLE (
    upload_url TEXT,
    storage_path TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_extension TEXT;
    v_filename TEXT;
    v_path TEXT;
    v_url TEXT;
BEGIN
    -- Extract file extension from content type
    CASE
        WHEN content_type = 'image/jpeg' THEN v_extension := 'jpg';
        WHEN content_type = 'image/png' THEN v_extension := 'png';
        WHEN content_type = 'image/gif' THEN v_extension := 'gif';
        WHEN content_type = 'image/webp' THEN v_extension := 'webp';
        ELSE v_extension := 'unknown';
    END CASE;
    
    -- Generate unique filename
    v_filename := generate_unique_filename(v_extension);
    
    -- Create path: user_id/listings/filename
    v_path := user_id_param || '/listings/' || v_filename;
    
    -- Generate signed URL for upload
    v_url := storage.create_signed_upload_url('listing-images', v_path);
    
    -- Return URL and path
    upload_url := v_url;
    storage_path := v_path;
    
    RETURN NEXT;
END;
$$;

-- Check if user has permission to delete an image
CREATE OR REPLACE FUNCTION can_delete_listing_image(
    user_id_param UUID,
    image_path TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    path_parts TEXT[];
BEGIN
    -- Split the path to extract user_id
    path_parts := string_to_array(image_path, '/');
    
    -- Check if path starts with user_id
    IF path_parts[1] = user_id_param::text THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION generate_unique_filename TO authenticated;
GRANT EXECUTE ON FUNCTION get_listing_image_upload_url TO authenticated;
GRANT EXECUTE ON FUNCTION can_delete_listing_image TO authenticated;