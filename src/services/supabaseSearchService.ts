import { supabase } from '@/integrations/supabase/client';
import { SearchResult, BaseEntity } from '@/types/entities';

interface SearchRequest {
  searchParams: {
    name: string;
    city?: string;
    state?: string;
    phone?: string;
    email?: string;
    dob?: string;
    address?: string;
  };
  searchMode: 'deep' | 'enhanced';
  useEmailOsint?: boolean;
}

interface SearchResponse {
  success: boolean;
  sessionId?: string;
  results: SearchResult[];
  cost: number;
  totalResults: number;
  error?: string;
}

interface CostSummary {
  totalCost: number;
  monthlyUsage: number;
  lastMonth: string;
  servicesUsed: Array<{
    service: string;
    cost: number;
    queries: number;
  }>;
}

export class SupabaseSearchService {
  /**
   * Perform comprehensive search using Supabase Edge Function proxy
   */
  static async performComprehensiveSearch(
    searchParams: SearchRequest['searchParams'],
    searchMode: 'deep' | 'enhanced' = 'deep',
    useEmailOsint: boolean = false
  ): Promise<SearchResponse> {
    try {
      console.log('Starting comprehensive search via Supabase Edge Function...', {
        searchParams,
        searchMode,
        useEmailOsint
      });
      
      const { data, error } = await supabase.functions.invoke('search-proxy', {
        body: {
          query: `Enhanced search: ${searchParams.name}`,
          location: searchParams.city && searchParams.state 
            ? `${searchParams.city}, ${searchParams.state}` 
            : searchParams.city || searchParams.state,
          searchParams,
          searchMode,
          useEmailOsint,
          scraperApiKey: localStorage.getItem('scraperapi_key'), // Pass ScraperAPI key for enhanced scraping
          enableScraperAPI: !!localStorage.getItem('scraperapi_key') && localStorage.getItem('scraperapi_validation') && JSON.parse(localStorage.getItem('scraperapi_validation') || '{}').valid
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Supabase function invocation error:', error);
        // Try to retrieve results from database as fallback
        return await this.fallbackToSessionResults(searchParams, error.message);
      }

      // Handle different response structures
      let responseData = data;
      if (typeof data === 'string') {
        try {
          responseData = JSON.parse(data);
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          throw new Error('Invalid response format from search service');
        }
      }

      if (!responseData || typeof responseData !== 'object') {
        console.error('Invalid response structure:', responseData);
        throw new Error('Invalid response from search service');
      }

      if (!responseData.success) {
        console.error('Search function reported failure:', responseData.error);
        // Try fallback to database
        return await this.fallbackToSessionResults(searchParams, responseData.error || 'Search failed');
      }

      const results = responseData.results || [];
      const sessionId = responseData.sessionId;
      const cost = responseData.cost || 0;
      const totalResults = responseData.totalResults || results.length;

      console.log(`Search completed successfully. SessionId: ${sessionId}, Results: ${results.length}, Cost: $${cost.toFixed(4)}`);

      // Convert results to proper SearchResult format
      const convertedResults: SearchResult[] = results.map((result: any, index: number) => ({
        id: result.id || `result-${Date.now()}-${index}`,
        type: 'name' as const,
        value: searchParams.name,
        title: result.title || 'Untitled Result',
        snippet: result.snippet || '',
        url: result.url || '',
        source: result.source || 'Unknown',
        confidence: result.confidence || 0,
        relevanceScore: result.relevanceScore || result.relevance_score || 0,
        timestamp: result.timestamp ? new Date(result.timestamp) : new Date(),
        query: `Automated search: ${searchParams.name}`,
        extractedEntities: result.extractedEntities || result.extracted_entities || []
      }));

      return {
        success: true,
        sessionId: sessionId,
        results: convertedResults,
        cost: cost,
        totalResults: totalResults,
      };

    } catch (error) {
      console.error('SupabaseSearchService error:', error);
      // Final fallback attempt
      const fallbackResult = await this.fallbackToSessionResults(searchParams, error instanceof Error ? error.message : 'Unknown error');
      if (fallbackResult.success && fallbackResult.results.length > 0) {
        return fallbackResult;
      }

      return {
        success: false,
        results: [],
        cost: 0,
        totalResults: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fallback method to retrieve results from database when edge function fails
   */
  private static async fallbackToSessionResults(
    searchParams: SearchRequest['searchParams'], 
    originalError: string
  ): Promise<SearchResponse> {
    try {
      console.log('Attempting fallback to retrieve results from database...');
      
      // Get the most recent session for this user that might have results
      const { data: sessions, error: sessionError } = await supabase
        .from('search_sessions')
        .select('id, search_params, total_results, total_cost')
        .order('created_at', { ascending: false })
        .limit(5);

      if (sessionError) {
        console.error('Failed to fetch recent sessions:', sessionError);
        throw new Error(`Fallback failed: ${originalError}`);
      }

      // Look for a session with similar search parameters
      const matchingSession = sessions?.find(session => {
        const params = session.search_params as any;
        return params?.name?.toLowerCase() === searchParams.name.toLowerCase();
      });

      if (!matchingSession || matchingSession.total_results === 0) {
        console.log('No matching session found with results');
        throw new Error(`No cached results available: ${originalError}`);
      }

      console.log(`Found matching session ${matchingSession.id} with ${matchingSession.total_results} results`);
      
      const sessionResults = await this.getSessionResults(matchingSession.id);
      
      if (sessionResults.success && sessionResults.results.length > 0) {
        return {
          success: true,
          sessionId: matchingSession.id,
          results: sessionResults.results,
          cost: matchingSession.total_cost || 0,
          totalResults: sessionResults.results.length,
        };
      }

      throw new Error(`Fallback session has no results: ${originalError}`);

    } catch (fallbackError) {
      console.error('Fallback retrieval failed:', fallbackError);
      return {
        success: false,
        results: [],
        cost: 0,
        totalResults: 0,
        error: `Search failed: ${originalError}. Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error'}`
      };
    }
  }

  /**
   * Get search history for the current user
   */
  static async getSearchHistory(limit: number = 50) {
    try {
      const { data: sessions, error } = await supabase
        .from('search_sessions')
        .select(`
          *,
          search_results(count)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, sessions };
    } catch (error) {
      console.error('Error fetching search history:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get results for a specific search session
   */
  static async getSessionResults(sessionId: string) {
    try {
      const { data: results, error } = await supabase
        .from('search_results')
        .select('*')
        .eq('session_id', sessionId)
        .order('relevance_score', { ascending: false });

      if (error) throw error;

      // Convert to SearchResult format
      const convertedResults: SearchResult[] = results.map(result => ({
        id: result.id,
        type: 'name' as const,
        value: '', // Would need to get from session params
        title: result.title,
        snippet: result.snippet || '',
        url: result.url || '',
        source: result.source,
        confidence: result.confidence || 0,
        relevanceScore: result.relevance_score || 0,
        timestamp: new Date(result.created_at),
        query: result.query_used || '',
        extractedEntities: Array.isArray(result.extracted_entities) 
          ? (result.extracted_entities as unknown as BaseEntity[])
          : []
      }));

      return { success: true, results: convertedResults };
    } catch (error) {
      console.error('Error fetching session results:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get extracted entities for a specific session
   */
  static async getSessionEntities(sessionId: string) {
    try {
      const { data: entities, error } = await supabase
        .from('extracted_entities')
        .select('*')
        .eq('session_id', sessionId)
        .order('confidence', { ascending: false });

      if (error) throw error;

      // Convert to BaseEntity format
      const convertedEntities: BaseEntity[] = entities.map(entity => ({
        id: entity.id,
        type: entity.entity_type as any,
        value: entity.entity_value,
        confidence: entity.confidence || 0,
        source: 'Database',
        timestamp: new Date(entity.created_at),
        verified: entity.verified || false
      }));

      return { success: true, entities: convertedEntities };
    } catch (error) {
      console.error('Error fetching session entities:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get comprehensive cost tracking information
   */
  static async getCostTracking(): Promise<CostSummary> {
    try {
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM format
      const startOfMonth = `${currentMonth}-01T00:00:00Z`;

      // Get total costs
      const { data: totalCosts, error: totalError } = await supabase
        .from('api_cost_tracking')
        .select('cost.sum()')
        .single();

      if (totalError) throw totalError;

      // Get monthly costs
      const { data: monthlyCosts, error: monthlyError } = await supabase
        .from('api_cost_tracking')
        .select('cost.sum()')
        .gte('created_at', startOfMonth)
        .single();

      if (monthlyError) throw monthlyError;

      // Get service breakdown for current month
      const { data: serviceBreakdown, error: serviceError } = await supabase
        .from('api_cost_tracking')
        .select('service_name, cost.sum(), queries_used.sum()')
        .gte('created_at', startOfMonth);

      if (serviceError) throw serviceError;

      // Process service breakdown
      const servicesUsed = serviceBreakdown.reduce((acc: any[], item: any) => {
        const existing = acc.find(s => s.service === item.service_name);
        if (existing) {
          existing.cost += item.sum || 0;
          existing.queries += item.sum_1 || 0;
        } else {
          acc.push({
            service: item.service_name,
            cost: item.sum || 0,
            queries: item.sum_1 || 0
          });
        }
        return acc;
      }, []);

      return {
        totalCost: totalCosts?.sum || 0,
        monthlyUsage: monthlyCosts?.sum || 0,
        lastMonth: currentMonth,
        servicesUsed
      };

    } catch (error) {
      console.error('Error fetching cost tracking:', error);
      return {
        totalCost: 0,
        monthlyUsage: 0,
        lastMonth: new Date().toISOString().slice(0, 7),
        servicesUsed: []
      };
    }
  }

  /**
   * Delete a search session and all related data
   */
  static async deleteSession(sessionId: string) {
    try {
      // Supabase will cascade delete related results and entities
      const { error } = await supabase
        .from('search_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting session:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update entity verification status
   */
  static async updateEntityVerification(entityId: string, verified: boolean) {
    try {
      const { error } = await supabase
        .from('extracted_entities')
        .update({ verified })
        .eq('id', entityId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating entity verification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return !error && !!user;
    } catch {
      return false;
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}