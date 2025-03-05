-- Create a function to set updated_at timestamp first
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create categories table
CREATE TABLE public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  parent_id uuid references public.categories(id),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Add RLS policies for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view categories
CREATE POLICY "Anyone can view categories"
  ON public.categories
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only allow admins to insert, update, or delete categories
-- Note: These would need additional setup with custom claims or admin tables

-- Create indexes for categories
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- Add updated_at trigger for categories
CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Enhance the listings table to include categories
ALTER TABLE public.listings
ADD COLUMN category_id uuid REFERENCES public.categories(id),
ADD COLUMN image_url text,
ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'hidden'));

-- Add index for category lookup
CREATE INDEX idx_listings_category_id ON public.listings(category_id);

-- Add index for faster status filtering
CREATE INDEX idx_listings_status ON public.listings(status);

-- Add function to check if store exists and belongs to user
CREATE OR REPLACE FUNCTION check_store_ownership()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if store exists and belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = NEW.store_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Store not found or does not belong to you';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -- Add trigger to check store ownership before insert/update
-- CREATE TRIGGER check_store_ownership_trigger
-- BEFORE INSERT OR UPDATE ON public.listings
-- FOR EACH ROW
-- EXECUTE FUNCTION check_store_ownership();

-- Add trigger to automatically update the updated_at timestamp
CREATE TRIGGER set_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Update RLS policies for listings
DROP POLICY IF EXISTS "Anyone can view listings" ON public.listings;
CREATE POLICY "Anyone can view active listings"
  ON public.listings
  FOR SELECT
  TO authenticated, anon
  USING (status = 'active' OR auth.uid() IN (
    SELECT user_id FROM stores WHERE id = store_id
  ));

-- Store owners can see all their listings regardless of status
CREATE POLICY "Store owners can view all their listings"
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM stores WHERE id = store_id
    )
  );

-- Add full-text search capabilities
ALTER TABLE public.listings 
ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') || 
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;

CREATE INDEX idx_listings_search ON public.listings USING GIN (search_vector);

-- Create a function to search listings
CREATE OR REPLACE FUNCTION search_listings(
  search_query TEXT,
  category_id_param UUID DEFAULT NULL,
  store_id_param UUID DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  status_param TEXT DEFAULT 'active',
  limit_param INTEGER DEFAULT 10,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  image_url TEXT,
  category_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  store_name TEXT,
  store_slug TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id, 
    l.store_id, 
    l.name, 
    l.description, 
    l.price, 
    l.image_url, 
    l.category_id, 
    l.status, 
    l.created_at, 
    l.updated_at,
    s.name as store_name,
    s.slug as store_slug
  FROM 
    public.listings l
  JOIN 
    public.stores s ON l.store_id = s.id
  WHERE 
    (search_query IS NULL OR l.search_vector @@ to_tsquery('english', search_query)) AND
    (category_id_param IS NULL OR l.category_id = category_id_param) AND
    (store_id_param IS NULL OR l.store_id = store_id_param) AND
    (min_price IS NULL OR l.price >= min_price) AND
    (max_price IS NULL OR l.price <= max_price) AND
    (status_param IS NULL OR l.status = status_param)
  ORDER BY 
    CASE 
      WHEN search_query IS NOT NULL THEN ts_rank(l.search_vector, to_tsquery('english', search_query))
      ELSE NULL
    END DESC NULLS LAST,
    l.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;