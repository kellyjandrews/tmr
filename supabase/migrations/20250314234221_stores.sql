

-- Create stores table with additional business fields
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  welcome_message TEXT,
  shipping_policy TEXT,
  return_policy TEXT,
  tax_policy TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Add a unique constraint to ensure store slugs are unique
  CONSTRAINT stores_slug_unique UNIQUE (slug)
);

-- Create index for faster lookups by user_id
CREATE INDEX idx_stores_user_id ON public.stores(user_id);

-- Add trigger to automatically update updated_at column
CREATE TRIGGER set_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add a trigger to automatically generate a slug when a store is created
CREATE FUNCTION stores_trigger_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if it's not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stores_before_insert
BEFORE INSERT ON stores
FOR EACH ROW
EXECUTE FUNCTION stores_trigger_before_insert();

-- Enable Row Level Security
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Store owners can view, edit, and manage their own stores
CREATE POLICY "Users can view their own stores" 
ON public.stores 
FOR SELECT 
USING (auth.uid() = user_id);

-- Anyone can view all stores (for public marketplace)
CREATE POLICY "Public can view all stores" 
ON public.stores 
FOR SELECT 
TO anon 
USING (true);

-- Authenticated users can create their own store
CREATE POLICY "Users can create their own store"
ON public.stores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update only their own store
CREATE POLICY "Users can update their own store"
ON public.stores
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete only their own store
CREATE POLICY "Users can delete their own store"
ON public.stores
FOR DELETE
USING (auth.uid() = user_id);