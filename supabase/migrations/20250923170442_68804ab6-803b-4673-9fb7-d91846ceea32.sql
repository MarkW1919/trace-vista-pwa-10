-- Update the search_sessions table constraint to allow 'enhanced' search mode
ALTER TABLE public.search_sessions 
DROP CONSTRAINT IF EXISTS search_sessions_search_mode_check;

ALTER TABLE public.search_sessions 
ADD CONSTRAINT search_sessions_search_mode_check 
CHECK (search_mode IN ('basic', 'deep', 'targeted', 'enhanced'));