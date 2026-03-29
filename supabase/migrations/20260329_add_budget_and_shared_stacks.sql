-- Add monthly_budget column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_budget numeric DEFAULT NULL;

-- Create shared_stacks table for shareable stack pages
CREATE TABLE IF NOT EXISTS shared_stacks (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_name text,
  snapshot jsonb NOT NULL,
  total_monthly numeric NOT NULL DEFAULT 0,
  tool_count integer NOT NULL DEFAULT 0,
  grade text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_shared_stacks_user_id ON shared_stacks(user_id);

-- RLS policies for shared_stacks
ALTER TABLE shared_stacks ENABLE ROW LEVEL SECURITY;

-- Anyone can read shared stacks (they're public)
CREATE POLICY "Shared stacks are publicly readable"
  ON shared_stacks FOR SELECT
  USING (true);

-- Users can insert/update/delete their own shared stacks
CREATE POLICY "Users can manage their own shared stacks"
  ON shared_stacks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
