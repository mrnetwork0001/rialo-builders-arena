
-- Table: builder_followers (email subscriptions per builder discord_handle)
CREATE TABLE public.builder_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_handle text NOT NULL,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(discord_handle, email)
);

ALTER TABLE public.builder_followers ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (subscribe)
CREATE POLICY "Anyone can subscribe to a builder"
  ON public.builder_followers FOR INSERT
  WITH CHECK (true);

-- Anyone can view follower counts (but not individual emails)
CREATE POLICY "Anyone can view follower counts"
  ON public.builder_followers FOR SELECT
  USING (true);

-- Anyone can delete their own subscription (by email match)
CREATE POLICY "Anyone can unsubscribe"
  ON public.builder_followers FOR DELETE
  USING (true);


-- Table: session_applications (waitlist/apply to join)
CREATE TABLE public.session_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  discord_handle text NOT NULL,
  twitter_handle text,
  project_title text,
  project_description text,
  project_link text,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.session_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application
CREATE POLICY "Anyone can submit application"
  ON public.session_applications FOR INSERT
  WITH CHECK (true);

-- Only admins can view and manage applications
CREATE POLICY "Admins can manage applications"
  ON public.session_applications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_session_applications_updated_at
  BEFORE UPDATE ON public.session_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
