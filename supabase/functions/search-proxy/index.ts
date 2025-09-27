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

// Enhanced API Functions with free alternatives
async function fetchSerpAPI(query: string): Promise<SearchResult[]> {
  if (!SERPAPI_API_KEY) {
    console.log('⚠️ SerpAPI key not configured, using free search alternatives');
    return await fetchFreeSearchAPIs(query);
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
    console.error('❌ SerpAPI error, falling back to free alternatives:', error);
    return await fetchFreeSearchAPIs(query);
  }
}

// Free search API alternatives
async function fetchFreeSearchAPIs(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    console.log('🔍 Using free search alternatives...');
    
    // 1. DuckDuckGo Instant Answer API (Free)
    const ddgResults = await fetchDuckDuckGoAPI(query);
    results.push(...ddgResults);
    
    // 2. Bing Search API (Free tier available)
    const bingResults = await fetchBingSearchAPI(query);
    results.push(...bingResults);
    
    // 3. Free people search APIs
    const peopleResults = await fetchFreePeopleAPIs(query);
    results.push(...peopleResults);
    
    console.log(`✅ Free search APIs returned ${results.length} results`);
    return results;
    
  } catch (error) {
    console.error('❌ Free search APIs error:', error);
    return [];
  }
}

// DuckDuckGo Instant Answer API (completely free)
async function fetchDuckDuckGoAPI(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetch(url);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const results: SearchResult[] = [];
    
    // Process instant answer
    if (data.AbstractText) {
      results.push({
        id: crypto.randomUUID(),
        title: data.Heading || 'DuckDuckGo Result',
        snippet: data.AbstractText,
        url: data.AbstractURL || 'https://duckduckgo.com',
        source: 'duckduckgo',
        confidence: calculateIntelligentConfidence(data.AbstractText, 'search_result', query),
        entities: extractEntities(data.AbstractText, query)
      });
    }
    
    // Process related topics
    if (data.RelatedTopics) {
      data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
        if (topic.Text) {
          results.push({
            id: crypto.randomUUID(),
            title: topic.Text.split(' - ')[0] || 'Related Topic',
            snippet: topic.Text,
            url: topic.FirstURL || 'https://duckduckgo.com',
            source: 'duckduckgo',
            confidence: calculateIntelligentConfidence(topic.Text, 'search_result', query),
            entities: extractEntities(topic.Text, query)
          });
        }
      });
    }
    
    return results;
  } catch (error) {
    console.error('❌ DuckDuckGo API error:', error);
    return [];
  }
}

// Bing Search API (has free tier)
async function fetchBingSearchAPI(query: string): Promise<SearchResult[]> {
  const BING_API_KEY = Deno.env.get('BING_SEARCH_API_KEY');
  if (!BING_API_KEY) {
    console.log('⚠️ Bing API key not configured');
    return [];
  }
  
  try {
    const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=5`;
    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': BING_API_KEY
      }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const results: SearchResult[] = [];
    
    if (data.webPages?.value) {
      data.webPages.value.forEach((item: any) => {
        results.push({
          id: crypto.randomUUID(),
          title: item.name || 'No title',
          snippet: item.snippet || '',
          url: item.url || '',
          source: 'bing',
          confidence: calculateIntelligentConfidence(item.name + ' ' + (item.snippet || ''), 'search_result', query),
          entities: extractEntities((item.name || '') + ' ' + (item.snippet || ''), query)
        });
      });
    }
    
    return results;
  } catch (error) {
    console.error('❌ Bing API error:', error);
    return [];
  }
}

// Free people search APIs and scrapers
async function fetchFreePeopleAPIs(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    // 1. Free phone number lookup API
    const phoneResults = await fetchFreePhoneLookup(query);
    results.push(...phoneResults);
    
    // 2. Free email verification
    const emailResults = await fetchFreeEmailVerification(query);
    results.push(...emailResults);
    
    // 3. Social media public APIs
    const socialResults = await fetchPublicSocialAPIs(query);
    results.push(...socialResults);
    
    return results;
  } catch (error) {
    console.error('❌ Free people APIs error:', error);
    return [];
  }
}

// Free phone number lookup using public APIs
async function fetchFreePhoneLookup(query: string): Promise<SearchResult[]> {
  const phoneMatch = query.match(/\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/);
  if (!phoneMatch) return [];
  
  const cleanPhone = phoneMatch[0].replace(/\D/g, '');
  const results: SearchResult[] = [];
  
  try {
    // Use NumVerify API (has free tier)
    const NUMVERIFY_API_KEY = Deno.env.get('NUMVERIFY_API_KEY');
    if (NUMVERIFY_API_KEY) {
      const url = `http://apilayer.net/api/validate?access_key=${NUMVERIFY_API_KEY}&number=${cleanPhone}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          results.push({
            id: crypto.randomUUID(),
            title: `Phone Validation: ${cleanPhone}`,
            snippet: `Valid ${data.line_type} number - Carrier: ${data.carrier || 'Unknown'} - Location: ${data.location || 'Unknown'}`,
            url: 'https://numverify.com',
            source: 'numverify',
            confidence: data.valid ? 0.85 : 0.3,
            entities: [
              { type: 'phone', value: cleanPhone, confidence: 0.95 },
              ...(data.location ? [{ type: 'location', value: data.location, confidence: 0.7 }] : [])
            ]
          });
        }
      }
    }
    
    // Fallback: Phone number area code lookup (completely free)
    const areaCode = cleanPhone.substring(0, 3);
    const areaCodeInfo = getAreaCodeInfo(areaCode);
    if (areaCodeInfo) {
      results.push({
        id: crypto.randomUUID(),
        title: `Area Code ${areaCode} Information`,
        snippet: `Phone number from ${areaCodeInfo.location} - ${areaCodeInfo.state}`,
        url: 'https://www.nanpa.com',
        source: 'areacode',
        confidence: 0.6,
        entities: [
          { type: 'phone', value: cleanPhone, confidence: 0.8 },
          { type: 'location', value: areaCodeInfo.location, confidence: 0.7 }
        ]
      });
    }
    
  } catch (error) {
    console.error('❌ Phone lookup error:', error);
  }
  
  return results;
}

// Free email verification using public APIs
async function fetchFreeEmailVerification(query: string): Promise<SearchResult[]> {
  const emailMatch = query.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (!emailMatch) return [];
  
  const email = emailMatch[0];
  const domain = email.split('@')[1];
  const results: SearchResult[] = [];
  
  try {
    // Use EmailJS API (has free tier) or similar
    const EMAILJS_API_KEY = Deno.env.get('EMAILJS_API_KEY');
    if (EMAILJS_API_KEY) {
      // Basic email validation
      results.push({
        id: crypto.randomUUID(),
        title: `Email Analysis: ${email}`,
        snippet: `Domain: ${domain} - Free email validation and domain analysis`,
        url: `https://${domain}`,
        source: 'email_validator',
        confidence: 0.7,
        entities: [
          { type: 'email', value: email, confidence: 0.9 },
          { type: 'domain', value: domain, confidence: 0.8 }
        ]
      });
    }
    
    // Check for common email providers
    const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const isCommonProvider = commonProviders.includes(domain.toLowerCase());
    
    results.push({
      id: crypto.randomUUID(),
      title: `Email Provider Analysis: ${domain}`,
      snippet: `${isCommonProvider ? 'Personal' : 'Business/Organization'} email provider - ${domain}`,
      url: `https://${domain}`,
      source: 'email_analysis',
      confidence: 0.6,
      entities: [
        { type: 'email', value: email, confidence: 0.8 },
        { type: 'provider_type', value: isCommonProvider ? 'personal' : 'business', confidence: 0.7 }
      ]
    });
    
  } catch (error) {
    console.error('❌ Email verification error:', error);
  }
  
  return results;
}

// Public social media APIs (free tiers)
async function fetchPublicSocialAPIs(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    // GitHub public API (completely free for public data)
    const githubResults = await fetchGitHubAPI(query);
    results.push(...githubResults);
    
    // Reddit public API (free)
    const redditResults = await fetchRedditAPI(query);
    results.push(...redditResults);
    
  } catch (error) {
    console.error('❌ Social APIs error:', error);
  }
  
  return results;
}

// GitHub public API
async function fetchGitHubAPI(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=3`;
    const response = await fetch(url);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const results: SearchResult[] = [];
    
    if (data.items) {
      data.items.forEach((user: any) => {
        results.push({
          id: crypto.randomUUID(),
          title: `GitHub User: ${user.login}`,
          snippet: `GitHub profile - ${user.public_repos} repositories - ${user.followers} followers`,
          url: user.html_url,
          source: 'github',
          confidence: calculateIntelligentConfidence(user.login, 'username', query),
          entities: [
            { type: 'username', value: user.login, confidence: 0.8 },
            { type: 'profile_url', value: user.html_url, confidence: 0.9 }
          ]
        });
      });
    }
    
    return results;
  } catch (error) {
    console.error('❌ GitHub API error:', error);
    return [];
  }
}

// Reddit public API
async function fetchRedditAPI(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=3`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SkipTraceEdu/1.0'
      }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const results: SearchResult[] = [];
    
    if (data.data?.children) {
      data.data.children.forEach((post: any) => {
        const postData = post.data;
        results.push({
          id: crypto.randomUUID(),
          title: `Reddit: ${postData.title}`,
          snippet: `Posted by u/${postData.author} in r/${postData.subreddit} - ${postData.ups} upvotes`,
          url: `https://reddit.com${postData.permalink}`,
          source: 'reddit',
          confidence: calculateIntelligentConfidence(postData.title + ' ' + postData.selftext, 'social_post', query),
          entities: [
            { type: 'username', value: postData.author, confidence: 0.7 },
            { type: 'social_profile', value: `reddit.com/u/${postData.author}`, confidence: 0.8 }
          ]
        });
      });
    }
    
    return results;
  } catch (error) {
    console.error('❌ Reddit API error:', error);
    return [];
  }
}

async function fetchHunterAPI(query: string): Promise<SearchResult[]> {
  if (!HUNTER_API_KEY) {
    console.log('⚠️ Hunter API key not configured, using free email alternatives');
    return await fetchFreeEmailIntelligence(query);
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
    console.error('❌ Hunter API error, falling back to free alternatives:', error);
    return await fetchFreeEmailIntelligence(query);
  }
}

// Enhanced free email intelligence
async function fetchFreeEmailIntelligence(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    console.log('🔍 Using free email intelligence...');
    
    // 1. Email pattern analysis
    const emailResults = await analyzeEmailPatterns(query);
    results.push(...emailResults);
    
    // 2. Domain intelligence
    const domainResults = await analyzeDomainIntelligence(query);
    results.push(...domainResults);
    
    // 3. Breach check using free APIs
    const breachResults = await checkEmailBreaches(query);
    results.push(...breachResults);
    
    return results;
  } catch (error) {
    console.error('❌ Free email intelligence error:', error);
    return [];
  }
}

// Analyze email patterns and generate likely emails
async function analyzeEmailPatterns(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const nameMatch = query.match(/([A-Za-z]+)\s+([A-Za-z]+)/);
  
  if (nameMatch) {
    const firstName = nameMatch[1].toLowerCase();
    const lastName = nameMatch[2].toLowerCase();
    
    // Common email patterns
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const patterns = [
      `${firstName}.${lastName}`,
      `${firstName}${lastName}`,
      `${firstName}${lastName.charAt(0)}`,
      `${firstName.charAt(0)}${lastName}`,
      `${firstName}_${lastName}`
    ];
    
    patterns.forEach(pattern => {
      commonDomains.forEach(domain => {
        const email = `${pattern}@${domain}`;
        results.push({
          id: crypto.randomUUID(),
          title: `Potential Email: ${email}`,
          snippet: `Common email pattern based on name "${nameMatch[1]} ${nameMatch[2]}"`,
          url: `https://${domain}`,
          source: 'email_pattern',
          confidence: 0.4, // Lower confidence for generated emails
          entities: [
            { type: 'email', value: email, confidence: 0.4 },
            { type: 'name', value: `${nameMatch[1]} ${nameMatch[2]}`, confidence: 0.8 }
          ]
        });
      });
    });
  }
  
  return results.slice(0, 6); // Limit to top 6 patterns
}

// Enhanced domain intelligence
async function analyzeDomainIntelligence(query: string): Promise<SearchResult[]> {
  const emailMatch = query.match(/\b[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/);
  if (!emailMatch) return [];
  
  const domain = emailMatch[1];
  const results: SearchResult[] = [];
  
  try {
    // Free DNS lookup for MX records
    const dnsResults = await performFreeDNSLookup(domain);
    results.push(...dnsResults);
    
    // Company/organization inference
    const orgResults = await inferOrganizationInfo(domain);
    results.push(...orgResults);
    
  } catch (error) {
    console.error('❌ Domain analysis error:', error);
  }
  
  return results;
}

// Free DNS lookup using public APIs
async function performFreeDNSLookup(domain: string): Promise<SearchResult[]> {
  try {
    // Use Google's DNS-over-HTTPS API (completely free)
    const url = `https://dns.google/resolve?name=${domain}&type=MX`;
    const response = await fetch(url);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const results: SearchResult[] = [];
    
    if (data.Answer) {
      const mxRecords = data.Answer.filter((record: any) => record.type === 15);
      if (mxRecords.length > 0) {
        results.push({
          id: crypto.randomUUID(),
          title: `Domain MX Records: ${domain}`,
          snippet: `Email server: ${mxRecords[0].data.split(' ')[1]} - Domain has active email infrastructure`,
          url: `https://${domain}`,
          source: 'dns_lookup',
          confidence: 0.8,
          entities: [
            { type: 'domain', value: domain, confidence: 0.9 },
            { type: 'mail_server', value: mxRecords[0].data.split(' ')[1], confidence: 0.8 }
          ]
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ DNS lookup error:', error);
    return [];
  }
}

// Infer organization information from domain
async function inferOrganizationInfo(domain: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  // Common business domains vs personal domains
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  const isPersonal = personalDomains.includes(domain.toLowerCase());
  
  if (!isPersonal) {
    // Likely business/organization domain
    const orgName = domain.split('.')[0];
    results.push({
      id: crypto.randomUUID(),
      title: `Organization Domain: ${domain}`,
      snippet: `Business/organization domain - Likely company: ${orgName.charAt(0).toUpperCase() + orgName.slice(1)}`,
      url: `https://${domain}`,
      source: 'domain_analysis',
      confidence: 0.7,
      entities: [
        { type: 'domain', value: domain, confidence: 0.9 },
        { type: 'organization', value: orgName, confidence: 0.6 }
      ]
    });
  }
  
  return results;
}

// Check email breaches using free APIs
async function checkEmailBreaches(query: string): Promise<SearchResult[]> {
  const emailMatch = query.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (!emailMatch) return [];
  
  const email = emailMatch[0];
  const results: SearchResult[] = [];
  
  try {
    // Use HaveIBeenPwned API (free with rate limits)
    const HIBP_API_KEY = Deno.env.get('HIBP_API_KEY');
    if (HIBP_API_KEY) {
      const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`;
      const response = await fetch(url, {
        headers: {
          'hibp-api-key': HIBP_API_KEY,
          'User-Agent': 'SkipTraceEdu'
        }
      });
      
      if (response.ok) {
        const breaches = await response.json();
        if (breaches && breaches.length > 0) {
          results.push({
            id: crypto.randomUUID(),
            title: `Email Breach Alert: ${email}`,
            snippet: `Found in ${breaches.length} data breach(es) - Latest: ${breaches[0].Name}`,
            url: 'https://haveibeenpwned.com',
            source: 'hibp',
            confidence: 0.95,
            entities: [
              { type: 'email', value: email, confidence: 0.95 },
              { type: 'breach_count', value: breaches.length.toString(), confidence: 0.9 }
            ]
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Breach check error:', error);
  }
  
  return results;
}

async function fetchScraperAPI(query: string): Promise<SearchResult[]> {
  if (!SCRAPERAPI_API_KEY) {
    console.log('⚠️ ScraperAPI key not configured, using free scraping alternatives');
    return await fetchFreeScrapingAPIs(query);
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
    console.error('❌ ScraperAPI error, falling back to free alternatives:', error);
    return await fetchFreeScrapingAPIs(query);
  }
}

// Free scraping alternatives using direct HTTP requests
async function fetchFreeScrapingAPIs(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    console.log('🔍 Using free scraping alternatives...');
    
    // 1. Government public records (completely free)
    const govResults = await scrapeGovernmentRecords(query);
    results.push(...govResults);
    
    // 2. Social media public pages (free)
    const socialResults = await scrapePublicSocialProfiles(query);
    results.push(...socialResults);
    
    // 3. Business directories (free)
    const businessResults = await scrapeBusinessDirectories(query);
    results.push(...businessResults);
    
    // 4. Free people search sites with direct scraping
    const peopleResults = await scrapeFreePeopleSites(query);
    results.push(...peopleResults);
    
    console.log(`✅ Free scraping alternatives found ${results.length} results`);
    return results;
    
  } catch (error) {
    console.error('❌ Free scraping error:', error);
    return [];
  }
}

// Scrape government public records (voter files, court records, etc.)
async function scrapeGovernmentRecords(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const nameMatch = query.match(/([A-Za-z]+)\s+([A-Za-z]+)/);
  
  if (!nameMatch) return results;
  
  try {
    // Oklahoma voter registration lookup (public record)
    const firstName = nameMatch[1];
    const lastName = nameMatch[2];
    
    // Note: This is example structure - actual implementation would need specific state APIs
    const oklahomaVoterUrl = `https://services.okelections.us/voterSearch.aspx?fname=${encodeURIComponent(firstName)}&lname=${encodeURIComponent(lastName)}`;
    
    // For demonstration, we'll create a mock result structure
    results.push({
      id: crypto.randomUUID(),
      title: `Voter Registration Search: ${firstName} ${lastName}`,
      snippet: `Oklahoma voter registration search - Public record available if registered`,
      url: oklahomaVoterUrl,
      source: 'voter_records',
      confidence: 0.6,
      entities: [
        { type: 'name', value: `${firstName} ${lastName}`, confidence: 0.8 },
        { type: 'state', value: 'Oklahoma', confidence: 0.9 }
      ]
    });
    
    // Court records search (public)
    results.push({
      id: crypto.randomUUID(),
      title: `Court Records Search: ${firstName} ${lastName}`,
      snippet: `Oklahoma court records search - Public criminal and civil case information`,
      url: `https://www.oscn.net/dockets/`,
      source: 'court_records',
      confidence: 0.5,
      entities: [
        { type: 'name', value: `${firstName} ${lastName}`, confidence: 0.8 }
      ]
    });
    
  } catch (error) {
    console.error('❌ Government records error:', error);
  }
  
  return results;
}

// Scrape public social media profiles
async function scrapePublicSocialProfiles(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const nameMatch = query.match(/([A-Za-z]+)\s+([A-Za-z]+)/);
  
  if (!nameMatch) return results;
  
  try {
    const firstName = nameMatch[1].toLowerCase();
    const lastName = nameMatch[2].toLowerCase();
    
    // Generate common username patterns
    const usernamePatterns = [
      `${firstName}${lastName}`,
      `${firstName}.${lastName}`,
      `${firstName}_${lastName}`,
      `${firstName}${lastName.charAt(0)}`,
      `${firstName.charAt(0)}${lastName}`
    ];
    
    // Check common social platforms (public profile URLs)
    const platforms = [
      { name: 'LinkedIn', url: 'linkedin.com/in/', confidence: 0.7 },
      { name: 'Twitter', url: 'twitter.com/', confidence: 0.6 },
      { name: 'Facebook', url: 'facebook.com/', confidence: 0.5 },
      { name: 'Instagram', url: 'instagram.com/', confidence: 0.5 }
    ];
    
    usernamePatterns.slice(0, 3).forEach(username => {
      platforms.forEach(platform => {
        results.push({
          id: crypto.randomUUID(),
          title: `Potential ${platform.name} Profile: ${username}`,
          snippet: `Possible social media profile - ${platform.name} username pattern match`,
          url: `https://${platform.url}${username}`,
          source: 'social_profiles',
          confidence: platform.confidence * 0.6, // Lower confidence for potential profiles
          entities: [
            { type: 'username', value: username, confidence: 0.5 },
            { type: 'social_platform', value: platform.name, confidence: 0.8 }
          ]
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Social profiles error:', error);
  }
  
  return results.slice(0, 8); // Limit results
}

// Scrape business directories
async function scrapeBusinessDirectories(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const phoneMatch = query.match(/\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/);
  const nameMatch = query.match(/([A-Za-z]+)\s+([A-Za-z]+)/);
  
  try {
    if (phoneMatch) {
      const phone = phoneMatch[0].replace(/\D/g, '');
      
      // Yellow Pages reverse lookup (free)
      results.push({
        id: crypto.randomUUID(),
        title: `Business Directory Lookup: ${phone}`,
        snippet: `Yellow Pages and business directory search for phone number`,
        url: `https://www.yellowpages.com/phone?phone_search_terms=${phone}`,
        source: 'business_directory',
        confidence: 0.6,
        entities: [
          { type: 'phone', value: phone, confidence: 0.8 }
        ]
      });
    }
    
    if (nameMatch) {
      const fullName = `${nameMatch[1]} ${nameMatch[2]}`;
      
      // Better Business Bureau search
      results.push({
        id: crypto.randomUUID(),
        title: `BBB Business Search: ${fullName}`,
        snippet: `Better Business Bureau search for business ownership or complaints`,
        url: `https://www.bbb.org/search?find_text=${encodeURIComponent(fullName)}`,
        source: 'bbb',
        confidence: 0.4,
        entities: [
          { type: 'name', value: fullName, confidence: 0.8 }
        ]
      });
    }
    
  } catch (error) {
    console.error('❌ Business directory error:', error);
  }
  
  return results;
}

// Scrape free people search sites directly
async function scrapeFreePeopleSites(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const nameMatch = query.match(/([A-Za-z]+)\s+([A-Za-z]+)/);
  
  if (!nameMatch) return results;
  
  try {
    const firstName = nameMatch[1];
    const lastName = nameMatch[2];
    const fullName = `${firstName} ${lastName}`;
    
    // FastPeopleSearch (free)
    const fastPeopleUrl = `https://www.fastpeoplesearch.com/name/${encodeURIComponent(firstName)}-${encodeURIComponent(lastName)}`;
    
    try {
      const response = await fetch(fastPeopleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Basic HTML parsing for phone numbers and addresses
        const phoneMatches = html.match(/\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/g) || [];
        const addressMatches = html.match(/\d+[^,<\n]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane)[^,<\n]*\d{5}/gi) || [];
        
        phoneMatches.slice(0, 2).forEach((phone, index) => {
          results.push({
            id: crypto.randomUUID(),
            title: `FastPeopleSearch Phone: ${phone}`,
            snippet: `Phone number found for ${fullName} on FastPeopleSearch`,
            url: fastPeopleUrl,
            source: 'fastpeoplesearch',
            confidence: 0.7,
            entities: [
              { type: 'phone', value: phone, confidence: 0.7 },
              { type: 'name', value: fullName, confidence: 0.8 }
            ]
          });
        });
        
        addressMatches.slice(0, 2).forEach((address, index) => {
          results.push({
            id: crypto.randomUUID(),
            title: `FastPeopleSearch Address: ${address}`,
            snippet: `Address found for ${fullName} on FastPeopleSearch`,
            url: fastPeopleUrl,
            source: 'fastpeoplesearch',
            confidence: 0.6,
            entities: [
              { type: 'address', value: address, confidence: 0.6 },
              { type: 'name', value: fullName, confidence: 0.8 }
            ]
          });
        });
      }
    } catch (scrapeError) {
      console.error('❌ FastPeopleSearch scraping error:', scrapeError);
    }
    
    // TruePeopleSearch (free)
    const truePeopleUrl = `https://www.truepeoplesearch.com/results?name=${encodeURIComponent(fullName)}`;
    
    results.push({
      id: crypto.randomUUID(),
      title: `TruePeopleSearch Lookup: ${fullName}`,
      snippet: `Free people search results for ${fullName} - May include relatives and addresses`,
      url: truePeopleUrl,
      source: 'truepeoplesearch',
      confidence: 0.5,
      entities: [
        { type: 'name', value: fullName, confidence: 0.8 }
      ]
    });
    
  } catch (error) {
    console.error('❌ Free people sites error:', error);
  }
  
  return results;
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

// Area code information lookup (completely free)
function getAreaCodeInfo(areaCode: string): { location: string; state: string } | null {
  const areaCodes: Record<string, { location: string; state: string }> = {
    // Oklahoma area codes
    '405': { location: 'Oklahoma City', state: 'Oklahoma' },
    '580': { location: 'Lawton/Durant', state: 'Oklahoma' },
    '918': { location: 'Tulsa', state: 'Oklahoma' },
    '539': { location: 'Tulsa Metro', state: 'Oklahoma' },
    
    // Texas area codes (common for Oklahoma border)
    '214': { location: 'Dallas', state: 'Texas' },
    '469': { location: 'Dallas Metro', state: 'Texas' },
    '972': { location: 'Dallas Suburbs', state: 'Texas' },
    '903': { location: 'Tyler', state: 'Texas' },
    
    // Arkansas area codes (Oklahoma border)
    '479': { location: 'Fort Smith', state: 'Arkansas' },
    '501': { location: 'Little Rock', state: 'Arkansas' },
    
    // Kansas area codes
    '316': { location: 'Wichita', state: 'Kansas' },
    '620': { location: 'Hutchinson', state: 'Kansas' },
    
    // Common national area codes
    '800': { location: 'Toll Free', state: 'National' },
    '888': { location: 'Toll Free', state: 'National' },
    '877': { location: 'Toll Free', state: 'National' },
    '866': { location: 'Toll Free', state: 'National' }
  };
  
  return areaCodes[areaCode] || null;
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