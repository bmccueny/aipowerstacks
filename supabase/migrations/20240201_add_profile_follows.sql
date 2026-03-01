CREATE TABLE IF NOT EXISTS profile_follows (
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE profile_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all follows" ON profile_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON profile_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON profile_follows
  FOR DELETE USING (auth.uid() = follower_id);
