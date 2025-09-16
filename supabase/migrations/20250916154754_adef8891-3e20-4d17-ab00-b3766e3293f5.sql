-- Fix security issue: Set search_path for the function
DROP FUNCTION IF EXISTS public.update_search_session_stats(UUID);

CREATE OR REPLACE FUNCTION public.update_search_session_stats(session_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.search_sessions 
  SET 
    total_results = (
      SELECT COUNT(*) 
      FROM public.search_results 
      WHERE session_id = session_uuid
    ),
    status = 'completed',
    completed_at = now()
  WHERE id = session_uuid;
END;
$$;