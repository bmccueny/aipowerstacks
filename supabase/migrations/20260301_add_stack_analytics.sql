-- Migration: Add Stack Analytics (Views & Saves)
-- Date: 2026-03-01

-- Add view_count, save_count, and source_collection_id to collections
alter table public.collections add column if not exists view_count integer not null default 0;
alter table public.collections add column if not exists save_count integer not null default 0;
alter table public.collections add column if not exists source_collection_id uuid references public.collections(id) on delete set null;

-- Function to increment view count
create or replace function public.increment_stack_view(collection_id uuid)
returns void as $$
begin
  update public.collections
  set view_count = view_count + 1
  where id = collection_id;
end;
$$ language plpgsql security definer;

-- Function to increment save count
create or replace function public.increment_save_count(collection_id uuid)
returns void as $$
begin
  update public.collections
  set save_count = save_count + 1
  where id = collection_id;
end;
$$ language plpgsql security definer;
