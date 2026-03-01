CREATE TABLE IF NOT EXISTS stack_challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  prompt text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid REFERENCES stack_challenges(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  vote_count int DEFAULT 0,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, collection_id)
);

CREATE TABLE IF NOT EXISTS challenge_votes (
  challenge_id uuid REFERENCES stack_challenges(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  voted_at timestamptz DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);

ALTER TABLE stack_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenges" ON stack_challenges
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert challenges" ON stack_challenges
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update challenges" ON stack_challenges
  FOR UPDATE USING (is_admin());

CREATE POLICY "Anyone can view submissions" ON challenge_submissions
  FOR SELECT USING (true);

CREATE POLICY "Users can submit their own stacks" ON challenge_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view votes" ON challenge_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON challenge_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote" ON challenge_votes
  FOR DELETE USING (auth.uid() = user_id);
