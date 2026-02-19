
-- Fix RLS policies: drop restrictive "Anyone can view" policies and recreate as PERMISSIVE

-- weekly_sessions
DROP POLICY IF EXISTS "Anyone can view sessions" ON public.weekly_sessions;
CREATE POLICY "Anyone can view sessions"
  ON public.weekly_sessions
  FOR SELECT
  USING (true);

-- participants
DROP POLICY IF EXISTS "Anyone can view participants" ON public.participants;
CREATE POLICY "Anyone can view participants"
  ON public.participants
  FOR SELECT
  USING (true);
