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
    
    // Generate people search URLs for various platforms
    const searchUrls = generatePeopleSearchUrls(query);
    const results: SearchResult[] = [];
    
    // Try scraping multiple people search sites
    for (const { platform, url: searchUrl } of searchUrls.slice(0, 2)) { // Limit to 2 sites to reduce costs
      try {
        console.log(`🌐 Scraping ${platform}: ${searchUrl}`);
        
        const scraperUrl = `https://api.scraperapi.com?api_key=${SCRAPERAPI_API_KEY}&url=${encodeURIComponent(searchUrl)}&render=true&country_code=us`;
        
        const response = await fetch(scraperUrl);
        if (!response.ok) {
          console.log(`⚠️ ${platform} returned ${response.status}`);
          continue;
        }
        
        const html = await response.text();
        console.log(`📄 ${platform} HTML length:`, html.length);
        
        // Extract results based on platform
        const platformResults = extractPeopleSearchResults(html, platform, query, searchUrl);
        results.push(...platformResults);
        
        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (platformError) {
        console.error(`❌ Error scraping ${platform}:`, platformError);
        continue;
      }
    }
    
    console.log(`✅ ScraperAPI extracted ${results.length} results`);
    return results;
    
  } catch (error) {
    console.error('❌ ScraperAPI error:', error);
    return [];
  }
}

// Generate search URLs for people search platforms
function generatePeopleSearchUrls(query: string): { platform: string; url: string }[] {
  // Extract potential name, location, phone, email from query
  const emailMatch = query.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  const phoneMatch = query.match(/\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/);
  const ageMatch = query.match(/age\s*(\d{1,3})/i);
  const locationMatch = query.match(/\b([A-Z][a-z]+)\s+([A-Z]{2})\b/);
  
  // Extract likely name (first two capitalized words)
  const words = query.split(/\s+/).filter(w => /^[A-Z][a-z]+$/.test(w));
  const name = words.slice(0, 2).join(' ');
  
  const urls = [];
  
  if (name) {
    // WhitePages search
    const wpQuery = encodeURIComponent(name + (locationMatch ? ` ${locationMatch[1]} ${locationMatch[2]}` : ''));
    urls.push({
      platform: 'whitepages',
      url: `https://www.whitepages.com/name/${wpQuery}`
    });
    
    // Spokeo search  
    const spokeoQuery = encodeURIComponent(name + (locationMatch ? ` ${locationMatch[1]} ${locationMatch[2]}` : ''));
    urls.push({
      platform: 'spokeo',
      url: `https://www.spokeo.com/${spokeoQuery}`
    });
    
    // TruePeopleSearch
    const tpsQuery = encodeURIComponent(name);
    urls.push({
      platform: 'truepeoplesearch',
      url: `https://www.truepeoplesearch.com/results?name=${tpsQuery}${locationMatch ? `&citystatezip=${encodeURIComponent(locationMatch[1] + ' ' + locationMatch[2])}` : ''}`
    });
  }
  
  if (phoneMatch) {
    // Phone number searches
    const cleanPhone = phoneMatch[0].replace(/\D/g, '');
    urls.push({
      platform: 'truecaller',
      url: `https://www.truecaller.com/search/us/${cleanPhone}`
    });
  }
  
  return urls;
}

// Extract results from people search site HTML
function extractPeopleSearchResults(html: string, platform: string, query: string, originalUrl: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  try {
    switch (platform) {
      case 'whitepages':
        return extractWhitePagesResults(html, query, originalUrl);
      case 'spokeo':
        return extractSpokeoResults(html, query, originalUrl);
      case 'truepeoplesearch':
        return extractTruePeopleSearchResults(html, query, originalUrl);
      case 'truecaller':
        return extractTrueCallerResults(html, query, originalUrl);
      default:
        return extractGenericResults(html, query, originalUrl, platform);
    }
  } catch (error) {
    console.error(`❌ Error extracting results from ${platform}:`, error);
    return [];
  }
}

function extractWhitePagesResults(html: string, query: string, url: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  // Look for person listings on WhitePages
  const personMatches = html.match(/<div[^>]*class="[^"]*person[^"]*"[^>]*>[\s\S]*?<\/div>/gi) || [];
  
  personMatches.slice(0, 3).forEach((match, index) => {
    const nameMatch = match.match(/<h[^>]*>([^<]+)<\/h[^>]*>/i);
    const ageMatch = match.match(/age[^\d]*(\d{1,3})/i);
    const locationMatch = match.match(/([A-Z][a-z]+,?\s*[A-Z]{2})/);
    const phoneMatch = match.match(/\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/);
    
    if (nameMatch) {
      const entities: EntityResult[] = [];
      const name = nameMatch[1].trim();
      
      entities.push({ type: 'name', value: name, confidence: 0.85 });
      
      if (ageMatch) entities.push({ type: 'age', value: ageMatch[1], confidence: 0.8 });
      if (locationMatch) entities.push({ type: 'address', value: locationMatch[1], confidence: 0.7 });
      if (phoneMatch) entities.push({ type: 'phone', value: phoneMatch[0], confidence: 0.8 });
      
      results.push({
        id: crypto.randomUUID(),
        title: `${name}${ageMatch ? `, Age ${ageMatch[1]}` : ''}${locationMatch ? ` - ${locationMatch[1]}` : ''}`,
        snippet: `Person found on WhitePages${phoneMatch ? ` - Phone: ${phoneMatch[0]}` : ''}`,
        url: url,
        source: 'scraperapi',
        confidence: calculateIntelligentConfidence(name, 'person', query),
        entities: entities
      });
    }
  });
  
  return results;
}

function extractSpokeoResults(html: string, query: string, url: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  // Look for Spokeo person cards
  const cardMatches = html.match(/<div[^>]*class="[^"]*card[^"]*"[^>]*>[\s\S]*?<\/div>/gi) || [];
  
  cardMatches.slice(0, 3).forEach((match) => {
    const nameMatch = match.match(/data-name="([^"]+)"/i) || match.match(/<h[^>]*>([^<]+)<\/h[^>]*>/i);
    const ageMatch = match.match(/(\d{1,3})\s*years?\s*old/i);
    const locationMatch = match.match(/([A-Z][a-z]+,?\s*[A-Z]{2})/);
    
    if (nameMatch) {
      const entities: EntityResult[] = [];
      const name = nameMatch[1].trim();
      
      entities.push({ type: 'name', value: name, confidence: 0.82 });
      if (ageMatch) entities.push({ type: 'age', value: ageMatch[1], confidence: 0.75 });
      if (locationMatch) entities.push({ type: 'address', value: locationMatch[1], confidence: 0.65 });
      
      results.push({
        id: crypto.randomUUID(),
        title: `${name}${ageMatch ? `, ${ageMatch[1]} years old` : ''}${locationMatch ? ` in ${locationMatch[1]}` : ''}`,
        snippet: `Profile found on Spokeo with potential contact information`,
        url: url,
        source: 'scraperapi',
        confidence: calculateIntelligentConfidence(name, 'person', query),
        entities: entities
      });
    }
  });
  
  return results;
}

function extractTruePeopleSearchResults(html: string, query: string, url: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  // Look for person entries
  const entryMatches = html.match(/<div[^>]*data-link-to-more[^>]*>[\s\S]*?<\/div>/gi) || [];
  
  entryMatches.slice(0, 3).forEach((match) => {
    const nameMatch = match.match(/<h\d[^>]*>([^<]+)<\/h\d>/i);
    const ageMatch = match.match(/age[^\d]*(\d{1,3})/i);
    const phoneMatch = match.match(/\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/);
    const addressMatch = match.match(/\d+[^,]+,[^,]+,\s*[A-Z]{2}/);
    
    if (nameMatch) {
      const entities: EntityResult[] = [];
      const name = nameMatch[1].trim();
      
      entities.push({ type: 'name', value: name, confidence: 0.88 });
      if (ageMatch) entities.push({ type: 'age', value: ageMatch[1], confidence: 0.85 });
      if (phoneMatch) entities.push({ type: 'phone', value: phoneMatch[0], confidence: 0.9 });
      if (addressMatch) entities.push({ type: 'address', value: addressMatch[0], confidence: 0.8 });
      
      results.push({
        id: crypto.randomUUID(),
        title: `${name}${ageMatch ? `, Age ${ageMatch[1]}` : ''}`,
        snippet: `TruePeopleSearch record${phoneMatch ? ` - ${phoneMatch[0]}` : ''}${addressMatch ? ` - ${addressMatch[0]}` : ''}`,
        url: url,
        source: 'scraperapi',
        confidence: calculateIntelligentConfidence(name, 'person', query),
        entities: entities
      });
    }
  });
  
  return results;
}

function extractTrueCallerResults(html: string, query: string, url: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  // Look for caller ID info
  const nameMatch = html.match(/<h[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/h[^>]*>/i);
  const phoneMatch = query.match(/\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/);
  const locationMatch = html.match(/location[^>]*>([^<]+)</i);
  
  if (nameMatch && phoneMatch) {
    const entities: EntityResult[] = [
      { type: 'name', value: nameMatch[1].trim(), confidence: 0.8 },
      { type: 'phone', value: phoneMatch[0], confidence: 0.95 }
    ];
    
    if (locationMatch) {
      entities.push({ type: 'address', value: locationMatch[1].trim(), confidence: 0.7 });
    }
    
    results.push({
      id: crypto.randomUUID(),
      title: `${nameMatch[1].trim()} - ${phoneMatch[0]}`,
      snippet: `Phone number owner identified on TrueCaller${locationMatch ? ` - ${locationMatch[1]}` : ''}`,
      url: url,
      source: 'scraperapi',
      confidence: 0.85,
      entities: entities
    });
  }
  
  return results;
}

function extractGenericResults(html: string, query: string, url: string, platform: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  // Generic extraction - look for names, phones, addresses in any HTML
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const entities = extractEntities(text, query);
  
  if (entities.length > 0) {
    // Group entities by type
    const names = entities.filter(e => e.type === 'name');
    const phones = entities.filter(e => e.type === 'phone');
    const addresses = entities.filter(e => e.type === 'address');
    
    if (names.length > 0) {
      const topName = names[0];
      const snippet = `Information found on ${platform}${phones.length > 0 ? ` - Phone: ${phones[0].value}` : ''}${addresses.length > 0 ? ` - ${addresses[0].value}` : ''}`;
      
      results.push({
        id: crypto.randomUUID(),
        title: `${topName.value} - ${platform} Record`,
        snippet: snippet,
        url: url,
        source: 'scraperapi',
        confidence: calculateIntelligentConfidence(topName.value, 'person', query),
        entities: entities.slice(0, 5) // Limit entities
      });
    }
  }
  
  return results;
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