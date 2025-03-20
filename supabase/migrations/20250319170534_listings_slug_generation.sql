-- Migration file for listing slug generation
-- Creates function and trigger to auto-generate slugs for listings

-- First, add a slug column to the listings table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Function to generate a slug from the listing name
CREATE OR REPLACE FUNCTION generate_listing_slug()
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
        SELECT 1 FROM public.listings 
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

-- Create or replace the trigger for listings
DROP TRIGGER IF EXISTS listings_before_insert_update ON public.listings;

CREATE TRIGGER listings_before_insert_update
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION generate_listing_slug();

-- Update all existing listings to have slugs
UPDATE public.listings SET slug = NULL WHERE slug IS NULL OR slug = '';

-- Add a unique constraint to the slug column if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'listings_slug_unique' AND conrelid = 'public.listings'::regclass
  ) THEN
    ALTER TABLE public.listings ADD CONSTRAINT listings_slug_unique UNIQUE (slug);
  END IF;
END $$;