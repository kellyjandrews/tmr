-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function for managing updated_at timestamps
CREATE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate slugs from text
CREATE FUNCTION generate_slug(input_text text)
RETURNS text AS $$
DECLARE
  slug_text text;
  base_slug text;
  counter integer := 0;
BEGIN
  -- Convert to lowercase and replace spaces and special chars with hyphens
  base_slug := lower(regexp_replace(input_text, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  -- Start with the base slug
  slug_text := base_slug;
  
  -- Check if the slug already exists, if so, append a counter
  WHILE EXISTS(SELECT 1 FROM stores WHERE slug = slug_text) LOOP
    counter := counter + 1;
    slug_text := base_slug || '-' || counter;
  END LOOP;
  
  RETURN slug_text;
END;
$$ LANGUAGE plpgsql;

-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Add trigger to automatically update updated_at column
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();