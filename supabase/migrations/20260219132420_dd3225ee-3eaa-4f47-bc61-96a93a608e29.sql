
-- Fix: ensure trigger function has stable search_path
CREATE OR REPLACE FUNCTION public.ensure_single_current_session()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_current = TRUE THEN
    UPDATE public.weekly_sessions SET is_current = FALSE WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
