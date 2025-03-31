-- Create categories table with hierarchical structure
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for faster lookups
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_display_order ON public.categories(display_order);

-- Add trigger to automatically update updated_at column
CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create tags table for additional item organization
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure tag names are unique
  CONSTRAINT tags_name_unique UNIQUE (name)
);

-- Add trigger to automatically update updated_at column
CREATE TRIGGER set_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security for both tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories
-- Anyone can view categories
CREATE POLICY "Anyone can view categories"
  ON public.categories
  FOR SELECT
  USING (true);

-- Only allow system to modify categories (this will be handled by admin users later)
CREATE POLICY "System can manage categories"
  ON public.categories
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create RLS policies for tags
-- Anyone can view tags
CREATE POLICY "Anyone can view tags"
  ON public.tags
  FOR SELECT
  USING (true);

-- Users can create custom tags
CREATE POLICY "Users can create tags"
  ON public.tags
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    is_system = false
  );

-- Users can update only non-system tags
CREATE POLICY "Users can update non-system tags"
  ON public.tags
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND 
    is_system = false
  );

-- Users can delete only non-system tags
CREATE POLICY "Users can delete non-system tags"
  ON public.tags
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND 
    is_system = false
  );