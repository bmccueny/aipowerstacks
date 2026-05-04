-- Tracker alerts table for proactive user notifications
CREATE TABLE IF NOT EXISTS public.tracker_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  tool_id uuid REFERENCES public.tools(id) ON DELETE SET NULL,
  severity text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracker_alerts_user ON public.tracker_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracker_alerts_unread ON public.tracker_alerts(user_id) WHERE read = false;

ALTER TABLE public.tracker_alerts ENABLE ROW LEVEL SECURITY;

-- Users can read their own alerts
DO $$ BEGIN
  CREATE POLICY tracker_alerts_select ON public.tracker_alerts
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can mark their own alerts as read
DO $$ BEGIN
  CREATE POLICY tracker_alerts_update ON public.tracker_alerts
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service role can insert alerts (from crons)
DO $$ BEGIN
  CREATE POLICY tracker_alerts_insert ON public.tracker_alerts
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
