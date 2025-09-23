import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

// Import ScraperAPI helper functions (inline for edge function compatibility)
import { 
  generatePeopleSearchUrls, 
  performScraperAPISearch, 
  extractEntitiesFromScrapedContent 
} from "./scraperapi-helpers-import.ts";

// Entity extraction functions (inline for edge function compatibility)
function extractEntitiesFromSearchResult(text: string, searchParams: any): any[] {
  const entities: any[] = [];
  
  // Phone number extraction with enhanced patterns
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phoneMatches = text.matchAll(phoneRegex);
  for (const match of phoneMatches) {
    const phone = `(${match[2]}) ${match[3]}-${match[4]}`;
    entities.push({
      type: 'phone',
      value: phone,
      confidence: calculatePhoneEntityConfidence(phone, searchParams)
    });
  }

  // Email extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatches = text.matchAll(emailRegex);
  for (const match of emailMatches) {
    entities.push({
      type: 'email',
      value: match[0],
      confidence: calculateEmailEntityConfidence(match[0], searchParams)
    });
  }

  // Address extraction with enhanced pattern
  const addressRegex = /\d{1,5}\s+([A-Za-z\s]{1,50})\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Circle|Cir|Way|Place|Pl)\b/gi;
  const addressMatches = text.matchAll(addressRegex);
  for (const match of addressMatches) {
    entities.push({
      type: 'address',
      value: match[0],
      confidence: calculateAddressEntityConfidence(match[0], searchParams)
    });
  }

  // Age extraction
  const ageRegex = /age\s+(\d{2})/gi;
  const ageMatches = text.matchAll(ageRegex);
  for (const match of ageMatches) {
    entities.push({
      type: 'age',
      value: match[1],
      confidence: 85
    });
  }

  // Name extraction (relatives/associates)
  const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+(?: [A-Z][a-z]+)?\b/g;
  const nameMatches = text.matchAll(nameRegex);
  for (const match of nameMatches) {
    // Skip if it's the search name
    if (searchParams.name && match[0].toLowerCase() !== searchParams.name.toLowerCase()) {
      entities.push({
        type: 'name',
        value: match[0],
        confidence: 60
      });
    }
  }

  return entities;
}

function calculatePhoneEntityConfidence(phone: string, searchParams: any): number {
  let confidence = 60;
  
  // Format check
  if (phone.match(/\(\d{3}\)\s\d{3}-\d{4}/)) confidence += 15;
  
  // Match with search phone
  if (searchParams.phone) {
    const searchDigits = searchParams.phone.replace(/\D/g, '');
    const phoneDigits = phone.replace(/\D/g, '');
    if (searchDigits === phoneDigits) {
      confidence += 30; // Exact match
    } else if (searchDigits.substring(0, 3) === phoneDigits.substring(0, 3)) {
      confidence += 15; // Same area code
    }
  }
  
  // Oklahoma area codes boost
  const areaCode = phone.replace(/\D/g, '').substring(0, 3);
  if (['580', '405', '918'].includes(areaCode) && searchParams.state === 'OK') {
    confidence += 10;
  }
  
  return Math.min(confidence, 100);
}

function calculateEmailEntityConfidence(email: string, searchParams: any): number {
  let confidence = 65;
  
  // Exact match with search email
  if (searchParams.email && email.toLowerCase() === searchParams.email.toLowerCase()) {
    confidence += 30;
  }
  
  // Domain analysis
  const domain = email.split('@')[1];
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  if (!commonDomains.includes(domain.toLowerCase())) {
    confidence += 10; // Custom domains often more reliable
  }
  
  return Math.min(confidence, 100);
}

function calculateAddressEntityConfidence(address: string, searchParams: any): number {
  let confidence = 50;
  
  // Location matching
  if (searchParams.city && address.toLowerCase().includes(searchParams.city.toLowerCase())) {
    confidence += 25;
  }
  if (searchParams.state && address.toLowerCase().includes(searchParams.state.toLowerCase())) {
    confidence += 15;
  }
  
  // Exact address match
  if (searchParams.address && address.toLowerCase().includes(searchParams.address.toLowerCase())) {
    confidence += 35;
  }
  
  return Math.min(confidence, 100);
}

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
  searchMode: 'basic' | 'deep' | 'targeted' | 'enhanced';
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

// Enhanced ScraperAPI credit checking function
async function checkScraperAPICredits(apiKey: string): Promise<{ hasCredits: boolean; credits: number; error?: string }> {
  try {
    const response = await fetch(`https://api.scraperapi.com/account?api_key=${apiKey}`);
    
    if (!response.ok) {
      return { hasCredits: false, credits: 0, error: `API request failed: ${response.status}` };
    }

    const data = await response.json();
    console.log('ScraperAPI account data:', data);
    
    // Fixed: ScraperAPI returns different properties - check all possible ones
    const credits = data.concurrentRequests || data.requestsRemaining || data.requestCount || data.credits || data.balance || 0;
    
    return {
      hasCredits: credits > 0,
      credits: credits
    };
  } catch (error) {
    console.error('Error checking ScraperAPI credits:', error);
    return { hasCredits: false, credits: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
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
    const scraperApiKey = Deno.env.get('SCRAPERAPI_API_KEY');

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
      hunterApiAvailable: !!hunterApiKey,
      scraperApiAvailable: !!scraperApiKey
    });

    // Initialize ScraperAPI integration for enhanced data collection
    const useScraperAPI = !!scraperApiKey && (searchRequest.searchMode === 'enhanced' || searchRequest.searchMode === 'targeted');
    console.log(`ScraperAPI integration: ${useScraperAPI ? 'enabled' : 'disabled'} for mode: ${searchRequest.searchMode}`);

    let scraperApiResults: SearchResult[] = [];
    let scraperApiCost = 0;

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
                // Process successful retry results with entity extraction
                const results: SearchResult[] = retryData.organic_results.map((result: any, index: number) => {
                  const confidence = calculateResultConfidence(result, query.query, searchRequest.searchParams);
                  const relevanceScore = calculateRelevanceScore(result, query.query);
                  
                  // Extract entities from result content
                  const extractedEntities = extractEntitiesFromSearchResult(`${result.title || ''} ${result.snippet || ''}`, searchRequest.searchParams);
                  
                  return {
                    id: `serpapi-${Date.now()}-${index}`,
                    title: result.title || 'No title',
                    snippet: result.snippet || 'No snippet available',
                    url: result.link || '#',
                    source: `${result.displayed_link || 'Unknown'} (${query.category})`,
                    confidence,
                    relevanceScore,
                    timestamp: new Date(),
                    extractedEntities
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

        // Process results with enhanced entity extraction
        const results: SearchResult[] = (data.organic_results || []).map((result: any, index: number) => {
          const confidence = calculateResultConfidence(result, query.query, searchRequest.searchParams);
          const relevanceScore = calculateRelevanceScore(result, query.query);
          
          // Extract entities from result content
          const extractedEntities = extractEntitiesFromSearchResult(`${result.title || ''} ${result.snippet || ''}`, searchRequest.searchParams);
          
          return {
            id: `serpapi-${Date.now()}-${index}`,
            title: result.title || 'No title',
            snippet: result.snippet || 'No snippet available',
            url: result.link || '#',
            source: `${result.displayed_link || 'Unknown'} (${query.category})`,
            confidence,
            relevanceScore,
            timestamp: new Date(),
            extractedEntities
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

    // Perform ScraperAPI enhanced data collection
    if (useScraperAPI && searchRequest.searchParams.name) {
      console.log('Performing ScraperAPI enhanced data collection...');
      
      try {
        // Check ScraperAPI credits first
        const creditsCheck = await checkScraperAPICredits(scraperApiKey);
        
        if (creditsCheck.hasCredits) {
          const remainingCredits = creditsCheck.credits;
          
          if (remainingCredits <= 0) {
            console.warn('ScraperAPI: No credits remaining, skipping enhanced data collection');
            // Continue with regular search results
          } else {
            console.log(`ScraperAPI credits remaining: ${remainingCredits}`);
            
            // Generate targeted URLs for people search sites
            const searchUrls = generatePeopleSearchUrls(searchRequest.searchParams);
            
            for (const { platform, url } of searchUrls.slice(0, 3)) { // Limit to 3 sites to control cost
              try {
                const scrapeResult = await performScraperAPISearch(url, platform, scraperApiKey);
                
                if (scrapeResult.success && scrapeResult.html) {
                  // Extract entities from scraped content
                  const extractedData = extractEntitiesFromScrapedContent(scrapeResult.html, platform, searchRequest.searchParams);
                  
                  if (extractedData.length > 0) {
                    scraperApiResults.push(...extractedData);
                    scraperApiCost += scrapeResult.cost || 0;

                    // Store ScraperAPI cost tracking
                    await supabase.from('api_cost_tracking').insert({
                      user_id: user.id,
                      service_name: 'ScraperAPI',
                      operation_type: platform,
                      cost: scrapeResult.cost || 0,
                      queries_used: 1,
                      session_id: session.id
                    });
                  }
                } else if (scrapeResult.error && scrapeResult.error.includes('insufficient credits')) {
                  console.warn(`ScraperAPI: Insufficient credits for ${platform}, stopping further requests`);
                  break;
                }
                
                // Rate limiting between scrapes
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (error) {
                console.error(`ScraperAPI error for ${platform}:`, error);
                // Continue with other platforms even if one fails
              }
            }

            console.log(`ScraperAPI enhanced collection completed. Results: ${scraperApiResults.length}, Cost: $${scraperApiCost.toFixed(4)}`);
          }
        } else {
          console.warn('ScraperAPI: Failed to check credits, proceeding with limited requests');
        }
      } catch (error) {
        console.error('ScraperAPI integration error:', error);
        // Continue with regular search results even if ScraperAPI fails
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

    // Store all results in database (SerpAPI + ScraperAPI)
    const allSearchResults = [...allResults, ...scraperApiResults];
    console.log(`Storing ${allSearchResults.length} results in database (SerpAPI: ${allResults.length}, ScraperAPI: ${scraperApiResults.length})...`);
    
    if (allSearchResults.length > 0) {
      const resultsToInsert = allSearchResults.map(result => ({
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
      } else {
        console.log(`Successfully stored ${resultsToInsert.length} search results`);
      }

      // ENHANCED: Store extracted entities in dedicated table for comprehensive skip tracing
      const allExtractedEntities: any[] = [];
      allSearchResults.forEach((result, resultIndex) => {
        if (result.extractedEntities && result.extractedEntities.length > 0) {
          result.extractedEntities.forEach((entity: any, entityIndex: number) => {
            if (entity && entity.type && entity.value) {  // Validate entity structure
              allExtractedEntities.push({
                session_id: session.id,
                user_id: user.id,
                entity_type: entity.type,
                entity_value: entity.value.toString().trim(),  // Ensure string and trim
                confidence: Math.max(1, Math.min(100, entity.confidence || 60)),  // Ensure valid confidence range
                verified: false,
                source_result_id: `${session.id}-${resultIndex}-${entityIndex}`
              });
            } else {
              console.warn(`Invalid entity structure skipped:`, entity);
            }
          });
        }
      });

      console.log(`Found ${allExtractedEntities.length} entities to store from ${allSearchResults.length} results`);
      
      if (allExtractedEntities.length > 0) {
        console.log(`Attempting to store ${allExtractedEntities.length} extracted entities...`);
        
        // Insert entities in batches to handle large volumes
        const batchSize = 100;
        let totalStored = 0;
        
        for (let i = 0; i < allExtractedEntities.length; i += batchSize) {
          const batch = allExtractedEntities.slice(i, i + batchSize);
          
          const { error: entitiesError, count } = await supabase
            .from('extracted_entities')
            .insert(batch);

          if (entitiesError) {
            console.error(`Error storing entity batch ${i}-${i + batch.length}:`, entitiesError);
            console.error('Sample entity from failed batch:', JSON.stringify(batch[0], null, 2));
          } else {
            totalStored += batch.length;
            console.log(`Successfully stored entity batch: ${batch.length} entities (total: ${totalStored})`);
          }
        }
        
        console.log(`ENTITY STORAGE COMPLETE: ${totalStored}/${allExtractedEntities.length} entities stored successfully`);
      } else {
        console.warn('No valid entities found to store - entity extraction may need improvement');
        
        // Debug: Check if results have extractedEntities
        const resultsWithEntities = allSearchResults.filter(r => r.extractedEntities && r.extractedEntities.length > 0);
        console.log(`Debug: ${resultsWithEntities.length} results have extractedEntities arrays`);
        if (resultsWithEntities.length > 0) {
          console.log('Sample result with entities:', JSON.stringify({
            title: resultsWithEntities[0].title,
            extractedEntities: resultsWithEntities[0].extractedEntities
          }, null, 2));
        }
      }
    } else {
      console.warn('No search results to store');
    }

    // Update search session with final stats including ScraperAPI
    const finalTotalCost = totalCost + scraperApiCost;
    const finalResultCount = allResults.length + scraperApiResults.length;
    
    console.log(`Updating session ${session.id} with completion status...`);
    
    const { error: updateError } = await supabase
      .from('search_sessions')
      .update({
        status: 'completed',
        total_results: finalResultCount,
        total_cost: finalTotalCost,
        completed_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Error updating session:', updateError);
    } else {
      console.log(`Session ${session.id} marked as completed with ${finalResultCount} results and $${finalTotalCost.toFixed(4)} cost`);
    }

    // Combine and remove duplicates, then sort by skip tracing relevance
    const combinedResults = [...allResults, ...scraperApiResults];
    const uniqueResults = deduplicateResults(combinedResults);
    const sortedResults = uniqueResults.sort((a, b) => {
      // Prioritize results with higher confidence + relevance + entity count
      const aScore = a.confidence + a.relevanceScore + (a.extractedEntities?.length || 0) * 5;
      const bScore = b.confidence + b.relevanceScore + (b.extractedEntities?.length || 0) * 5;
      return bScore - aScore;
    });

    console.log(`Search completed. Total results: ${sortedResults.length}, SerpAPI Cost: $${totalCost.toFixed(4)}, ScraperAPI Cost: $${scraperApiCost.toFixed(4)}, Total Cost: $${(totalCost + scraperApiCost).toFixed(4)}`);

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
    
    // Try to update session with error status
    try {
      if (session?.id) {
        await supabase
          .from('search_sessions')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', session.id);
        
        console.log(`Session ${session.id} marked as failed due to error`);
      }
    } catch (updateError) {
      console.error('Failed to update session with error status:', updateError);
    }
    
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

// Geographic proximity data for skip tracing
const GEOGRAPHIC_PROXIMITY = {
  'OK': {
    'Bryan County': ['Calera', 'Caddo', 'Durant', 'Achille', 'Cartwright', 'Colbert', 'Silo'],
    'Atoka County': ['Atoka', 'Stringtown', 'Tushka'],
    'Marshall County': ['Madill', 'Kingston', 'Lebanon'],
  }
};

const AREA_CODE_REGIONS = {
  '580': { state: 'OK', region: 'Southern Oklahoma', counties: ['Bryan', 'Atoka', 'Marshall', 'Carter'] },
  '405': { state: 'OK', region: 'Central Oklahoma', counties: ['Canadian', 'Cleveland', 'Oklahoma'] },
  '918': { state: 'OK', region: 'Eastern Oklahoma', counties: ['Tulsa', 'Creek', 'Rogers'] },
};

// Helper functions
function generateSearchQueries(
  params: SearchRequest['searchParams'], 
  mode: 'basic' | 'deep' | 'targeted'
): Array<{ query: string; category: string }> {
  const queries: Array<{ query: string; category: string }> = [];
  const { name, city, state, phone, email, address } = params;

  // Enhanced skip tracing queries with geographic intelligence
  queries.push({ query: name, category: 'Basic Identity' });
  queries.push({ query: `"${name}"`, category: 'Exact Name Match' });
  
  // Geographic proximity searches for skip tracing
  if (city && state) {
    queries.push({ query: `${name} ${city} ${state}`, category: 'Location-based' });
    
    // Add county-based searches for skip tracing
    if (state === 'OK' && city === 'Calera') {
      queries.push({ query: `${name} Bryan County Oklahoma`, category: 'County Search' });
      queries.push({ query: `${name} Caddo Oklahoma`, category: 'Neighboring City' });
      queries.push({ query: `${name} Durant Oklahoma`, category: 'Neighboring City' });
    }
    
    // Add nearby cities for any location
    const nearbySearches = generateNearbyCityQueries(name, city, state);
    queries.push(...nearbySearches);
  }

  // Enhanced phone searches with area code intelligence
  if (phone) {
    const areaCode = phone.substring(0, 3);
    queries.push({ query: phone, category: 'Phone Lookup' });
    queries.push({ query: `${name} ${phone}`, category: 'Name + Phone' });
    
    // Area code geographic search
    if (AREA_CODE_REGIONS[areaCode]) {
      const region = AREA_CODE_REGIONS[areaCode];
      queries.push({ query: `${name} ${region.region}`, category: 'Area Code Region' });
    }
  }

  // Enhanced email and address searches
  if (email) {
    queries.push({ query: `${name} ${email}`, category: 'Name + Email' });
  }

  if (address) {
    queries.push({ query: `${name} "${address}"`, category: 'Address Search' });
    // Extract street name for broader search
    const streetMatch = address.match(/\d+\s+(.+?)\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct)/i);
    if (streetMatch) {
      queries.push({ query: `${name} "${streetMatch[1]}"`, category: 'Street Name Search' });
    }
  }

  // Skip tracing specific searches
  queries.push({ query: `${name} site:truepeoplesearch.com`, category: 'TruePeopleSearch' });
  queries.push({ query: `${name} site:whitepages.com`, category: 'WhitePages' });
  queries.push({ query: `${name} site:spokeo.com`, category: 'Spokeo' });
  
  // Social media searches - enhanced for skip tracing
  queries.push({ query: `${name} site:linkedin.com`, category: 'LinkedIn' });
  queries.push({ query: `${name} site:facebook.com`, category: 'Facebook' });

  if (mode === 'deep') {
    // Deep skip tracing searches
    queries.push({ query: `${name} property records ${state}`, category: 'Property Records' });
    queries.push({ query: `${name} voter registration ${state}`, category: 'Voter Records' });
    queries.push({ query: `${name} court records ${state}`, category: 'Court Records' });
    queries.push({ query: `${name} business license ${state}`, category: 'Business Records' });
    
    if (address) {
      queries.push({ query: `${name} previous address history`, category: 'Address History' });
    }
  } else if (mode === 'targeted') {
    // Targeted skip tracing searches
    queries.push({ query: `${name} arrest records ${state}`, category: 'Legal Records' });
    queries.push({ query: `${name} bankruptcy court ${state}`, category: 'Financial Records' });
    queries.push({ query: `${name} obituary family ${state}`, category: 'Family Records' });
    queries.push({ query: `${name} relatives associates`, category: 'Associates' });
  }

  // Limit queries based on mode but allow more for skip tracing
  const limits = { basic: 12, deep: 20, targeted: 18 };
  return queries.slice(0, limits[mode]);
}

function generateNearbyCityQueries(name: string, city: string, state: string): Array<{ query: string; category: string }> {
  const queries: Array<{ query: string; category: string }> = [];
  
  // Oklahoma-specific neighboring cities for common skip tracing targets
  const oklahomaNeighbors: Record<string, string[]> = {
    'Calera': ['Caddo', 'Durant', 'Achille', 'Colbert'],
    'Durant': ['Calera', 'Caddo', 'Bokchito', 'Cartwright'],
    'Caddo': ['Calera', 'Atoka', 'Stringtown'],
  };
  
  if (state === 'OK' && oklahomaNeighbors[city]) {
    oklahomaNeighbors[city].forEach(neighbor => {
      queries.push({ query: `${name} ${neighbor} OK`, category: 'Skip Trace Neighbor' });
    });
  }
  
  return queries.slice(0, 3); // Limit neighboring city searches
}

function calculateResultConfidence(result: any, query: string, searchParams?: any): number {
  let confidence = 30; // Lower base confidence for more selective results

  const title = (result.title || '').toLowerCase();
  const snippet = (result.snippet || '').toLowerCase();
  const queryLower = query.toLowerCase();
  const domain = result.displayed_link || '';

  // Title relevance with skip tracing weighting
  if (title.includes(queryLower)) confidence += 25;

  // Snippet relevance with entity detection
  if (snippet.includes(queryLower)) confidence += 20;

  // Skip tracing domain authority (higher weighting for people search sites)
  const skipTracingDomains = [
    'truepeoplesearch.com', 'whitepages.com', 'spokeo.com', 'fastpeoplesearch.com',
    'peoplesearchnow.com', 'truthfinder.com', 'beenverified.com', 'intelius.com'
  ];
  
  const socialDomains = ['linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com'];
  const govDomains = ['gov', 'edu', 'courthouse', 'county'];

  if (skipTracingDomains.some(d => domain.includes(d))) {
    confidence += 20; // High boost for people search sites
  } else if (socialDomains.some(d => domain.includes(d))) {
    confidence += 15; // Medium boost for social media
  } else if (govDomains.some(d => domain.includes(d))) {
    confidence += 12; // Good boost for government sites
  }

  // Geographic proximity boost for skip tracing
  if (searchParams) {
    const { city, state, phone } = searchParams;
    
    // Location matching
    if (city && (title.includes(city.toLowerCase()) || snippet.includes(city.toLowerCase()))) {
      confidence += 15;
    }
    if (state && (title.includes(state.toLowerCase()) || snippet.includes(state.toLowerCase()))) {
      confidence += 10;
    }
    
    // Oklahoma-specific proximity boost
    if (state === 'OK') {
      const okCities = ['calera', 'caddo', 'durant', 'achille', 'bryan county'];
      if (okCities.some(city => title.includes(city) || snippet.includes(city))) {
        confidence += 12; // Proximity boost for Oklahoma cities
      }
    }
    
    // Phone area code matching
    if (phone) {
      const areaCode = phone.substring(0, 3);
      if (snippet.includes(areaCode) || title.includes(areaCode)) {
        confidence += 8;
      }
    }
  }

  // Age and address pattern detection
  if (snippet.match(/age\s+\d{2}/i) || snippet.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
    confidence += 8; // Personal info indicators
  }

  // Address pattern detection
  if (snippet.match(/\d+\s+[A-Za-z\s]+(street|st|avenue|ave|road|rd|drive|dr|lane|ln)/i)) {
    confidence += 10; // Address found
  }

  // Phone number pattern detection
  if (snippet.match(/\(\d{3}\)\s?\d{3}-\d{4}/) || snippet.match(/\d{3}-\d{3}-\d{4}/)) {
    confidence += 12; // Phone number found
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

// Entity extraction from search results - remove duplicate function
// (Already defined above as extractEntitiesFromSearchResult)

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const unique: SearchResult[] = [];
  
  // Sort by confidence first to keep the highest quality duplicates
  const sorted = results.sort((a, b) => (b.confidence + b.relevanceScore) - (a.confidence + a.relevanceScore));
  
  for (const result of sorted) {
    // Create a more sophisticated deduplication key
    const titleKey = result.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const urlKey = result.url.replace(/[^a-z0-9]/g, '');
    const key = `${titleKey}-${urlKey}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(result);
    }
  }
  
  return unique;
}