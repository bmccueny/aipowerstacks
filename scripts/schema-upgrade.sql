-- Schema upgrade: pricing history, tool metadata, feature limits
-- Run this in Supabase Dashboard → SQL Editor

-- 1. New tool columns
ALTER TABLE tools ADD COLUMN IF NOT EXISTS free_tier_quality smallint DEFAULT NULL;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS platforms text[] DEFAULT NULL;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS privacy_certifications text[] DEFAULT NULL;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS pricing_last_verified_at timestamptz DEFAULT NULL;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS gdpr_compliant boolean DEFAULT NULL;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS hipaa_compliant boolean DEFAULT NULL;

-- 2. Feature limits on pricing tiers (e.g., {"messages_per_day": 100, "storage_gb": 5})
ALTER TABLE tool_pricing_tiers ADD COLUMN IF NOT EXISTS limits jsonb DEFAULT NULL;

-- 3. Pricing history table — snapshot prices daily to track changes over time
CREATE TABLE IF NOT EXISTS pricing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  tier_name text NOT NULL,
  monthly_price numeric(10,2) NOT NULL,
  annual_price numeric(10,2) DEFAULT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tool_id, tier_name, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_pricing_history_tool_date ON pricing_history(tool_id, snapshot_date DESC);

-- 4. Enable RLS on pricing_history (read-only for everyone)
ALTER TABLE pricing_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pricing history" ON pricing_history FOR SELECT USING (true);
CREATE POLICY "Service role can insert pricing history" ON pricing_history FOR INSERT WITH CHECK (true);
