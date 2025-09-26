import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useStreamingSearch = () => {
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  const search = async (query: string, userId: string) => {
    setIsSearching(true);
    setError(null);
    setResults([]);
    setTotalResults(0);
    
    try {
      const sessionId = crypto.randomUUID();
      
      console.log('🚀 Starting streaming search:', { query, userId, sessionId });
      
      // Call the search-proxy edge function
      const { data, error: functionError } = await supabase.functions.invoke('search-proxy', {
        body: { q: query, userId, sessionId }
      });

      if (functionError) {
        throw new Error(`Search function error: ${functionError.message}`);
      }

      console.log('📊 Search function response:', data);

      // For now, handle non-streaming response until we implement full streaming
      if (data && data.results) {
        setResults(data.results);
        setTotalResults(data.totalResults || data.results.length);
        console.log(`✅ Received ${data.results.length} results`);
      } else {
        console.warn('No results returned from search function');
        setResults([]);
        setTotalResults(0);
      }

    } catch (err: any) {
      console.error('❌ Streaming search error:', err);
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return { results, isSearching, error, search, totalResults };
};