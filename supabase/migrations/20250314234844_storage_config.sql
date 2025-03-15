-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true);

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true);

-- Create storage bucket for store logos and banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true);

-- Enable RLS for storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies for the listing-images bucket

-- Public read access for listing images
CREATE POLICY "Public access to listing images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'listing-images');

-- Authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload listing images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'listing-images' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own images
CREATE POLICY "Users can update their own listing images" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'listing-images' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own images
CREATE POLICY "Users can delete their own listing images" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'listing-images' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Set up RLS policies for the user-avatars bucket

-- Public read access for user avatars
CREATE POLICY "Public access to user avatars" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'user-avatars');

-- Users can upload/update their own avatar
CREATE POLICY "Users can manage their own avatars" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'user-avatars' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatars" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'user-avatars' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatars" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'user-avatars' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Set up RLS policies for the store-assets bucket

-- Public read access for store assets
CREATE POLICY "Public access to store assets" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'store-assets');

-- Store owners can upload to their store's folder
CREATE POLICY "Store owners can upload store assets" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'store-assets' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Store owners can update their store assets" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'store-assets' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Store owners can delete their store assets" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'store-assets' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a function to handle image deletions when listings are deleted
CREATE FUNCTION delete_listing_images()
RETURNS TRIGGER AS $$
DECLARE
  image_path TEXT;
BEGIN
  -- Delete entries from listing_images table
  DELETE FROM public.listing_images WHERE listing_id = OLD.id;
  
  -- Note: Actual file deletion from storage would need to be handled by the application
  -- since we need to extract the actual path from image_url
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up images when a listing is deleted
CREATE TRIGGER delete_listing_images_trigger
BEFORE DELETE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION delete_listing_images();