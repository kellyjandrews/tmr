-- Create junction table for listing categories
CREATE TABLE public.listing_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure a listing cannot be in the same category twice
  CONSTRAINT unique_listing_category UNIQUE (listing_id, category_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_listing_categories_listing_id ON public.listing_categories(listing_id);
CREATE INDEX idx_listing_categories_category_id ON public.listing_categories(category_id);

-- Create table for listing images
CREATE TABLE public.listing_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX idx_listing_images_listing_id ON public.listing_images(listing_id);
CREATE INDEX idx_listing_images_display_order ON public.listing_images(display_order);

-- Add trigger to automatically update updated_at column
CREATE TRIGGER set_listing_images_updated_at
BEFORE UPDATE ON public.listing_images
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create table for listing shipping options
CREATE TABLE public.listing_shipping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  flat_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  free_shipping BOOLEAN NOT NULL DEFAULT false,
  ships_from TEXT,
  ships_to TEXT[] DEFAULT ARRAY['worldwide'],
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure a listing has only one shipping record
  CONSTRAINT unique_listing_shipping UNIQUE (listing_id)
);

-- Create index for faster lookups
CREATE INDEX idx_listing_shipping_listing_id ON public.listing_shipping(listing_id);

-- Add trigger to automatically update updated_at column
CREATE TRIGGER set_listing_shipping_updated_at
BEFORE UPDATE ON public.listing_shipping
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create junction table for listing tags
CREATE TABLE public.listing_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure a listing cannot have the same tag twice
  CONSTRAINT unique_listing_tag UNIQUE (listing_id, tag_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_listing_tags_listing_id ON public.listing_tags(listing_id);
CREATE INDEX idx_listing_tags_tag_id ON public.listing_tags(tag_id);

-- Enable Row Level Security for all tables
ALTER TABLE public.listing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_shipping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for listing_categories
CREATE POLICY "Anyone can view listing categories" 
  ON public.listing_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Store owners can manage listing categories" 
  ON public.listing_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );

-- Create RLS policies for listing_images
CREATE POLICY "Anyone can view listing images" 
  ON public.listing_images
  FOR SELECT
  USING (true);

CREATE POLICY "Store owners can manage listing images" 
  ON public.listing_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );

-- Create RLS policies for listing_shipping
CREATE POLICY "Anyone can view listing shipping" 
  ON public.listing_shipping
  FOR SELECT
  USING (true);

CREATE POLICY "Store owners can manage listing shipping" 
  ON public.listing_shipping
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );

-- Create RLS policies for listing_tags
CREATE POLICY "Anyone can view listing tags" 
  ON public.listing_tags
  FOR SELECT
  USING (true);

CREATE POLICY "Store owners can manage listing tags" 
  ON public.listing_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );