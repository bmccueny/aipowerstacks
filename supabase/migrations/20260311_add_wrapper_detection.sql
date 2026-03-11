-- Add wrapper detection columns to tools table
-- model_provider already exists as text, so we only add:
ALTER TABLE tools ADD COLUMN IF NOT EXISTS is_api_wrapper boolean DEFAULT false;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS wrapper_details text;

-- Add model_provider to tool_submissions so submitters can declare it
ALTER TABLE tool_submissions ADD COLUMN IF NOT EXISTS model_provider text;

-- Update the search_tools RPC to return wrapper fields
CREATE OR REPLACE FUNCTION search_tools(
  search_query text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_pricing text DEFAULT NULL,
  p_verified boolean DEFAULT NULL,
  p_use_case text DEFAULT NULL,
  p_team_size text DEFAULT NULL,
  p_integration text DEFAULT NULL,
  p_sort text DEFAULT 'relevance',
  p_limit int DEFAULT 24,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  tagline text,
  website_url text,
  logo_url text,
  pricing_model text,
  is_verified boolean,
  is_featured boolean,
  avg_rating numeric,
  review_count int,
  upvote_count int,
  category_id uuid,
  use_case text,
  team_size text,
  integrations text[],
  has_api boolean,
  has_mobile_app boolean,
  is_open_source boolean,
  has_cloud_sync boolean,
  api_latency numeric,
  api_uptime numeric,
  verified_by_admin boolean,
  admin_review_video_url text,
  published_at timestamptz,
  model_provider text,
  is_api_wrapper boolean,
  rank real
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.slug,
    t.tagline,
    t.website_url,
    t.logo_url,
    t.pricing_model,
    t.is_verified,
    t.is_featured,
    t.avg_rating,
    t.review_count,
    t.upvote_count,
    t.category_id,
    t.use_case,
    t.team_size,
    t.integrations,
    t.has_api,
    t.has_mobile_app,
    t.is_open_source,
    FALSE as has_cloud_sync,
    NULL::numeric as api_latency,
    NULL::numeric as api_uptime,
    t.is_verified as verified_by_admin,
    NULL::text as admin_review_video_url,
    t.published_at,
    t.model_provider,
    t.is_api_wrapper,
    CASE
      WHEN search_query IS NOT NULL AND search_query != '' THEN
        ts_rank(
          to_tsvector('english', coalesce(t.name, '') || ' ' || coalesce(t.tagline, '') || ' ' || coalesce(t.description, '')),
          plainto_tsquery('english', search_query)
        )
      ELSE 0
    END::real as rank
  FROM tools t
  WHERE t.status = 'published'
    AND (search_query IS NULL OR search_query = '' OR
      to_tsvector('english', coalesce(t.name, '') || ' ' || coalesce(t.tagline, '') || ' ' || coalesce(t.description, ''))
      @@ plainto_tsquery('english', search_query)
      OR t.name ILIKE '%' || search_query || '%'
      OR t.tagline ILIKE '%' || search_query || '%'
    )
    AND (p_category IS NULL OR t.category_id::text = p_category)
    AND (p_pricing IS NULL OR t.pricing_model = p_pricing)
    AND (p_verified IS NULL OR t.is_verified = p_verified)
    AND (p_use_case IS NULL OR t.use_case = p_use_case)
    AND (p_team_size IS NULL OR t.team_size = p_team_size)
    AND (p_integration IS NULL OR p_integration = ANY(t.integrations))
  ORDER BY
    CASE WHEN p_sort = 'newest' THEN extract(epoch from t.published_at) END DESC NULLS LAST,
    CASE WHEN p_sort = 'rating' THEN t.avg_rating END DESC NULLS LAST,
    CASE WHEN p_sort = 'popular' THEN t.upvote_count END DESC NULLS LAST,
    CASE WHEN p_sort = 'relevance' OR p_sort IS NULL THEN
      CASE
        WHEN search_query IS NOT NULL AND search_query != '' THEN
          ts_rank(
            to_tsvector('english', coalesce(t.name, '') || ' ' || coalesce(t.tagline, '') || ' ' || coalesce(t.description, '')),
            plainto_tsquery('english', search_query)
          )
        ELSE 0
      END
    END DESC NULLS LAST,
    t.is_supertools DESC,
    t.upvote_count DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
