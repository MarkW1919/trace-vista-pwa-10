-- Fix security warning: Function Search Path Mutable
CREATE OR REPLACE FUNCTION cleanup_stuck_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE search_sessions 
  SET status = 'failed', 
      error_message = 'Session timeout - exceeded 15 minute limit',
      completed_at = now()
  WHERE status = 'processing' 
    AND created_at < NOW() - INTERVAL '15 minutes';
END;
$$;