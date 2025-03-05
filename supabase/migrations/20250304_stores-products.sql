-- Create a stores table that's associated with auth.users
create table public.stores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  
  -- Add a unique constraint to ensure store slugs are unique
  constraint stores_slug_unique unique (slug)
);

-- Add RLS policies for the stores table
alter table public.stores enable row level security;

-- Create policy to allow users to select their own store
create policy "Users can view their own store"
  on public.stores
  for select
  using (auth.uid() = user_id);

-- Create policy to allow users to insert their own store
create policy "Users can create their own store"
  on public.stores
  for insert
  with check (auth.uid() = user_id);

-- Create policy to allow users to update their own store
create policy "Users can update their own store"
  on public.stores
  for update
  using (auth.uid() = user_id);

-- Create listings table
create table public.listings (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  description text,
  price decimal(10, 2) not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Add RLS policies for the listings table
alter table public.listings enable row level security;

-- Create policy to allow anyone to view listings
create policy "Anyone can view listings"
  on public.listings
  for select
  to authenticated, anon
  using (true);

-- Create policy to allow store owners to insert listings
create policy "Store owners can create listings"
  on public.listings
  for insert
  with check (
    auth.uid() in (
      select user_id from stores where id = store_id
    )
  );

-- Create policy to allow store owners to update listings
create policy "Store owners can update listings"
  on public.listings
  for update
  using (
    auth.uid() in (
      select user_id from stores where id = store_id
    )
  );

-- Create policy to allow store owners to delete listings
create policy "Store owners can delete listings"
  on public.listings
  for delete
  using (
    auth.uid() in (
      select user_id from stores where id = store_id
    )
  );

-- Create function to generate slug from store name
create or replace function generate_slug(name text)
returns text as $$
declare
  slug text;
  base_slug text;
  counter integer := 0;
begin
  -- Convert to lowercase and replace spaces and special chars with hyphens
  base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  -- Start with the base slug
  slug := base_slug;
  
  -- Check if the slug already exists, if so, append a counter
  while exists(select 1 from stores where slug = slug) loop
    counter := counter + 1;
    slug := base_slug || '-' || counter;
  end loop;
  
  return slug;
end;
$$ language plpgsql;

-- Add a trigger to automatically generate a slug when a store is created
create or replace function stores_trigger_before_insert()
returns trigger as $$
begin
  -- Only generate slug if it's not provided
  if new.slug is null or new.slug = '' then
    new.slug := generate_slug(new.name);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger stores_before_insert
before insert on stores
for each row
execute function stores_trigger_before_insert();