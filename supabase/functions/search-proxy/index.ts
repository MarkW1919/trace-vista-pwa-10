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
    const body = await req.json();
    const { q: query, userId, sessionId } = body;

    console.log('🔍 Streaming search request:', { query, userId, sessionId });

    if (!query || !userId) {
      return new Response(JSON.stringify({ error: 'Missing query or userId' }), {
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
          fetchSerpAPI(query).catch(err => { console.warn('SerpAPI failed:', err); return []; }),
          fetchHunterAPI(query).catch(err => { console.warn('Hunter failed:', err); return []; }),
          fetchScraperAPI(query).catch(err => { console.warn('ScraperAPI failed:', err); return []; })
        ];

        Promise.allSettled(searchPromises).then(async (results) => {
          try {
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
                  if (enhanced.entities?.length && sessionId) {
                    const extractedEntities = enhanced.entities.map((entity: any) => ({
                      session_id: sessionId,
                      entity_type: entity.type,
                      entity_value: entity.value,
                      confidence_score: entity.confidence,
                      source_result_id: enhanced.id
                    }));
                    
                    const { error: entityError } = await supabase.from('extracted_entities').insert(extractedEntities);
                    if (entityError) {
                      console.error('Entity insert error:', entityError);
                    }
                  }

                  sendResult(enhanced);
                }
              }
            }

            // Close JSON structure
            controller.enqueue(encoder.encode(`\n], "sessionId": "${sessionId}", "totalResults": ${resultCount} }`));
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
  if (!SCRAPERAPI_API_KEY) return [];
  try {
    const res = await fetch(`https://api.scraperapi.com?api_key=${SCRAPERAPI_API_KEY}&url=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.results || [];
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