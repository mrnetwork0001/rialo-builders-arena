
-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (roles must be separate from profile)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Weekly sessions table
CREATE TABLE public.weekly_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_label TEXT NOT NULL,
  session_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.weekly_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sessions" ON public.weekly_sessions
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage sessions" ON public.weekly_sessions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Participants table
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.weekly_sessions(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  discord_handle TEXT NOT NULL,
  twitter_handle TEXT,
  project_link TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants" ON public.participants
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage participants" ON public.participants
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Function to ensure only one current session
CREATE OR REPLACE FUNCTION public.ensure_single_current_session()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_current = TRUE THEN
    UPDATE public.weekly_sessions SET is_current = FALSE WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER single_current_session
BEFORE INSERT OR UPDATE ON public.weekly_sessions
FOR EACH ROW EXECUTE FUNCTION public.ensure_single_current_session();

-- Seed first session
INSERT INTO public.weekly_sessions (week_label, session_date, is_current)
VALUES ('Week of Feb 19, 2026', '2026-02-19', TRUE);
