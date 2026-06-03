-- Fix: affiliate_clicks had no RLS enabled
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clicks"
  ON affiliate_clicks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert clicks"
  ON affiliate_clicks FOR INSERT
  WITH CHECK (true);

-- Fix: tracker_alerts INSERT was too permissive
DROP POLICY IF EXISTS tracker_alerts_insert ON public.tracker_alerts;

CREATE POLICY "Users can only insert alerts for themselves"
  ON public.tracker_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
