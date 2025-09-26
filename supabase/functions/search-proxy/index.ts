import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SERPAPI_API_KEY = Deno.env.get('SERPAPI_API_KEY');
const HUNTER_API_KEY = Deno.env.get('HUNTER_API_KEY');
const SCRAPERAPI_API_KEY = Deno.env.get('SCRAPERAPI_API_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface SearchResult {
  id: string;
  title: string;
  snippet?: string;
  url: string;
  source: string;
  confidence: number;
  entities: EntityResult[];
}

interface EntityResult {
  type: string;
  value: string;
  confidence: number;
}

// Enhanced entity extraction
function extractEntities(text: string, query: string): EntityResult[] {
  if (!text) return [];
  
  const entities: EntityResult[] = [];
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  
  // Extract emails with higher confidence
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex) || [];
  emails.forEach(email => {
    const confidence = normalizedText.includes(normalizedQuery) ? 0.9 : 0.7;
    entities.push({ type: 'email', value: email, confidence });
  });

  // Extract phone numbers with various formats
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phones = text.match(phoneRegex) || [];
  phones.forEach(phone => {
    const confidence = normalizedText.includes(normalizedQuery) ? 0.85 : 0.65;
    entities.push({ type: 'phone', value: phone.trim(), confidence });
  });

  // Extract addresses
  const addressRegex = /\b\d+[\w\s.,#-]+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Way|Circle|Pl|Place)\b/gi;
  const addresses = text.match(addressRegex) || [];
  addresses.forEach(address => {
    const confidence = normalizedText.includes(normalizedQuery) ? 0.8 : 0.6;
    entities.push({ type: 'address', value: address.trim(), confidence });
  });

  // Extract names (improved detection)
  const words = text.split(/\s+/);
  const queryWords = query.toLowerCase().split(/\s+/);
  
  for (let i = 0; i < words.length - 1; i++) {
    const word1 = words[i];
    const word2 = words[i + 1];
    
    // Check if both words start with capital letters (likely names)
    if (/^[A-Z][a-z]+$/.test(word1) && /^[A-Z][a-z]+$/.test(word2)) {
      const fullName = `${word1} ${word2}`;
      const isQueryMatch = queryWords.some(qw => 
        fullName.toLowerCase().includes(qw) || qw.includes(fullName.toLowerCase())
      );
      
      if (isQueryMatch || fullName.length > 6) { // Longer names more likely to be real
        const confidence = isQueryMatch ? 0.9 : 0.6;
        entities.push({ type: 'name', value: fullName, confidence });
      }
    }
  }

  // Extract ages
  const ageRegex = /\b(?:age|aged|years old|yr old)\s*:?\s*(\d{1,3})\b/gi;
  const ages = [...text.matchAll(ageRegex)];
  ages.forEach(match => {
    const age = match[1];
    if (parseInt(age) >= 10 && parseInt(age) <= 120) { // Reasonable age range
      entities.push({ type: 'age', value: age, confidence: 0.8 });
    }
  });

  return entities;
}

// Calculate intelligent confidence based on relevance
function calculateIntelligentConfidence(content: string, type: string, query: string): number {
  if (!content || !query) return 0.3;
  
  const normalizedContent = content.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  const queryWords = normalizedQuery.split(/\s+/);
  
  let confidence = 0.3; // Base confidence
  
  // Exact query match in content
  if (normalizedContent.includes(normalizedQuery)) {
    confidence += 0.4;
  }
  
  // Partial word matches
  const matchingWords = queryWords.filter(word => 
    word.length > 2 && normalizedContent.includes(word)
  );
  confidence += (matchingWords.length / queryWords.length) * 0.3;
  
  // Content type bonuses
  if (type === 'search_result') {
    if (content.length > 100) confidence += 0.1; // Longer content typically better
    if (normalizedContent.includes('profile') || normalizedContent.includes('directory')) {
      confidence += 0.1;
    }
  }
  
  return Math.min(confidence, 0.99);
}

// API Functions
async function fetchSerpAPI(query: string): Promise<SearchResult[]> {
  if (!SERPAPI_API_KEY) {
    console.log('⚠️ SerpAPI key not configured');
    return [];
  }

  try {
    console.log('🔍 Fetching from SerpAPI...');
    const url = `https://serpapi.com/search?q=${encodeURIComponent(query)}&api_key=${SERPAPI_API_KEY}&num=10`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SerpAPI HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 SerpAPI response keys:', Object.keys(data));
    
    const organicResults = data.organic_results || [];
    
    return organicResults.slice(0, 10).map((item: any) => ({
      id: crypto.randomUUID(),
      title: item.title || 'No title',
      snippet: item.snippet || '',
      url: item.link || '',
      source: 'serpapi',
      confidence: calculateIntelligentConfidence(item.title + ' ' + (item.snippet || ''), 'search_result', query),
      entities: extractEntities((item.title || '') + ' ' + (item.snippet || ''), query)
    }));
    
  } catch (error) {
    console.error('❌ SerpAPI error:', error);
    return [];
  }
}

async function fetchHunterAPI(query: string): Promise<SearchResult[]> {
  if (!HUNTER_API_KEY) {
    console.log('⚠️ Hunter API key not configured');
    return [];
  }

  try {
    console.log('🔍 Fetching from Hunter.io...');
    
    // Extract domain from query if it contains one
    const domainMatch = query.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const domain = domainMatch ? domainMatch[1] : query.replace(/\s+/g, '') + '.com';
    
    const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}&limit=5`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Hunter API HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📧 Hunter API response:', data.meta);
    
    if (data.data && data.data.emails && data.data.emails.length > 0) {
      return data.data.emails.map((email: any) => ({
        id: crypto.randomUUID(),
        title: `Email found: ${email.value}`,
        snippet: `${email.first_name || ''} ${email.last_name || ''} - ${email.position || ''} at ${data.data.domain}`.trim(),
        url: `https://${data.data.domain}`,
        source: 'hunter',
        confidence: email.confidence / 100, // Hunter provides confidence 0-100
        entities: [
          { type: 'email', value: email.value, confidence: email.confidence / 100 },
          ...(email.first_name && email.last_name ? 
            [{ type: 'name', value: `${email.first_name} ${email.last_name}`, confidence: 0.8 }] : []
          )
        ]
      }));
    }
    
    return [];
    
  } catch (error) {
    console.error('❌ Hunter API error:', error);
    return [];
  }
}

async function fetchScraperAPI(query: string): Promise<SearchResult[]> {
  if (!SCRAPERAPI_API_KEY) {
    console.log('⚠️ ScraperAPI key not configured');
    return [];
  }

  try {
    console.log('🔍 Fetching from ScraperAPI...');
    
    // Use ScraperAPI to scrape Google search results
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const url = `https://api.scraperapi.com?api_key=${SCRAPERAPI_API_KEY}&url=${encodeURIComponent(searchUrl)}&render=true`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ScraperAPI HTTP ${response.status}`);
    }
    
    const html = await response.text();
    console.log('🌐 ScraperAPI response length:', html.length);
    
    // Simple HTML parsing to extract search results
    const results: SearchResult[] = [];
    
    // Extract basic info from HTML (simplified)
    const titleMatches = html.match(/<h3[^>]*>([^<]+)<\/h3>/g) || [];
    const linkMatches = html.match(/href="([^"]*google\.com[^"]*)"/g) || [];
    
    for (let i = 0; i < Math.min(titleMatches.length, 5); i++) {
      const title = titleMatches[i].replace(/<[^>]*>/g, '').trim();
      if (title && title.length > 5) {
        results.push({
          id: crypto.randomUUID(),
          title: title,
          snippet: `Search result from ScraperAPI for: ${query}`,
          url: `https://google.com/search?q=${encodeURIComponent(query)}`,
          source: 'scraperapi',
          confidence: calculateIntelligentConfidence(title, 'search_result', query),
          entities: extractEntities(title, query)
        });
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ ScraperAPI error:', error);
    return [];
  }
}

// Main handler
serve(async (req) => {
  console.log(`🌍 ${req.method} ${req.url}`);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse request body with detailed error handling
    let requestBody;
    try {
      const text = await req.text();
      console.log('📥 Request body length:', text.length);
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty request body');
      }
      
      requestBody = JSON.parse(text);
      console.log('📋 Request params:', Object.keys(requestBody));
      
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { q: query, userId, sessionId } = requestBody;

    // Validate required parameters
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return new Response(JSON.stringify({
        error: 'Missing or invalid query parameter',
        required: 'q (string, non-empty)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!userId || typeof userId !== 'string') {
      return new Response(JSON.stringify({
        error: 'Missing or invalid userId parameter',
        required: 'userId (string)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const searchSessionId = sessionId || crypto.randomUUID();
    const trimmedQuery = query.trim();

    console.log(`🔍 Starting search for: "${trimmedQuery}" (User: ${userId}, Session: ${searchSessionId})`);

    // Execute all searches in parallel
    const searchPromises = [
      fetchSerpAPI(trimmedQuery),
      fetchHunterAPI(trimmedQuery),  
      fetchScraperAPI(trimmedQuery)
    ];

    const results = await Promise.allSettled(searchPromises);
    console.log('📊 Search results:', results.map((r, i) => ({
      api: ['SerpAPI', 'Hunter', 'ScraperAPI'][i],
      status: r.status,
      count: r.status === 'fulfilled' ? r.value.length : 0
    })));

    // Combine all successful results
    const allResults: SearchResult[] = [];
    let totalApiCost = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
        
        // Add basic cost tracking
        const apiNames = ['serpapi', 'hunter', 'scraperapi'];
        const costs = [0.005, 0.01, 0.001]; // Approximate costs per request
        
        if (result.value.length > 0) {
          totalApiCost += costs[index];
        }
      }
    });

    console.log(`✅ Combined ${allResults.length} results from all APIs`);

    // Save results and entities to database
    if (allResults.length > 0) {
      try {
        // Save search results
        const searchResultsToInsert = allResults.map(result => ({
          id: result.id,
          session_id: searchSessionId,
          user_id: userId,
          title: result.title,
          snippet: result.snippet || '',
          url: result.url,
          source: result.source,
          confidence: Math.round(result.confidence * 100),
          relevance_score: Math.round(result.confidence * 100),
          result_type: 'search',
          query_used: trimmedQuery,
          extracted_entities: result.entities
        }));

        const { error: resultsError } = await supabase
          .from('search_results')
          .insert(searchResultsToInsert);

        if (resultsError) {
          console.error('❌ Failed to save search results:', resultsError);
        } else {
          console.log('💾 Saved search results to database');
        }

        // Save extracted entities
        const entitiesToInsert: any[] = [];
        allResults.forEach(result => {
          result.entities.forEach(entity => {
            entitiesToInsert.push({
              session_id: searchSessionId,
              user_id: userId,
              entity_type: entity.type,
              entity_value: entity.value,
              confidence: Math.round(entity.confidence * 100),
              source_result_id: result.id,
              verified: false
            });
          });
        });

        if (entitiesToInsert.length > 0) {
          const { error: entitiesError } = await supabase
            .from('extracted_entities')
            .insert(entitiesToInsert);

          if (entitiesError) {
            console.error('❌ Failed to save entities:', entitiesError);
          } else {
            console.log(`💾 Saved ${entitiesToInsert.length} entities to database`);
          }
        }

        // Save API cost tracking
        if (totalApiCost > 0) {
          const { error: costError } = await supabase
            .from('api_cost_tracking')
            .insert({
              session_id: searchSessionId,
              user_id: userId,
              service_name: 'combined_search',
              operation_type: 'search',
              cost: totalApiCost,
              queries_used: 1
            });

          if (costError) {
            console.error('❌ Failed to save cost tracking:', costError);
          }
        }

      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        // Continue even if DB save fails
      }
    }

    // Return response
    const response = {
      success: true,
      sessionId: searchSessionId,
      query: trimmedQuery,
      totalResults: allResults.length,
      totalCost: totalApiCost,
      results: allResults,
      summary: {
        serpapi: results[0].status === 'fulfilled' ? results[0].value.length : 0,
        hunter: results[1].status === 'fulfilled' ? results[1].value.length : 0,  
        scraperapi: results[2].status === 'fulfilled' ? results[2].value.length : 0,
        totalEntities: allResults.reduce((sum, r) => sum + r.entities.length, 0)
      }
    };

    console.log(`🎉 Search completed successfully: ${allResults.length} results, ${response.summary.totalEntities} entities`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});