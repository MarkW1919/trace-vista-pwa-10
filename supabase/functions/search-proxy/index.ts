import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SERPAPI_API_KEY = Deno.env.get('SERPAPI_API_KEY')!;
const HUNTER_API_KEY = Deno.env.get('HUNTER_API_KEY')!;
const SCRAPERAPI_API_KEY = Deno.env.get('SCRAPERAPI_API_KEY')!;

function calculateIntelligentConfidence(value: string, type: string, query: string): number {
  let base = 0.5;
  if (value.toLowerCase().includes(query.toLowerCase())) base += 0.2;
  if (type === 'email') base += 0.1;
  return Math.min(base, 0.99);
}

/** Entrypoint */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Add better error handling for request body
    let body;
    try {
      const text = await req.text();
      console.log('🔍 Raw request body length:', text.length);
      console.log('🔍 Request method:', req.method);
      console.log('🔍 Content-Type:', req.headers.get('Content-Type'));
      
      if (!text.trim()) {
        console.error('❌ Empty request body received');
        return new Response(JSON.stringify({ 
          error: 'Empty request body',
          received: 'No body content'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      body = JSON.parse(text);
      console.log('✅ Successfully parsed JSON body:', Object.keys(body));
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

    const { q: query, userId, user_id, sessionId } = body;
    
    // Handle both userId and user_id for backwards compatibility
    const actualUserId = userId || user_id;
    const actualSessionId = sessionId || crypto.randomUUID();

    console.log('🔍 Extracted parameters:', { 
      query, 
      actualUserId, 
      actualSessionId
    });

    if (!query || !actualUserId) {
      console.error('❌ Missing required parameters:', { 
        hasQuery: !!query, 
        hasUserId: !!actualUserId,
        query,
        actualUserId 
      });
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters',
        required: ['q (query)', 'userId'],
        received: { q: !!query, userId: !!actualUserId }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create streaming response
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Send opening JSON structure
        controller.enqueue(encoder.encode('{ "results": [\n'));
        
        let first = true;
        let resultCount = 0;

        // Function to send a result
        const sendResult = (result: any) => {
          try {
            if (!first) {
              controller.enqueue(encoder.encode(',\n'));
            }
            controller.enqueue(encoder.encode(JSON.stringify(result)));
            first = false;
            resultCount++;
          } catch (err) {
            console.error('Error sending result:', err);
          }
        };

        // Start API searches
        const searchPromises = [
          fetchSerpAPI(query).catch(err => { 
            console.warn('SerpAPI failed:', err.message); 
            return []; 
          }),
          fetchHunterAPI(query).catch(err => { 
            console.warn('Hunter failed:', err.message); 
            return []; 
          }),
          fetchScraperAPI(query).catch(err => { 
            console.warn('ScraperAPI failed:', err.message); 
            return []; 
          })
        ];

        console.log('🚀 Starting parallel API searches...');

        Promise.allSettled(searchPromises).then(async (results) => {
          try {
            console.log('📊 API search results:', results.map((r, i) => ({
              api: ['SerpAPI', 'Hunter', 'ScraperAPI'][i],
              status: r.status,
              resultCount: r.status === 'fulfilled' ? r.value?.length || 0 : 0
            })));

            for (const result of results) {
              if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                for (const apiResult of result.value) {
                  // Enhance with entities and confidence
                  const enhanced = {
                    ...apiResult,
                    id: crypto.randomUUID(),
                    confidence: calculateIntelligentConfidence(
                      apiResult.title || apiResult.snippet || '', 
                      'search_result', 
                      query
                    ),
                    entities: extractEntities(apiResult.title + ' ' + (apiResult.snippet || ''), query)
                  };

                  // Save entities to database
                  if (enhanced.entities?.length && actualSessionId) {
                    const extractedEntities = enhanced.entities.map((entity: any) => ({
                      session_id: actualSessionId,
                      entity_type: entity.type,
                      entity_value: entity.value,
                      confidence: entity.confidence,
                      source_result_id: enhanced.id,
                      user_id: actualUserId
                    }));
                    
                    console.log('💾 Inserting entities:', extractedEntities.length);
                    const { error: entityError } = await supabase.from('extracted_entities').insert(extractedEntities);
                    if (entityError) {
                      console.error('❌ Entity insert error:', entityError);
                    } else {
                      console.log('✅ Entities inserted successfully');
                    }
                  }

                  sendResult(enhanced);
                }
              }
            }

            console.log(`✅ Streaming complete. Total results: ${resultCount}`);

            // Close JSON structure
            controller.enqueue(encoder.encode(`\n], "sessionId": "${actualSessionId}", "totalResults": ${resultCount} }`));
            controller.close();
          } catch (err) {
            console.error('Stream processing error:', err);
            controller.error(err);
          }
        }).catch(err => {
          console.error('Search promise error:', err);
          controller.error(err);
        });
      }
    });

    return new Response(stream, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error: any) {
    console.error('❌ Streaming search error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper functions
async function fetchSerpAPI(query: string): Promise<any[]> {
  if (!SERPAPI_API_KEY) return [];
  try {
    const res = await fetch(`https://serpapi.com/search?q=${encodeURIComponent(query)}&api_key=${SERPAPI_API_KEY}`);
    const data = await res.json();
    return data.organic_results?.map((item: any) => ({
      title: item.title,
      snippet: item.snippet,
      url: item.link,
      source: 'serpapi'
    })) || [];
  } catch (err) {
    console.error('SerpAPI error:', err);
    return [];
  }
}

async function fetchHunterAPI(query: string): Promise<any[]> {
  if (!HUNTER_API_KEY) return [];
  try {
    const res = await fetch(`https://api.hunter.io/v2/email-finder?domain=${query}&api_key=${HUNTER_API_KEY}`);
    const data = await res.json();
    return data.data ? [{
      title: `Email found for ${query}`,
      snippet: `Found: ${data.data.email}`,
      url: `https://${query}`,
      source: 'hunter'
    }] : [];
  } catch (err) {
    console.error('Hunter API error:', err);
    return [];
  }
}

async function fetchScraperAPI(query: string): Promise<any[]> {
  if (!SCRAPERAPI_API_KEY) {
    console.log('⚠️ ScraperAPI key not found, skipping ScraperAPI search');
    return [];
  }
  
  try {
    console.log('🔗 Attempting ScraperAPI search for:', query);
    const url = `https://api.scraperapi.com/search?api_key=${SCRAPERAPI_API_KEY}&query=${encodeURIComponent(query)}&format=json`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    console.log('📊 ScraperAPI response:', { status: res.status, dataKeys: Object.keys(data) });
    
    if (!res.ok) {
      console.error('❌ ScraperAPI HTTP error:', res.status, data);
      return [];
    }
    
    // Handle different response formats from ScraperAPI
    const results = data.results || data.organic_results || data.items || [];
    
    return results.map((item: any) => ({
      title: item.title || item.name || 'No title',
      snippet: item.snippet || item.description || '',
      url: item.url || item.link || '',
      source: 'scraperapi'
    }));
  } catch (err) {
    console.error('ScraperAPI error:', err);
    return [];
  }
}

function extractEntities(text: string, query: string): Array<{type: string; value: string; confidence: number}> {
  const entities: Array<{type: string; value: string; confidence: number}> = [];
  
  // Extract emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex) || [];
  emails.forEach(email => {
    entities.push({
      type: 'email',
      value: email,
      confidence: calculateIntelligentConfidence(email, 'email', query)
    });
  });

  // Extract phone numbers
  const phoneRegex = /\b\d{3}-\d{3}-\d{4}\b|\b\(\d{3}\)\s?\d{3}-\d{4}\b/g;
  const phones = text.match(phoneRegex) || [];
  phones.forEach(phone => {
    entities.push({
      type: 'phone',
      value: phone,
      confidence: calculateIntelligentConfidence(phone, 'phone', query)
    });
  });

  return entities;
}