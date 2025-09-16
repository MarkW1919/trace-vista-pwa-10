import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  location?: string;
  searchParams: {
    name: string;
    city?: string;
    state?: string;
    phone?: string;
    email?: string;
    dob?: string;
    address?: string;
  };
  searchMode: 'basic' | 'deep' | 'targeted';
  useEmailOsint?: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  confidence: number;
  relevanceScore: number;
  timestamp: Date;
  extractedEntities?: any[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Authentication failed');
    }

    const searchRequest: SearchRequest = await req.json();
    console.log('Starting comprehensive search for user:', user.id);
    console.log('Search params:', searchRequest.searchParams);

    // Create search session
    const { data: session, error: sessionError } = await supabase
      .from('search_sessions')
      .insert({
        user_id: user.id,
        search_mode: searchRequest.searchMode,
        search_params: searchRequest.searchParams,
        status: 'processing'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      throw new Error('Failed to create search session');
    }

    console.log('Created search session:', session.id);

    const allResults: SearchResult[] = [];
    let totalCost = 0;

    // Get API keys from Supabase secrets
    const serpApiKey = Deno.env.get('SERPAPI_API_KEY');
    const hunterApiKey = Deno.env.get('HUNTER_API_KEY');

    if (!serpApiKey) {
      throw new Error('SerpAPI key not configured in Supabase secrets');
    }
    
    // Validate API key format
    if (serpApiKey.length < 20 || !/^[a-zA-Z0-9_\-\.]+$/.test(serpApiKey)) {
      throw new Error('Invalid SerpAPI key format detected');
    }
    
    console.log('API Keys status:', {
      serpApiAvailable: !!serpApiKey,
      serpApiLength: serpApiKey.length,
      hunterApiAvailable: !!hunterApiKey
    });

    // Generate search queries based on mode
    const queries = generateSearchQueries(searchRequest.searchParams, searchRequest.searchMode);
    console.log(`Generated ${queries.length} queries for ${searchRequest.searchMode} mode`);

    // Perform SerpAPI searches with location fallback
    let retryWithoutLocation = false;
    
    for (const query of queries) {
      try {
        console.log(`Executing query: ${query.query} (${query.category})`);
        
        // More robust parameter handling with location fallback
        const searchParams = {
          engine: 'google',
          q: query.query,
          api_key: serpApiKey,
          num: '20',
          safe: 'off',
          no_cache: 'true'
        };
        
        // Add location if available and not already failed
        if (searchRequest.location && !retryWithoutLocation) {
          searchParams.location = searchRequest.location;
        }
        
        const params = new URLSearchParams(searchParams);
        
        console.log(`SerpAPI request for "${query.category}":`, {
          query: query.query,
          location: searchParams.location || 'no location',
          url: `https://serpapi.com/search?${params.toString().slice(0, 200)}...`
        });

        const response = await fetch(`https://serpapi.com/search?${params}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          
          // Check if error is location-related
          if (errorText.includes('Unsupported') && errorText.includes('location') && searchRequest.location && !retryWithoutLocation) {
            console.log(`Location "${searchRequest.location}" not supported, retrying without location...`);
            retryWithoutLocation = true;
            
            // Retry this query without location
            const paramsNoLocation = new URLSearchParams({
              engine: 'google',
              q: query.query,
              api_key: serpApiKey,
              num: '20',
              safe: 'off',
              no_cache: 'true'
            });
            
            const retryResponse = await fetch(`https://serpapi.com/search?${paramsNoLocation}`);
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              if (retryData.organic_results && retryData.organic_results.length > 0) {
                // Process successful retry results
                const results: SearchResult[] = retryData.organic_results.map((result: any, index: number) => {
                  const confidence = calculateResultConfidence(result, query.query);
                  const relevanceScore = calculateRelevanceScore(result, query.query);
                  
                  return {
                    id: `serpapi-${Date.now()}-${index}`,
                    title: result.title || 'No title',
                    snippet: result.snippet || 'No snippet available',
                    url: result.link || '#',
                    source: `${result.displayed_link || 'Unknown'} (${query.category})`,
                    confidence,
                    relevanceScore,
                    timestamp: new Date(),
                    extractedEntities: []
                  };
                });

                allResults.push(...results);
                
                const searchCost = 0.005;
                totalCost += searchCost;

                await supabase.from('api_cost_tracking').insert({
                  user_id: user.id,
                  service_name: 'SerpAPI',
                  operation_type: query.category,
                  cost: searchCost,
                  queries_used: 1,
                  session_id: session.id
                });
                
                continue; // Success, continue to next query
              }
            }
          }
          
          console.error(`SerpAPI error for query "${query.query}":`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            url: `https://serpapi.com/search?${params}`
          });
          continue;
        }

        const data = await response.json();
        
        if (data.error) {
          console.error(`SerpAPI API error for "${query.query}":`, data.error);
          continue;
        }
        console.log(`SerpAPI response for "${query.category}":`, {
          organic_results: data.organic_results?.length || 0,
          total_results: data.search_information?.total_results || 0,
          search_metadata: data.search_metadata?.status,
          credits_used: data.search_metadata?.total_time_taken
        });
        
        if (!data.organic_results || data.organic_results.length === 0) {
          console.warn(`No organic results for query "${query.query}" - SerpAPI might be blocked or quota exceeded`);
          continue;
        }

        // Process results
        const results: SearchResult[] = (data.organic_results || []).map((result: any, index: number) => {
          const confidence = calculateResultConfidence(result, query.query);
          const relevanceScore = calculateRelevanceScore(result, query.query);
          
          return {
            id: `serpapi-${Date.now()}-${index}`,
            title: result.title || 'No title',
            snippet: result.snippet || 'No snippet available',
            url: result.link || '#',
            source: `${result.displayed_link || 'Unknown'} (${query.category})`,
            confidence,
            relevanceScore,
            timestamp: new Date(),
            extractedEntities: []
          };
        });

        allResults.push(...results);
        
        // SerpAPI costs approximately $5 per 1000 searches
        const searchCost = 0.005;
        totalCost += searchCost;

        // Track cost in database
        await supabase.from('api_cost_tracking').insert({
          user_id: user.id,
          service_name: 'SerpAPI',
          operation_type: query.category,
          cost: searchCost,
          queries_used: 1,
          session_id: session.id
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing query "${query.query}":`, error);
      }
    }

    // Perform email OSINT if requested and email is provided
    if (searchRequest.useEmailOsint && searchRequest.searchParams.email && hunterApiKey) {
      try {
        console.log('Performing Hunter.io email OSINT...');
        
        const emailResponse = await fetch(
          `https://api.hunter.io/v2/email-verifier?email=${searchRequest.searchParams.email}&api_key=${hunterApiKey}`
        );

        if (emailResponse.ok) {
          const emailData = await emailResponse.json();
          console.log('Hunter.io response:', emailData);

          // Convert email result to search result format
          allResults.push({
            id: `email-osint-${Date.now()}`,
            title: `Email OSINT: ${searchRequest.searchParams.email}`,
            snippet: `Email confidence: ${emailData.data?.score || 0}%. Found sources: ${emailData.data?.sources?.length || 0}. Domain info available.`,
            url: `mailto:${searchRequest.searchParams.email}`,
            source: 'Hunter.io Email OSINT',
            confidence: emailData.data?.score || 0,
            relevanceScore: 85,
            timestamp: new Date(),
            extractedEntities: []
          });

          // Track email OSINT cost
          const emailCost = 0.01;
          totalCost += emailCost;

          await supabase.from('api_cost_tracking').insert({
            user_id: user.id,
            service_name: 'Hunter.io',
            operation_type: 'email_verification',
            cost: emailCost,
            queries_used: 1,
            session_id: session.id
          });
        }
      } catch (error) {
        console.error('Hunter.io email OSINT error:', error);
      }
    }

    // Store results in database
    console.log(`Storing ${allResults.length} results in database...`);
    
    if (allResults.length > 0) {
      const resultsToInsert = allResults.map(result => ({
        session_id: session.id,
        user_id: user.id,
        result_type: 'search',
        title: result.title,
        snippet: result.snippet,
        url: result.url,
        source: result.source,
        confidence: result.confidence,
        relevance_score: result.relevanceScore,
        query_used: searchRequest.query,
        extracted_entities: result.extractedEntities || []
      }));

      const { error: insertError } = await supabase
        .from('search_results')
        .insert(resultsToInsert);

      if (insertError) {
        console.error('Error storing results:', insertError);
      }
    }

    // Update search session with final stats
    await supabase
      .from('search_sessions')
      .update({
        status: 'completed',
        total_results: allResults.length,
        total_cost: totalCost,
        completed_at: new Date().toISOString()
      })
      .eq('id', session.id);

    // Remove duplicates and sort by relevance
    const uniqueResults = deduplicateResults(allResults);
    const sortedResults = uniqueResults.sort((a, b) => 
      (b.confidence + b.relevanceScore) - (a.confidence + a.relevanceScore)
    );

    console.log(`Search completed. Total results: ${sortedResults.length}, Cost: $${totalCost.toFixed(4)}`);

    return new Response(JSON.stringify({
      success: true,
      sessionId: session.id,
      results: sortedResults,
      cost: totalCost,
      totalResults: sortedResults.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Search proxy error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: [],
      cost: 0,
      totalResults: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
function generateSearchQueries(
  params: SearchRequest['searchParams'], 
  mode: 'basic' | 'deep' | 'targeted'
): Array<{ query: string; category: string }> {
  const queries: Array<{ query: string; category: string }> = [];
  const { name, city, state, phone, email, address } = params;

  // Basic identity searches - simplified queries to avoid issues
  queries.push({ query: name, category: 'Basic Identity' });
  queries.push({ query: `"${name}"`, category: 'Exact Name Match' });
  
  if (city && state) {
    queries.push({ query: `${name} ${city} ${state}`, category: 'Location-based' });
  } else if (city || state) {
    queries.push({ query: `${name} ${city || state}`, category: 'Location-based' });
  }

  // Contact information searches - use simpler formats
  if (phone) {
    queries.push({ query: phone, category: 'Phone Lookup' });
    queries.push({ query: `${name} ${phone}`, category: 'Name + Phone' });
  }

  if (email) {
    queries.push({ query: `${name} ${email}`, category: 'Name + Email' });
  }

  // Social media searches - simplified
  queries.push({ query: `${name} site:linkedin.com`, category: 'LinkedIn' });
  queries.push({ query: `${name} site:facebook.com`, category: 'Facebook' });

  if (mode === 'deep') {
    // Additional deep search queries - simplified
    queries.push({ query: `${name} site:twitter.com`, category: 'Twitter' });
    queries.push({ query: `${name} company business work`, category: 'Professional' });
    queries.push({ query: `${name} court record property`, category: 'Public Records' });
    if (address) {
      queries.push({ query: `${name} ${address}`, category: 'Address Search' });
    }
  } else if (mode === 'targeted') {
    // Targeted searches for specific use cases - simplified
    queries.push({ query: `${name} arrest court legal`, category: 'Legal Records' });
    queries.push({ query: `${name} property real estate deed`, category: 'Property Records' });
    queries.push({ query: `${name} obituary death memorial`, category: 'Vital Records' });
  }

  // Limit queries based on mode
  const limits = { basic: 8, deep: 15, targeted: 12 };
  return queries.slice(0, limits[mode]);
}

function calculateResultConfidence(result: any, query: string): number {
  let confidence = 50; // Base confidence

  // Title relevance
  if (result.title && result.title.toLowerCase().includes(query.toLowerCase())) {
    confidence += 20;
  }

  // Snippet relevance  
  if (result.snippet && result.snippet.toLowerCase().includes(query.toLowerCase())) {
    confidence += 15;
  }

  // Domain authority (simplified)
  const domain = result.displayed_link || '';
  if (domain.includes('linkedin.com') || domain.includes('facebook.com') || domain.includes('whitepages.com')) {
    confidence += 10;
  }

  return Math.min(confidence, 100);
}

function calculateRelevanceScore(result: any, query: string): number {
  const title = (result.title || '').toLowerCase();
  const snippet = (result.snippet || '').toLowerCase(); 
  const queryLower = query.toLowerCase();

  let score = 0;

  // Exact matches in title
  if (title.includes(queryLower)) score += 30;
  
  // Exact matches in snippet
  if (snippet.includes(queryLower)) score += 20;

  // Partial matches
  const queryWords = queryLower.split(' ');
  queryWords.forEach(word => {
    if (word.length > 2) {
      if (title.includes(word)) score += 5;
      if (snippet.includes(word)) score += 3;
    }
  });

  return Math.min(score, 100);
}

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter(result => {
    const key = `${result.title}-${result.url}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}