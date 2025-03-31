-- Create listings table with all core fields
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'hidden', 'sold')) DEFAULT 'draft',
  image_url TEXT, -- Main/primary image
  category_id UUID REFERENCES public.categories(id),
  views_count INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  is_digital BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for faster lookups
CREATE INDEX idx_listings_store_id ON public.listings(store_id);
CREATE INDEX idx_listings_category_id ON public.listings(category_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_price ON public.listings(price);
CREATE INDEX idx_listings_created_at ON public.listings(created_at);

-- Add trigger to automatically update updated_at column
CREATE TRIGGER set_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add full-text search capabilities
ALTER TABLE public.listings 
ADD COLUMN search_vector TSVECTOR GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') || 
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;

CREATE INDEX idx_listings_search ON public.listings USING GIN (search_vector);

-- Create a function to search listings
CREATE FUNCTION search_listings(
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

-- Enable Row Level Security
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies 
-- Anyone can view active listings
CREATE POLICY "Anyone can view active listings"
  ON public.listings
  FOR SELECT
   USING (status = 'active');

-- Store owners can view all their listings regardless of status
CREATE POLICY "Store owners can view all their listings"
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM stores WHERE id = store_id
    )
  );

-- Store owners can create listings
CREATE POLICY "Store owners can create listings"
  ON public.listings
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM stores WHERE id = store_id
    )
  );

-- Store owners can update listings
CREATE POLICY "Store owners can update listings"
  ON public.listings
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM stores WHERE id = store_id
    )
  );

-- Store owners can delete listings
CREATE POLICY "Store owners can delete listings"
  ON public.listings
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM stores WHERE id = store_id
    )
  );