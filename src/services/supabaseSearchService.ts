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
      console.log('Starting comprehensive search via Supabase Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('search-proxy', {
        body: {
          query: `Enhanced search: ${searchParams.name}`,
          location: searchParams.city && searchParams.state 
            ? `${searchParams.city}, ${searchParams.state}` 
            : searchParams.city || searchParams.state,
          searchParams,
          searchMode,
          useEmailOsint
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Search function failed: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      console.log(`Search completed successfully. Results: ${data.results.length}, Cost: $${data.cost.toFixed(4)}`);

      // Convert results to proper SearchResult format
      const convertedResults: SearchResult[] = data.results.map((result: any, index: number) => ({
        id: result.id || `result-${Date.now()}-${index}`,
        type: 'name' as const,
        value: searchParams.name,
        title: result.title,
        snippet: result.snippet,
        url: result.url,
        source: result.source,
        confidence: result.confidence || 0,
        relevanceScore: result.relevanceScore || 0,
        timestamp: new Date(result.timestamp),
        query: `Automated search: ${searchParams.name}`,
        extractedEntities: result.extractedEntities || []
      }));

      return {
        success: true,
        sessionId: data.sessionId,
        results: convertedResults,
        cost: data.cost,
        totalResults: data.totalResults,
      };

    } catch (error) {
      console.error('SupabaseSearchService error:', error);
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