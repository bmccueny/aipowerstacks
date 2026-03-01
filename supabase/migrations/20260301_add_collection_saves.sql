-- Migration: Add Collection Saves (Linking)
-- Date: 2026-03-01

create table if not exists public.collection_saves (
  user_id       uuid not null references auth.users(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, collection_id)
);

-- RLS
alter table public.collection_saves enable row level security;

create policy "Users can view all collection saves" on public.collection_saves
  for select using (true);

create policy "Users can save collections" on public.collection_saves
  for insert with check (auth.uid() = user_id);

create policy "Users can unsave collections" on public.collection_saves
  for delete using (auth.uid() = user_id);

-- Add indexes
create index if not exists collection_saves_user_id_idx on public.collection_saves(user_id);
create index if not exists collection_saves_collection_id_idx on public.collection_saves(collection_id);
