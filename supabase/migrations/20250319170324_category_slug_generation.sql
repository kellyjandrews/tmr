-- Migration file for category slug generation
-- Creates function and trigger to auto-generate slugs for categories

-- Function to generate a slug from the category name
CREATE OR REPLACE FUNCTION generate_category_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if it's not provided or empty
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Convert to lowercase and replace spaces and special chars with hyphens
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'));
    NEW.slug := regexp_replace(NEW.slug, '\s+', '-', 'g');
  END IF;

  -- Check if the slug already exists, append a counter if needed
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

-- Create or replace the trigger for new categories
DROP TRIGGER IF EXISTS categories_before_insert_update ON public.categories;

CREATE TRIGGER categories_before_insert_update
BEFORE INSERT OR UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION generate_category_slug();

-- Make sure all existing categories have slugs
UPDATE public.categories SET slug = NULL WHERE slug IS NULL OR slug = '';

-- Add a unique constraint to the slug column if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'categories_slug_unique' AND conrelid = 'public.categories'::regclass
  ) THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);
  END IF;
END $$;