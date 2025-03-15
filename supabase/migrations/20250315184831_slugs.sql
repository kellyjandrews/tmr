-- Migration script to add slug columns to categories and tags tables
-- File: supabase/migrations/20250316000000_add_slug_columns.sql

-- Add slug column to categories table
ALTER TABLE public.categories
ADD COLUMN slug TEXT;

-- Add unique constraint on category slugs
ALTER TABLE public.categories
ADD CONSTRAINT categories_slug_unique UNIQUE (slug);

-- Add slug column to tags table
ALTER TABLE public.tags
ADD COLUMN slug TEXT;

-- Add unique constraint on tag slugs
ALTER TABLE public.tags
ADD CONSTRAINT tags_slug_unique UNIQUE (slug);

-- Create a trigger function to automatically generate slugs for categories
CREATE OR REPLACE FUNCTION generate_category_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if it's not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'));
    NEW.slug := regexp_replace(NEW.slug, '\s+', '-', 'g');
  END IF;

  -- Check if slug already exists, append a counter if needed
  DECLARE
    counter INTEGER := 1;
    original_slug TEXT := NEW.slug;
    exists_already BOOLEAN;
  BEGIN
    LOOP
      SELECT EXISTS(
        SELECT 1 FROM public.categories 
        WHERE slug = NEW.slug AND id != NEW.id
      ) INTO exists_already;
      
      EXIT WHEN NOT exists_already;
      
      NEW.slug := original_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate category slugs
CREATE TRIGGER categories_before_insert_update
BEFORE INSERT OR UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION generate_category_slug();

-- Create a trigger function to automatically generate slugs for tags
CREATE OR REPLACE FUNCTION generate_tag_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if it's not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'));
    NEW.slug := regexp_replace(NEW.slug, '\s+', '-', 'g');
  END IF;

  -- Check if slug already exists, append a counter if needed
  DECLARE
    counter INTEGER := 1;
    original_slug TEXT := NEW.slug;
    exists_already BOOLEAN;
  BEGIN
    LOOP
      SELECT EXISTS(
        SELECT 1 FROM public.tags 
        WHERE slug = NEW.slug AND id != NEW.id
      ) INTO exists_already;
      
      EXIT WHEN NOT exists_already;
      
      NEW.slug := original_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate tag slugs
CREATE TRIGGER tags_before_insert_update
BEFORE INSERT OR UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION generate_tag_slug();

-- Update existing records with slugs
-- This will trigger the above functions to generate slugs
UPDATE public.categories SET name = name;
UPDATE public.tags SET name = name;