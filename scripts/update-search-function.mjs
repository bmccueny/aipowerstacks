import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (e) { }
}
loadEnv();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres';

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    const sql = `
DROP FUNCTION IF EXISTS search_tools(text, text, text, boolean, text, text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION search_tools(
  search_query  text    default null,
  p_category    text    default null,
  p_pricing     text    default null,
  p_verified    boolean default null,
  p_use_case    text    default null,
  p_team_size   text    default null,
  p_integration text    default null,
  p_sort        text    default 'relevance',
  p_limit       integer default 24,
  p_offset      integer default 0
)
returns table (
  id            uuid,
  name          text,
  slug          text,
  tagline       text,
  website_url   text,
  logo_url      text,
  pricing_model text,
  pricing_details text,
  pricing_tags  text[],
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
    t.pricing_model, t.pricing_details, t.pricing_tags, t.is_verified, t.is_featured,
    t.avg_rating, t.review_count, t.upvote_count, t.category_id,
    t.use_case, t.team_size, t.integrations,
    t.has_api, t.has_mobile_app, t.is_open_source,
    t.published_at,
    case
      when ts_query is not null then ts_rank(t.search_vector, ts_query)
      else 0::real
    end as rank
  from public.tools t
  where
    t.status = 'published'
    and (ts_query is null or t.search_vector @@ ts_query)
    and (p_category is null or t.category_id = p_category::uuid)
    and (p_pricing is null or t.pricing_model = p_pricing::public.pricing_model)
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
`;
    await client.query(sql);
    console.log('Successfully updated search_tools function');

  } catch (err) {
    console.error('Error updating function:', err);
  } finally {
    await client.end();
  }
}

main();
