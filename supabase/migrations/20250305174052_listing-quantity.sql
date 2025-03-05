-- Add quantity column to listings table

-- Add quantity column with a default value
ALTER TABLE public.listings 
ADD COLUMN quantity integer NOT NULL DEFAULT 10;