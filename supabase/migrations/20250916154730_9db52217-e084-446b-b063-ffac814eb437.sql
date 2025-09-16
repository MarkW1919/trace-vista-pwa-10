-- Create tables for search history, results, and cost tracking
-- Enable RLS for all tables to secure user data

-- Search sessions table to track overall search operations
CREATE TABLE public.search_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_mode TEXT NOT NULL CHECK (search_mode IN ('basic', 'deep', 'targeted')),
  search_params JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_results INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Search results table to store individual search findings
CREATE TABLE public.search_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.search_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  result_type TEXT NOT NULL DEFAULT 'search',
  title TEXT NOT NULL,
  snippet TEXT,
  url TEXT,
  source TEXT NOT NULL,
  confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  relevance_score INTEGER DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  query_used TEXT,
  extracted_entities JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Extracted entities table for structured entity tracking
CREATE TABLE public.extracted_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.search_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_value TEXT NOT NULL,
  confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  source_result_id UUID REFERENCES public.search_results(id) ON DELETE CASCADE,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate entities for the same session
  UNIQUE(session_id, entity_type, entity_value)
);

-- Cost tracking table for API usage monitoring
CREATE TABLE public.api_cost_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  cost DECIMAL(10,4) NOT NULL DEFAULT 0,
  queries_used INTEGER DEFAULT 1,
  session_id UUID REFERENCES public.search_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_cost_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for search_sessions
CREATE POLICY "Users can view their own search sessions" 
ON public.search_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search sessions" 
ON public.search_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search sessions" 
ON public.search_sessions FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for search_results
CREATE POLICY "Users can view their own search results" 
ON public.search_results FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search results" 
ON public.search_results FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for extracted_entities
CREATE POLICY "Users can view their own extracted entities" 
ON public.extracted_entities FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own extracted entities" 
ON public.extracted_entities FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extracted entities" 
ON public.extracted_entities FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for api_cost_tracking
CREATE POLICY "Users can view their own API costs" 
ON public.api_cost_tracking FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API cost records" 
ON public.api_cost_tracking FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_search_sessions_user_created ON public.search_sessions(user_id, created_at DESC);
CREATE INDEX idx_search_results_session ON public.search_results(session_id);
CREATE INDEX idx_search_results_user_created ON public.search_results(user_id, created_at DESC);
CREATE INDEX idx_extracted_entities_session ON public.extracted_entities(session_id);
CREATE INDEX idx_api_cost_tracking_user_date ON public.api_cost_tracking(user_id, created_at DESC);

-- Function to update search session status and stats
CREATE OR REPLACE FUNCTION public.update_search_session_stats(session_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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