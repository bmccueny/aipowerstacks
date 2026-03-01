-- Migration: Enable Vector Search
-- Date: 2026-03-01

-- 1. Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- 2. Add an embedding column to the tools table (384 dimensions for typical local models)
alter table public.tools add column if not exists embedding vector(384);

-- 3. Create a function to find similar tools via vector similarity
create or replace function public.match_tools_semantic (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  p_use_case text default null
)
returns table (
  id uuid,
  name text,
  slug text,
  tagline text,
  logo_url text,
  pricing_model text,
  is_verified boolean,
  avg_rating numeric,
  review_count integer,
  upvote_count integer,
  is_supertools boolean,
  similarity float
)
language plpgsql stable as $$
begin
  return query
  select
    t.id, t.name, t.slug, t.tagline, t.logo_url, t.pricing_model,
    t.is_verified, t.avg_rating, t.review_count, t.upvote_count, t.is_supertools,
    1 - (t.embedding <=> query_embedding) as similarity
  from public.tools t
  where 1 - (t.embedding <=> query_embedding) > match_threshold
    and t.status = 'published'
    and (p_use_case is null or t.use_case = p_use_case)
  order by (t.is_supertools::int) desc, similarity desc
  limit match_count;
end;
$$;
