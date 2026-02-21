
-- Shark Tank Sessions (weekly pitch events)
CREATE TABLE public.shark_tank_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_label TEXT NOT NULL,
  session_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  stream_link TEXT,
  replay_link TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shark_tank_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shark tank sessions" ON public.shark_tank_sessions FOR SELECT USING (true);
CREATE POLICY "Admins can manage shark tank sessions" ON public.shark_tank_sessions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_shark_tank_sessions_updated_at BEFORE UPDATE ON public.shark_tank_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure only one current shark tank session
CREATE OR REPLACE FUNCTION public.ensure_single_current_shark_tank_session()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.is_current = TRUE THEN
    UPDATE public.shark_tank_sessions SET is_current = FALSE WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_current_shark_tank BEFORE INSERT OR UPDATE ON public.shark_tank_sessions FOR EACH ROW EXECUTE FUNCTION public.ensure_single_current_shark_tank_session();

-- Sharks (judges/investors)
CREATE TABLE public.shark_tank_sharks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT NOT NULL,
  title TEXT,
  avatar_url TEXT,
  bio TEXT,
  twitter_handle TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shark_tank_sharks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sharks" ON public.shark_tank_sharks FOR SELECT USING (true);
CREATE POLICY "Admins can manage sharks" ON public.shark_tank_sharks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Pitches
CREATE TABLE public.shark_tank_pitches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.shark_tank_sessions(id) ON DELETE CASCADE,
  builder_name TEXT NOT NULL,
  builder_avatar_url TEXT,
  builder_discord TEXT,
  builder_twitter TEXT,
  project_name TEXT NOT NULL,
  description TEXT,
  demo_link TEXT,
  pitch_deck_link TEXT,
  funding_ask TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  is_funded BOOLEAN DEFAULT false,
  funded_amount TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shark_tank_pitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pitches" ON public.shark_tank_pitches FOR SELECT USING (true);
CREATE POLICY "Admins can manage pitches" ON public.shark_tank_pitches FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_shark_tank_pitches_updated_at BEFORE UPDATE ON public.shark_tank_pitches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Shark Feedback/Offers
CREATE TABLE public.shark_tank_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_id UUID NOT NULL REFERENCES public.shark_tank_pitches(id) ON DELETE CASCADE,
  shark_id UUID NOT NULL REFERENCES public.shark_tank_sharks(id) ON DELETE CASCADE,
  feedback TEXT,
  offer_amount TEXT,
  offer_type TEXT,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shark_tank_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feedback" ON public.shark_tank_feedback FOR SELECT USING (true);
CREATE POLICY "Admins can manage feedback" ON public.shark_tank_feedback FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Community Votes on Pitches
CREATE TABLE public.shark_tank_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_id UUID NOT NULL REFERENCES public.shark_tank_pitches(id) ON DELETE CASCADE,
  visitor_key TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shark_tank_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes" ON public.shark_tank_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON public.shark_tank_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete votes" ON public.shark_tank_votes FOR DELETE USING (true);

-- Pitch Applications
CREATE TABLE public.shark_tank_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT NOT NULL,
  discord_handle TEXT NOT NULL,
  twitter_handle TEXT,
  project_name TEXT NOT NULL,
  project_description TEXT,
  demo_link TEXT,
  pitch_deck_link TEXT,
  funding_ask TEXT,
  funding_purpose TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shark_tank_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit pitch application" ON public.shark_tank_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage pitch applications" ON public.shark_tank_applications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_shark_tank_applications_updated_at BEFORE UPDATE ON public.shark_tank_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for votes (for live voting experience)
ALTER PUBLICATION supabase_realtime ADD TABLE public.shark_tank_votes;
