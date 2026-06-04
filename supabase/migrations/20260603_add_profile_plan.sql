ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
