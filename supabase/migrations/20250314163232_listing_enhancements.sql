-- Create listing_images table for multiple images per listing
CREATE TABLE IF NOT EXISTS public.listing_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON public.listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_display_order ON public.listing_images(display_order);

-- Enable RLS on listing_images
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for listing_images
CREATE POLICY "Anyone can view listing images" 
  ON public.listing_images
  FOR SELECT
  USING (true);

CREATE POLICY "Store owners can insert listing images" 
  ON public.listing_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can update listing images" 
  ON public.listing_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can delete listing images" 
  ON public.listing_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );

-- Create listing_categories table for multiple categories per listing
CREATE TABLE IF NOT EXISTS public.listing_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure a listing cannot be in the same category twice
  CONSTRAINT unique_listing_category UNIQUE (listing_id, category_id)
);

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_listing_categories_listing_id ON public.listing_categories(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_categories_category_id ON public.listing_categories(category_id);

-- Enable RLS on listing_categories
ALTER TABLE public.listing_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for listing_categories
CREATE POLICY "Anyone can view listing categories" 
  ON public.listing_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Store owners can insert listing categories" 
  ON public.listing_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can update listing categories" 
  ON public.listing_categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can delete listing categories" 
  ON public.listing_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );

-- Create listing_shipping table for shipping information
CREATE TABLE IF NOT EXISTS public.listing_shipping (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  flat_rate decimal(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure a listing has only one shipping record
  CONSTRAINT unique_listing_shipping UNIQUE (listing_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_listing_shipping_listing_id ON public.listing_shipping(listing_id);

-- Enable RLS on listing_shipping
ALTER TABLE public.listing_shipping ENABLE ROW LEVEL SECURITY;

-- RLS policies for listing_shipping
CREATE POLICY "Anyone can view listing shipping" 
  ON public.listing_shipping
  FOR SELECT
  USING (true);

CREATE POLICY "Store owners can insert listing shipping" 
  ON public.listing_shipping
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can update listing shipping" 
  ON public.listing_shipping
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can delete listing shipping" 
  ON public.listing_shipping
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );

  -- Create trigger function for updating the updated_at timestamp
  CREATE OR REPLACE FUNCTION update_modified_column()
     RETURNS TRIGGER 
     LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$;

-- Add triggers to update the updated_at column
CREATE TRIGGER set_listing_images_updated_at
BEFORE UPDATE ON public.listing_images
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_listing_shipping_updated_at
BEFORE UPDATE ON public.listing_shipping
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add storage bucket configuration for listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the listing-images bucket
CREATE POLICY "Public access to listing images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'listing-images' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own images" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'listing-images' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own images" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'listing-images' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );