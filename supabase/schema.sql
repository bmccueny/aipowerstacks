-- AI Tools Directory — Supabase Schema
-- Run this in Supabase SQL Editor

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique,
  display_name text,
  avatar_url   text,
  bio          text,
  website      text,
  role         text not null default 'user'
                 check (role in ('user', 'editor', 'admin')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  icon        text,
  color       text,
  tool_count  integer not null default 0,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists categories_slug_idx on public.categories (slug);

-- ============================================================
-- TAGS
-- ============================================================
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TOOLS
-- ============================================================
create table if not exists public.tools (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  tagline          text not null,
  description      text not null,
  website_url      text not null,
  logo_url         text,
  screenshot_urls  jsonb not null default '[]'::jsonb,
  category_id      uuid not null references public.categories(id),
  pricing_model    text not null default 'unknown'
                     check (pricing_model in ('free','freemium','paid','trial','contact','unknown')),
  pricing_details  text,
  use_cases        text[],
  is_verified      boolean not null default false,
  is_featured      boolean not null default false,
  is_supertools    boolean not null default false,
  is_editors_pick  boolean not null default false,
  status           text not null default 'pending'
                     check (status in ('pending','published','rejected','archived')),
  submitted_by     uuid references auth.users(id) on delete set null,
  approved_by      uuid references auth.users(id) on delete set null,
  approved_at      timestamptz,
  avg_rating       numeric(3,2) not null default 0,
  review_count     integer not null default 0,
  view_count       integer not null default 0,
  bookmark_count   integer not null default 0,
  search_vector    tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(tagline, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists tools_slug_idx          on public.tools (slug);
create index if not exists tools_category_idx      on public.tools (category_id);
create index if not exists tools_pricing_idx       on public.tools (pricing_model);
create index if not exists tools_status_idx        on public.tools (status);
create index if not exists tools_search_vector_idx on public.tools using gin(search_vector);
create index if not exists tools_trgm_name_idx     on public.tools using gin(name gin_trgm_ops);
create index if not exists tools_published_at_idx  on public.tools (published_at desc)
  where status = 'published';
create index if not exists tools_rating_idx        on public.tools (avg_rating desc)
  where status = 'published';
create index if not exists tools_featured_idx      on public.tools (is_featured)
  where is_featured = true and status = 'published';
create index if not exists tools_supertools_idx    on public.tools (is_supertools)
  where is_supertools = true and status = 'published';

-- ============================================================
-- TOOL_TAGS
-- ============================================================
create table if not exists public.tool_tags (
  tool_id    uuid not null references public.tools(id) on delete cascade,
  tag_id     uuid not null references public.tags(id) on delete cascade,
  primary key (tool_id, tag_id)
);

create index if not exists tool_tags_tag_idx on public.tool_tags (tag_id);

-- ============================================================
-- REVIEWS
-- ============================================================
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  tool_id       uuid not null references public.tools(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  rating        smallint not null check (rating between 1 and 5),
  title         text,
  body          text,
  is_verified   boolean not null default false,
  helpful_count integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tool_id, user_id)
);

create index if not exists reviews_tool_idx on public.reviews (tool_id);
create index if not exists reviews_user_idx on public.reviews (user_id);

create or replace function public.refresh_tool_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target_tool_id uuid;
begin
  target_tool_id := coalesce(new.tool_id, old.tool_id);
  update public.tools
  set
    avg_rating   = coalesce((select avg(rating)::numeric(3,2) from public.reviews where tool_id = target_tool_id), 0),
    review_count = (select count(*) from public.reviews where tool_id = target_tool_id),
    updated_at   = now()
  where id = target_tool_id;
  return null;
end;
$$;

create or replace trigger trg_refresh_tool_rating
  after insert or update or delete on public.reviews
  for each row execute procedure public.refresh_tool_rating();

-- ============================================================
-- BOOKMARKS
-- ============================================================
create table if not exists public.bookmarks (
  user_id    uuid not null references auth.users(id) on delete cascade,
  tool_id    uuid not null references public.tools(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tool_id)
);

create index if not exists bookmarks_user_idx on public.bookmarks (user_id);
create index if not exists bookmarks_tool_idx on public.bookmarks (tool_id);

-- ============================================================
-- TOOL SUBMISSIONS
-- ============================================================
create table if not exists public.tool_submissions (
  id                uuid primary key default gen_random_uuid(),
  submitted_by      uuid references auth.users(id) on delete set null,
  submitter_email   text,
  name              text not null,
  website_url       text not null,
  tagline           text not null,
  description       text not null,
  category_id       uuid references public.categories(id),
  pricing_model     text,
  logo_url          text,
  notes             text,
  status            text not null default 'pending'
                      check (status in ('pending','approved','rejected')),
  reviewed_by       uuid references auth.users(id) on delete set null,
  reviewed_at       timestamptz,
  rejection_reason  text,
  converted_tool_id uuid references public.tools(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists submissions_status_idx on public.tool_submissions (status, created_at desc);

-- ============================================================
-- BLOG CATEGORIES
-- ============================================================
create table if not exists public.blog_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- BLOG POSTS
-- ============================================================
create table if not exists public.blog_posts (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  excerpt          text not null,
  content          text not null,
  cover_image_url  text,
  author_id        uuid not null references public.profiles(id),
  category_id      uuid references public.blog_categories(id),
  tags             text[] not null default '{}',
  status           text not null default 'draft'
                     check (status in ('draft','published','archived')),
  is_featured      boolean not null default false,
  video_embed_url  text,
  reading_time_min integer,
  view_count       integer not null default 0,
  search_vector    tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')
  ) stored,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists blog_posts_slug_idx          on public.blog_posts (slug);
create index if not exists blog_posts_status_idx        on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_category_idx      on public.blog_posts (category_id);
create index if not exists blog_posts_search_vector_idx on public.blog_posts using gin(search_vector);

-- ============================================================
-- NEWSLETTER SUBSCRIBERS
-- ============================================================
create table if not exists public.newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  status          text not null default 'active'
                    check (status in ('active','unsubscribed')),
  source          text,
  subscribed_at   timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create index if not exists newsletter_email_idx on public.newsletter_subscribers (email);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles               enable row level security;
alter table public.categories             enable row level security;
alter table public.tags                   enable row level security;
alter table public.tools                  enable row level security;
alter table public.tool_tags              enable row level security;
alter table public.reviews                enable row level security;
alter table public.bookmarks              enable row level security;
alter table public.tool_submissions       enable row level security;
alter table public.blog_categories        enable row level security;
alter table public.blog_posts             enable row level security;
alter table public.newsletter_subscribers enable row level security;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Profiles
create policy "profiles_public_read"  on public.profiles for select using (true);
create policy "profiles_self_manage"  on public.profiles for all using (auth.uid() = id);
create policy "profiles_admin_manage" on public.profiles for all using (public.is_admin());

-- Categories
create policy "categories_public_read"  on public.categories for select using (true);
create policy "categories_admin_manage" on public.categories for all using (public.is_admin());

-- Tags
create policy "tags_public_read"  on public.tags for select using (true);
create policy "tags_admin_manage" on public.tags for all using (public.is_admin());

-- Tools
create policy "tools_public_read_published" on public.tools
  for select using (status = 'published');
create policy "tools_admin_manage" on public.tools
  for all using (public.is_admin());

-- Tool Tags
create policy "tool_tags_public_read"  on public.tool_tags for select using (true);
create policy "tool_tags_admin_manage" on public.tool_tags for all using (public.is_admin());

-- Reviews
create policy "reviews_public_read"   on public.reviews for select using (true);
create policy "reviews_auth_insert"   on public.reviews for insert with check (auth.uid() = user_id);
create policy "reviews_own_update"    on public.reviews for update using (auth.uid() = user_id);
create policy "reviews_own_delete"    on public.reviews for delete using (auth.uid() = user_id);
create policy "reviews_admin_manage"  on public.reviews for all using (public.is_admin());

-- Bookmarks
create policy "bookmarks_own_read"   on public.bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks_own_manage" on public.bookmarks for all using (auth.uid() = user_id);

-- Submissions
create policy "submissions_anyone_insert" on public.tool_submissions for insert with check (true);
create policy "submissions_own_read"      on public.tool_submissions for select using (auth.uid() = submitted_by);
create policy "submissions_admin_manage"  on public.tool_submissions for all using (public.is_admin());

-- Blog
create policy "blog_posts_public_read_published" on public.blog_posts
  for select using (status = 'published');
create policy "blog_posts_admin_manage"    on public.blog_posts for all using (public.is_admin());
create policy "blog_cats_public_read"      on public.blog_categories for select using (true);
create policy "blog_cats_admin_manage"     on public.blog_categories for all using (public.is_admin());

-- Newsletter
create policy "newsletter_public_insert" on public.newsletter_subscribers
  for insert with check (true);
create policy "newsletter_admin_read"    on public.newsletter_subscribers
  for select using (public.is_admin());

-- ============================================================
-- FULL-TEXT SEARCH RPC
-- ============================================================
create or replace function public.search_tools(
  search_query  text    default null,
  p_category    uuid    default null,
  p_pricing     text    default null,
  p_verified    boolean default null,
  p_sort        text    default 'relevance',
  p_limit       integer default 24,
  p_offset      integer default 0
)
returns table (
  id            uuid,
  name          text,
  slug          text,
  tagline       text,
  logo_url      text,
  pricing_model text,
  is_verified   boolean,
  is_featured   boolean,
  avg_rating    numeric,
  review_count  integer,
  category_id   uuid,
  published_at  timestamptz,
  rank          real
)
language plpgsql stable security definer set search_path = public as $$
declare
  ts_query tsquery;
begin
  if search_query is not null and search_query <> '' then
    ts_query := websearch_to_tsquery('english', search_query);
  end if;

  return query
  select
    t.id, t.name, t.slug, t.tagline, t.logo_url,
    t.pricing_model, t.is_verified, t.is_featured,
    t.avg_rating, t.review_count, t.category_id,
    t.published_at,
    case
      when ts_query is not null then ts_rank(t.search_vector, ts_query)
      else 0::real
    end as rank
  from public.tools t
  where
    t.status = 'published'
    and (ts_query is null or t.search_vector @@ ts_query)
    and (p_category is null or t.category_id = p_category)
    and (p_pricing is null or t.pricing_model = p_pricing)
    and (p_verified is null or t.is_verified = p_verified)
  order by
    case when p_sort = 'relevance' and ts_query is not null
         then ts_rank(t.search_vector, ts_query) end desc nulls last,
    case when p_sort = 'rating'   then t.avg_rating   end desc nulls last,
    case when p_sort = 'newest'   then t.published_at end desc nulls last,
    case when p_sort = 'popular'  then t.view_count   end desc nulls last,
    t.avg_rating desc,
    t.published_at desc
  limit p_limit offset p_offset;
end;
$$;
