-- Clean up invalid source_result_id data and fix data types for proper entity linking

-- Step 1: Clear all existing source_result_id values since they're in wrong format
UPDATE public.extracted_entities 
SET source_result_id = NULL;

-- Step 2: Now safely change the column type to uuid
ALTER TABLE public.extracted_entities 
  ALTER COLUMN source_result_id TYPE uuid USING source_result_id::uuid;

-- Step 3: Add the foreign key constraint
ALTER TABLE public.extracted_entities
  ADD CONSTRAINT fk_extracted_entities_result
  FOREIGN KEY (source_result_id) REFERENCES public.search_results(id) ON DELETE SET NULL;