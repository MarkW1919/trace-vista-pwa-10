import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SearchResult {
  id: string;
  title: string;
  snippet?: string;
  url: string;
  source: string;
  confidence: number;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
}

export interface SearchResponse {
  success: boolean;
  sessionId: string;
  query: string;
  totalResults: number;
  totalCost: number;
  results: SearchResult[];
  summary: {
    serpapi: number;
    hunter: number;
    scraperapi: number;
    totalEntities: number;
  };
  error?: string;
}

export interface UseSearchReturn {
  results: SearchResult[];
  isSearching: boolean;
  error: string | null;
  lastResponse: SearchResponse | null;
  search: (query: string) => Promise<void>;
  clearResults: () => void;
}

export const useSearch = (): UseSearchReturn => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<SearchResponse | null>(null);
  const { toast } = useToast();

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setLastResponse(null);
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      setError('Query cannot be empty');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResults([]);
    setLastResponse(null);

    try {
      console.log('🚀 Starting search for:', query);

      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      if (!session) {
        throw new Error('No active session. Please sign in to search.');
      }

      const searchPayload = {
        q: query.trim(),
        userId: session.user.id,
        sessionId: crypto.randomUUID()
      };

      console.log('📤 Sending search request:', { 
        query: searchPayload.q, 
        userId: searchPayload.userId.substring(0, 8) + '...' 
      });

      // Call the search-proxy edge function
      const { data, error: functionError } = await supabase.functions.invoke('search-proxy', {
        body: searchPayload
      });

      if (functionError) {
        console.error('❌ Edge function error:', functionError);
        throw new Error(`Search function error: ${functionError.message}`);
      }

      console.log('📥 Search response received:', {
        success: data?.success,
        totalResults: data?.totalResults,
        hasResults: Array.isArray(data?.results)
      });

      if (!data || !data.success) {
        throw new Error(data?.error || 'Search failed - no results returned');
      }

      const searchResponse: SearchResponse = {
        success: data.success,
        sessionId: data.sessionId,
        query: data.query,
        totalResults: data.totalResults || 0,
        totalCost: data.totalCost || 0,
        results: data.results || [],
        summary: data.summary || { serpapi: 0, hunter: 0, scraperapi: 0, totalEntities: 0 }
      };

      setLastResponse(searchResponse);
      setResults(searchResponse.results);

      // Show success toast
      toast({
        title: "Search Complete",
        description: `Found ${searchResponse.totalResults} results with ${searchResponse.summary.totalEntities} entities extracted`,
      });

      console.log('✅ Search completed successfully:', {
        results: searchResponse.totalResults,
        entities: searchResponse.summary.totalEntities,
        cost: searchResponse.totalCost
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown search error';
      console.error('💥 Search failed:', errorMessage);
      
      setError(errorMessage);
      
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  return {
    results,
    isSearching,
    error,
    lastResponse,
    search,
    clearResults
  };
};