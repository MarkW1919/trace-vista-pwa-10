-- migrations/2025-09-25-add-result-hash.sql

-- Add result_hash column for deterministic mapping
ALTER TABLE IF EXISTS public.search_results
  ADD COLUMN IF NOT EXISTS result_hash text;

-- Optional: add result_hash index to speed up lookups
CREATE INDEX IF NOT EXISTS idx_search_results_result_hash ON public.search_results (result_hash);

-- Ensure extracted_entities has source_result_id referencing search_results.id
ALTER TABLE IF EXISTS public.extracted_entities
  ADD COLUMN IF NOT EXISTS source_result_id bigint;

-- Add foreign key if you want referential integrity (ensure no orphans before applying)
-- ALTER TABLE public.extracted_entities
--   ADD CONSTRAINT fk_extracted_entities_result
--   FOREIGN KEY (source_result_id) REFERENCES public.search_results(id) ON DELETE SET NULL;

-- Optionally add timestamp and cost field in sessions if missing
ALTER TABLE IF EXISTS public.search_sessions
  ADD COLUMN IF NOT EXISTS total_cost numeric;

-- Create index on search_sessions.search_params->>'search_hash' if you stored search_hash in JSON
-- Note: If you created a direct column search_hash instead, use that column instead