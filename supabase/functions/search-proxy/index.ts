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
  searchMode: 'basic' | 'deep' | 'enhanced' | 'targeted' | 'comprehensive';
  enableScraperAPI?: boolean;
  scraperApiKey?: string;
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
  intelligentScore?: number;
}

// Enhanced ScraperAPI credit checking function with retry logic
async function checkScraperAPICredits(apiKey: string): Promise<{ hasCredits: boolean; credits: number; error?: string }> {
  try {
    console.log('Checking ScraperAPI credits...');
    
    const response = await fetch(`https://api.scraperapi.com/account?api_key=${apiKey}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Skip-Tracing-App/1.0'
      }
    });
    
    if (!response.ok) {
      console.error(`ScraperAPI account check failed: ${response.status} ${response.statusText}`);
      return { hasCredits: false, credits: 0, error: `API request failed: ${response.status}` };
    }

    const data = await response.json();
    console.log('ScraperAPI account data:', JSON.stringify(data, null, 2));
    
    // FIXED: Calculate remaining credits correctly (requestLimit - requestCount)
    const requestCount = data.requestCount || 0;
    const requestLimit = data.requestLimit || 0;
    const credits = Math.max(0, requestLimit - requestCount);
    
    console.log(`ScraperAPI Credits: ${credits} remaining (${requestCount}/${requestLimit} used)`);
    
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

  // Add overall function timeout (25 seconds)
  const functionTimeout = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn('Function timeout reached (25s)');
    functionTimeout.abort();
  }, 25000);

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

    // Get API keys from Supabase secrets and request body
    const serpApiKey = Deno.env.get('SERPAPI_API_KEY');
    const hunterApiKey = Deno.env.get('HUNTER_API_KEY');
    const scraperApiKey = searchRequest.scraperApiKey || Deno.env.get('SCRAPERAPI_API_KEY');

    if (!serpApiKey) {
      console.error('SerpAPI key validation failed: key not configured in Supabase secrets');
      throw new Error('SerpAPI key not configured in Supabase secrets');
    }
    
    // Basic API key length validation (let SerpAPI validate its own format)
    if (serpApiKey.length < 10) {
      console.error('SerpAPI key validation failed:', {
        keyLength: serpApiKey.length,
        minRequired: 10
      });
      throw new Error('SerpAPI key is too short (minimum 10 characters required)');
    }
    
    console.log('API Keys status:', {
      serpApiAvailable: !!serpApiKey,
      serpApiLength: serpApiKey.length,
      hunterApiAvailable: !!hunterApiKey,
      scraperApiAvailable: !!scraperApiKey
    });

    // Initialize ScraperAPI integration for enhanced data collection
    const useScraperAPI = !!scraperApiKey && (
      searchRequest.searchMode === 'enhanced' || 
      searchRequest.searchMode === 'targeted' ||
      searchRequest.searchMode === 'comprehensive' ||
      (searchRequest.searchMode === 'basic' && searchRequest.enableScraperAPI)
    );
    console.log(`ScraperAPI integration: ${useScraperAPI ? 'enabled' : 'disabled'} for mode: ${searchRequest.searchMode}`, {
      hasScraperApiKey: !!scraperApiKey,
      keySource: searchRequest.scraperApiKey ? 'request' : 'environment',
      mode: searchRequest.searchMode
    });

    let scraperApiResults: SearchResult[] = [];
    let scraperApiCost = 0;

// Generate OPTIMIZED search queries - reduced for performance
    const queries = generateOptimizedSearchQueries(searchRequest.searchParams, searchRequest.searchMode);
    console.log(`Generated ${queries.length} optimized queries for ${searchRequest.searchMode} mode`);

    // PARALLEL PROCESSING with circuit breaker pattern
    const scraperAPIPromise = useScraperAPI && searchRequest.searchParams.name ? 
      performScraperAPISearchConcurrent(scraperApiKey, searchRequest.searchParams, session.id, user.id, supabase) : 
      Promise.resolve({ results: [], cost: 0 });

    // Process SerpAPI searches in PARALLEL BATCHES with timeout
    const serpAPIPromise = performSerpAPISearchesConcurrent(queries, searchRequest, serpApiKey, session.id, user.id, supabase);

    // Circuit breaker: Wait up to 20 seconds for both APIs, then return partial results
    const [serpAPIData, scraperAPIData] = await Promise.allSettled([
      Promise.race([
        serpAPIPromise,
        new Promise<{ results: SearchResult[]; cost: number }>((_, reject) => 
          setTimeout(() => reject(new Error('SerpAPI timeout')), 20000)
        )
      ]),
      Promise.race([
        scraperAPIPromise,
        new Promise<{ results: SearchResult[]; cost: number }>((_, reject) => 
          setTimeout(() => reject(new Error('ScraperAPI timeout')), 20000)
        )
      ])
    ]);

    // Handle partial results gracefully
    const serpResults = serpAPIData.status === 'fulfilled' ? serpAPIData.value : { results: [], cost: 0 };
    const scraperResults = scraperAPIData.status === 'fulfilled' ? scraperAPIData.value : { results: [], cost: 0 };
    
    if (serpAPIData.status === 'rejected') {
      console.warn('SerpAPI failed:', serpAPIData.reason?.message);
    }
    if (scraperAPIData.status === 'rejected') { 
      console.warn('ScraperAPI failed:', scraperAPIData.reason?.message);
    }
    
    allResults.push(...serpResults.results);
    scraperApiResults = scraperResults.results;
    totalCost += serpResults.cost + scraperResults.cost;
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

      console.log(`🔍 ENTITY EXTRACTION DEBUG:`);
      console.log(`- Search results found: ${allSearchResults.length}`);
      console.log(`- ScraperAPI results found: ${scraperApiResults.length}`);
      
      // ENHANCED: Store extracted entities in dedicated table for comprehensive skip tracing
      const allExtractedEntities: any[] = [];
      
      // Process search results entities
      allSearchResults.forEach((result, resultIndex) => {
        console.log(`Processing result ${resultIndex}: "${result.title?.substring(0, 50)}..."`);
        console.log(`- Has extractedEntities: ${!!result.extractedEntities}`);
        console.log(`- Entity count: ${result.extractedEntities?.length || 0}`);
        
        if (result.extractedEntities && result.extractedEntities.length > 0) {
          result.extractedEntities.forEach((entity: any, entityIndex: number) => {
            if (entity && entity.type && entity.value) {  // Validate entity structure
              const cleanedEntity = {
                session_id: session.id,
                user_id: user.id,
                entity_type: entity.type,
                entity_value: entity.value.toString().trim(),  // Ensure string and trim
                confidence: Math.max(1, Math.min(100, entity.confidence || 60)),  // Ensure valid confidence range
                verified: false,
                source_result_id: `search-${session.id}-${resultIndex}-${entityIndex}`
              };
              allExtractedEntities.push(cleanedEntity);
              console.log(`✅ Added entity: ${entity.type} = "${entity.value}" (confidence: ${entity.confidence})`);
            } else {
              console.warn(`❌ Invalid entity structure skipped:`, entity);
            }
          });
        } else {
          // Debug: Check if extraction was attempted
          const resultText = `${result.title || ''} ${result.snippet || ''}`;
          console.log(`⚠️ No entities found in result with ${resultText.length} chars of text`);
          
          // Test manual extraction for debugging
          const testEntities = extractEntitiesFromSearchResult(resultText, searchRequest.searchParams);
          console.log(`🧪 Manual extraction test found ${testEntities.length} entities:`, testEntities.slice(0, 3));
        }
      });
      
      // Process ScraperAPI results entities
      scraperApiResults.forEach((result, resultIndex) => {
        console.log(`Processing ScraperAPI result ${resultIndex}: "${result.title?.substring(0, 50)}..."`);
        if (result.extractedEntities && result.extractedEntities.length > 0) {
          result.extractedEntities.forEach((entity: any, entityIndex: number) => {
            if (entity && entity.type && entity.value) {
              const cleanedEntity = {
                session_id: session.id,
                user_id: user.id,
                entity_type: entity.type,
                entity_value: entity.value.toString().trim(),
                confidence: Math.max(1, Math.min(100, entity.confidence || 70)),
                verified: false,
                source_result_id: `scraper-${session.id}-${resultIndex}-${entityIndex}`
              };
              allExtractedEntities.push(cleanedEntity);
              console.log(`✅ Added ScraperAPI entity: ${entity.type} = "${entity.value}"`);
            }
          });
        }
      });

      console.log(`📊 ENTITY SUMMARY: Found ${allExtractedEntities.length} entities to store from ${allSearchResults.length + scraperApiResults.length} total results`);
      
      if (allExtractedEntities.length > 0) {
        console.log(`🎯 ENTITY STORAGE: Attempting to store ${allExtractedEntities.length} extracted entities...`);
        console.log(`Sample entity for debugging:`, JSON.stringify(allExtractedEntities[0], null, 2));
        
        // Insert entities in batches to handle large volumes
        const batchSize = 50; // Smaller batches for better error handling
        let totalStored = 0;
        
        for (let i = 0; i < allExtractedEntities.length; i += batchSize) {
          const batch = allExtractedEntities.slice(i, i + batchSize);
          
          const { error: entitiesError, count } = await supabase
            .from('extracted_entities')
            .insert(batch);

          if (entitiesError) {
            console.error(`💥 ENTITY STORAGE ERROR for batch ${i}-${i + batch.length}:`, entitiesError);
            console.error('Failed batch sample:', JSON.stringify(batch[0], null, 2));
            
            // Try individual inserts to identify problematic entities
            for (const entity of batch) {
              const { error: individualError } = await supabase
                .from('extracted_entities')
                .insert(entity);
              
              if (individualError) {
                console.error(`💥 Individual entity failed:`, entity, individualError);
              } else {
                totalStored++;
                console.log(`✅ Individual entity stored successfully`);
              }
            }
          } else {
            totalStored += batch.length;
            console.log(`✅ BATCH SUCCESS: Stored ${batch.length} entities (total: ${totalStored}/${allExtractedEntities.length})`);
          }
        }
        
        console.log(`🏁 ENTITY STORAGE COMPLETE: ${totalStored}/${allExtractedEntities.length} entities stored successfully`);
        
        if (totalStored === 0) {
          console.error(`🚨 CRITICAL: No entities were stored despite finding ${allExtractedEntities.length} entities to store!`);
        }
      } else {
        console.warn('⚠️ NO ENTITIES FOUND - This indicates an issue with entity extraction');
        
        // Enhanced debugging: Test extraction on sample data
        console.log('🔬 EXTRACTION DEBUG: Testing extraction functions...');
        const sampleText = "John Smith lives at 123 Main Street and his phone number is (580) 555-1234. Email: john@example.com";
        const testExtraction = extractEntitiesFromSearchResult(sampleText, searchRequest.searchParams);
        console.log(`Test extraction found ${testExtraction.length} entities:`, testExtraction);
        
        // Debug: Check results structure  
        const debugInfo = allSearchResults.slice(0, 2).map(r => ({
          id: r.id,
          title: r.title?.substring(0, 50),
          snippet: r.snippet?.substring(0, 100),
          hasExtractedEntities: !!r.extractedEntities,
          extractedEntitiesCount: r.extractedEntities?.length || 0,
          extractedEntitiesContent: r.extractedEntities?.slice(0, 2)
        }));
        console.log('🔍 Sample results structure:', JSON.stringify(debugInfo, null, 2));
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
    
    // Apply intelligent filtering for enhanced mode
    let finalResults = uniqueResults;
    if (searchRequest.searchMode === 'enhanced' && uniqueResults.length > 0) {
      console.log('🧠 Applying intelligent filtering for Enhanced Pro mode');
      // Simple filtering - prioritize results with more entities and higher confidence
      finalResults = uniqueResults.filter(result => 
        result.confidence >= 50 || 
        (result.extractedEntities && result.extractedEntities.length > 0)
      );
      
      if (finalResults.length === 0) {
        finalResults = uniqueResults; // Fallback to all results if filtering is too strict
      }
      console.log(`🧠 Enhanced filtering complete: ${finalResults.length} high-quality results retained from ${uniqueResults.length} total`);
    }
    
    const sortedResults = finalResults.sort((a, b) => {
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

  } catch (error: any) {
    console.error('Search proxy error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: [],
      entities: [],
      cost: 0,
      totalResults: 0,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    // Clear the function timeout
    clearTimeout(timeoutId);
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

const AREA_CODE_REGIONS: Record<string, { state: string; region: string; counties: string[] }> = {
  '580': { state: 'OK', region: 'Southern Oklahoma', counties: ['Bryan', 'Atoka', 'Marshall', 'Carter'] },
  '405': { state: 'OK', region: 'Central Oklahoma', counties: ['Canadian', 'Cleveland', 'Oklahoma'] },
  '918': { state: 'OK', region: 'Eastern Oklahoma', counties: ['Tulsa', 'Creek', 'Rogers'] },
};

// OPTIMIZED search query generation - reduced for performance
function generateOptimizedSearchQueries(
  params: SearchRequest['searchParams'], 
  mode: 'basic' | 'deep' | 'targeted' | 'enhanced' | 'comprehensive'
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
  } else if (mode === 'comprehensive') {
    // Comprehensive mode - includes everything
    queries.push({ query: `${name} ${city} ${state} phone directory`, category: 'Directory' });
    queries.push({ query: `${name} ${city} social media profile`, category: 'Social Media' });
    queries.push({ query: `${name} arrest records ${state}`, category: 'Legal Records' });
    queries.push({ query: `${name} bankruptcy court ${state}`, category: 'Financial Records' });
    queries.push({ query: `${name} obituary family ${state}`, category: 'Family Records' });
    queries.push({ query: `${name} relatives associates`, category: 'Associates' });
  }

  // OPTIMIZED: Reduced limits for better performance and timeout prevention
  const limits = { basic: 6, deep: 8, targeted: 10, enhanced: 8, comprehensive: 12 };
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
  
  return queries.slice(0, 2); // Further reduced for performance
}

// CONCURRENT processing functions for better performance
async function performSerpAPISearchesConcurrent(
  queries: Array<{ query: string; category: string }>,
  searchRequest: SearchRequest,
  serpApiKey: string,
  sessionId: string,
  userId: string,
  supabase: any
): Promise<{ results: SearchResult[]; cost: number }> {
  const results: SearchResult[] = [];
  let totalCost = 0;
  
  // Limit queries for better performance (top 6 most relevant)
  const limitedQueries = queries.slice(0, 6);
  console.log(`Processing ${limitedQueries.length} prioritized SerpAPI queries...`);
  
  // Process all queries in parallel with individual timeouts
  const queryPromises = limitedQueries.map(query => 
    Promise.race([
      performSingleSerpAPISearch(query, searchRequest, serpApiKey, sessionId, userId, supabase),
      new Promise<{ results: SearchResult[]; cost: number }>((_, reject) => 
        setTimeout(() => reject(new Error(`Query timeout: ${query.query}`)), 6000)
      )
    ])
  );
  
  try {
    const queryResults = await Promise.allSettled(queryPromises);
    
    queryResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(...result.value.results);
        totalCost += result.value.cost;
      } else {
        console.warn(`Query "${limitedQueries[index].query}" failed:`, 
          result.status === 'rejected' ? result.reason?.message : 'Unknown error');
      }
    });
  } catch (error) {
    console.error('SerpAPI batch processing error:', error);
  }
  
  console.log(`SerpAPI processing completed: ${results.length} results, $${totalCost.toFixed(4)} cost`);
  return { results, cost: totalCost };
}

async function performSingleSerpAPISearch(
  query: { query: string; category: string },
  searchRequest: SearchRequest,
  serpApiKey: string,
  sessionId: string,
  userId: string,
  supabase: any
): Promise<{ results: SearchResult[]; cost: number }> {
  try {
    const searchParams: Record<string, string> = {
      engine: 'google',
      q: query.query,
      api_key: serpApiKey,
      num: '10', // Reduced from 20 for better performance
      safe: 'off',
      no_cache: 'true'
    };
    
    if (searchRequest.location) {
      searchParams.location = searchRequest.location;
    }
    
    const params = new URLSearchParams(searchParams);
    
    // 5-second timeout per individual request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(`https://serpapi.com/search?${params}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorData = await response.text();
          errorDetails = errorData.substring(0, 200); // First 200 chars of error response
        } catch (e) {
          errorDetails = 'Unable to read error response';
        }
        console.error(`SerpAPI HTTP error for "${query.query}":`, {
          status: response.status,
          statusText: response.statusText,
          errorDetails
        });
        return { results: [], cost: 0 };
      }
      
      const data = await response.json();
      
      if (data.error || !data.organic_results || data.organic_results.length === 0) {
        console.warn(`SerpAPI data validation failed for "${query.query}":`, {
          hasError: !!data.error,
          errorMessage: data.error,
          hasResults: !!data.organic_results,
          resultsCount: data.organic_results?.length || 0,
          searchInfo: data.search_information || null
        });
        return { results: [], cost: 0 };
      }
      
      const results: SearchResult[] = data.organic_results.map((result: any, index: number) => {
        const confidence = calculateResultConfidence(result, query.query, searchRequest.searchParams);
        const relevanceScore = calculateRelevanceScore(result, query.query);
        const extractedEntities = extractEntitiesFromSearchResult(`${result.title || ''} ${result.snippet || ''}`, searchRequest.searchParams);
        
        return {
          id: `serpapi-${sessionId}-${Date.now()}-${index}`,
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
      
      const searchCost = 0.005;
      
      // Track cost in database
      await supabase.from('api_cost_tracking').insert({
        user_id: userId,
        service_name: 'SerpAPI',
        operation_type: query.category,
        cost: searchCost,
        queries_used: 1,
        session_id: sessionId
      });
      
      return { results, cost: searchCost };
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error(`SerpAPI timeout for query "${query.query}"`);
      } else {
        console.error(`SerpAPI fetch error for "${query.query}":`, fetchError);
      }
      return { results: [], cost: 0 };
    }
    
  } catch (error) {
    console.error(`Error in performSingleSerpAPISearch for "${query.query}":`, error);
    return { results: [], cost: 0 };
  }
}

async function performScraperAPISearchConcurrent(
  scraperApiKey: string,
  searchParams: SearchRequest['searchParams'],
  sessionId: string,
  userId: string,
  supabase: any
): Promise<{ results: SearchResult[]; cost: number }> {
  try {
    console.log('Starting concurrent ScraperAPI search...');
    
    // Check credits first
    const creditsCheck = await checkScraperAPICredits(scraperApiKey);
    
    if (!creditsCheck.hasCredits || creditsCheck.credits <= 0) {
      console.warn('ScraperAPI: No credits remaining');
      return { results: [], cost: 0 };
    }
    
    console.log(`ScraperAPI credits remaining: ${creditsCheck.credits}`);
    
    // Generate targeted URLs - limit to 2 sites for performance
    const searchUrls = generatePeopleSearchUrls(searchParams);
    const limitedUrls = searchUrls.slice(0, 2);
    
    const results: SearchResult[] = [];
    let totalCost = 0;
    
    // Process sites in parallel with timeout
    const sitePromises = limitedUrls.map(async ({ platform, url }) => {
      try {
        const scrapeResult: any = await Promise.race([
          performScraperAPISearch(url, platform, scraperApiKey),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('ScraperAPI timeout')), 10000)
          )
        ]);
        
        if (scrapeResult.success && scrapeResult.html) {
          const extractedData = extractEntitiesFromScrapedContent(scrapeResult.html, platform, searchParams);
          
          if (extractedData && extractedData.length > 0) {
            const scraperResult: SearchResult = {
              id: `scraper-${sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: `${searchParams.name} - ${platform} Data`,
              snippet: `Found ${extractedData.length} entities from ${platform}`,
              url: url,
              source: `${platform} (Enhanced)`,
              confidence: 85,
              relevanceScore: 90,
              timestamp: new Date(),
              extractedEntities: extractedData
            };
            
            return { result: scraperResult, cost: 0.01 }; // ScraperAPI costs ~$1 per 100 requests
          }
        }
        
        return { result: null, cost: 0.01 };
        
      } catch (error) {
        console.error(`ScraperAPI error for ${platform}:`, error);
        return { result: null, cost: 0.01 };
      }
    });
    
    const siteResults = await Promise.allSettled(sitePromises);
    
    siteResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.result) {
        results.push(result.value.result);
        totalCost += result.value.cost;
      } else if (result.status === 'fulfilled') {
        totalCost += result.value.cost;
      }
    });
    
    // Track cost
    if (totalCost > 0) {
      await supabase.from('api_cost_tracking').insert({
        user_id: userId,
        service_name: 'ScraperAPI',
        operation_type: 'Enhanced Data Collection',
        cost: totalCost,
        queries_used: limitedUrls.length,
        session_id: sessionId
      });
    }
    
    console.log(`ScraperAPI concurrent processing completed: ${results.length} results, $${totalCost.toFixed(4)} cost`);
    return { results, cost: totalCost };
    
  } catch (error) {
    console.error('ScraperAPI concurrent processing error:', error);
    return { results: [], cost: 0 };
  }
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