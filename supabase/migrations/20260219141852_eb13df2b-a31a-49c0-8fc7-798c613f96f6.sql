
-- Fix: Admin management policies must be PERMISSIVE (not RESTRICTIVE) to actually grant write access.
-- RESTRICTIVE policies can only further restrict, never grant permissions.

-- weekly_sessions
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.weekly_sessions;
CREATE POLICY "Admins can manage sessions"
  ON public.weekly_sessions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- participants
DROP POLICY IF EXISTS "Admins can manage participants" ON public.participants;
CREATE POLICY "Admins can manage participants"
  ON public.participants
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
