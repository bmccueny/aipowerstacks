-- Migration: Add Detailed Capabilities to tools
-- Date: 2026-03-01

alter table public.tools add column if not exists has_api boolean not null default false;
alter table public.tools add column if not exists has_mobile_app boolean not null default false;
alter table public.tools add column if not exists is_open_source boolean not null default false;
alter table public.tools add column if not exists has_cloud_sync boolean not null default true;

-- Update the search function to include the new columns
create or replace function public.search_tools(
  search_query text,
  p_category uuid default null,
  p_pricing text default null,
  p_verified boolean default null,
  p_use_case text default null,
  p_team_size text default null,
  p_integration text default null,
  p_sort text default 'relevance',
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id            uuid,
  name          text,
  slug          text,
  tagline       text,
  website_url   text,
  logo_url      text,
  pricing_model text,
  is_verified   boolean,
  is_featured   boolean,
  avg_rating    numeric,
  review_count  integer,
  upvote_count  integer,
  category_id   uuid,
  use_case      text,
  team_size     text,
  integrations  text[],
  has_api       boolean,
  has_mobile_app boolean,
  is_open_source boolean,
  has_cloud_sync boolean,
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
    t.id, t.name, t.slug, t.tagline, t.website_url, t.logo_url,
    t.pricing_model, t.is_verified, t.is_featured,
    t.avg_rating, t.review_count, t.upvote_count, t.category_id,
    t.use_case, t.team_size, t.integrations,
    t.has_api, t.has_mobile_app, t.is_open_source, t.has_cloud_sync,
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
    and (p_use_case is null or t.use_case = p_use_case)
    and (p_team_size is null or t.team_size = p_team_size)
    and (p_integration is null or (t.integrations is not null and p_integration = any(t.integrations)))
  order by
    case when p_sort = 'relevance' and ts_query is not null
         then ts_rank(t.search_vector, ts_query) end desc nulls last,
    case when p_sort = 'rating'   then t.avg_rating   end desc nulls last,
    case when p_sort = 'newest'   then t.published_at end desc nulls last,
    case when p_sort = 'popular'  then t.upvote_count end desc nulls last,
    case when p_sort = 'popular'  then t.view_count   end desc nulls last,
    t.avg_rating desc,
    t.published_at desc
  limit p_limit offset p_offset;
end;
$$;
