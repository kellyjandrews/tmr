
CREATE TABLE public.tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamp with time zone default now() not null
);

CREATE TABLE public.listing_tags (
  listing_id uuid references public.listings(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (listing_id, tag_id)
);