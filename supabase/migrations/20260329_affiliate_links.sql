ALTER TABLE tools
  ADD COLUMN IF NOT EXISTS affiliate_url text,
  ADD COLUMN IF NOT EXISTS affiliate_commission_pct numeric;

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id    uuid        REFERENCES tools(id),
  user_id    uuid,
  page       text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_clicks_tool_id_idx ON affiliate_clicks(tool_id);
