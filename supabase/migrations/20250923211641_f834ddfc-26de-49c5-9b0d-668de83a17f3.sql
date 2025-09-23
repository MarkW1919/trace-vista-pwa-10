-- Phase 1: Critical Database Fix (corrected)

-- Clean up stuck sessions first
UPDATE search_sessions 
SET status = 'failed', 
    error_message = 'Session timeout - exceeded 15 minute limit',
    completed_at = now()
WHERE status = 'processing' 
  AND created_at < NOW() - INTERVAL '15 minutes';

-- Drop foreign key constraint to allow column type change
ALTER TABLE extracted_entities 
DROP CONSTRAINT IF EXISTS extracted_entities_source_result_id_fkey;

-- Change source_result_id to TEXT type to handle both UUIDs and string IDs
ALTER TABLE extracted_entities 
ALTER COLUMN source_result_id TYPE TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_extracted_entities_session_type 
ON extracted_entities(session_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_extracted_entities_confidence 
ON extracted_entities(confidence DESC);

-- Create session timeout function for automatic cleanup
CREATE OR REPLACE FUNCTION cleanup_stuck_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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