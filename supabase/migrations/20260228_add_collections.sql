-- Migration: Add Bookmark Collections
-- Date: 2026-02-28

-- ============================================================
-- COLLECTIONS
-- ============================================================
create table if not exists public.collections (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  icon         text,
  description  text,
  is_public    boolean not null default false,
  share_slug   text unique not null default encode(gen_random_bytes(6), 'hex'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists collections_user_id_idx on public.collections(user_id);
create index if not exists collections_share_slug_idx on public.collections(share_slug);

-- ============================================================
-- COLLECTION_ITEMS
-- ============================================================
create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  tool_id       uuid not null references public.tools(id) on delete cascade,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  primary key (collection_id, tool_id)
);

create index if not exists collection_items_collection_id_idx on public.collection_items(collection_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Collections
alter table public.collections enable row level security;

create policy "Users can view their own collections"
  on public.collections for select
  using (auth.uid() = user_id);

create policy "Anyone can view public collections via share_slug"
  on public.collections for select
  using (is_public = true);

create policy "Users can insert their own collections"
  on public.collections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own collections"
  on public.collections for update
  using (auth.uid() = user_id);

create policy "Users can delete their own collections"
  on public.collections for delete
  using (auth.uid() = user_id);

-- Collection Items
alter table public.collection_items enable row level security;

create policy "Users can view items in their own collections"
  on public.collection_items for select
  using (
    collection_id in (
      select id from public.collections where user_id = auth.uid()
    )
  );

create policy "Anyone can view items in public collections"
  on public.collection_items for select
  using (
    collection_id in (
      select id from public.collections where is_public = true
    )
  );

create policy "Users can manage items in their own collections"
  on public.collection_items for all
  using (
    collection_id in (
      select id from public.collections where user_id = auth.uid()
    )
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update bookmark_count on tools
create or replace function public.handle_collection_item_change()
returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') then
    update public.tools set bookmark_count = bookmark_count + 1 where id = new.tool_id;
  elsif (TG_OP = 'DELETE') then
    update public.tools set bookmark_count = bookmark_count - 1 where id = old.tool_id;
  end if;
  return null;
end;
$$;

create trigger on_collection_item_change
  after insert or delete on public.collection_items
  for each row execute procedure public.handle_collection_item_change();
