/**
 * ScraperAPI helper functions for the search proxy
 */

export interface ScrapingConfig {
  mode: 'light' | 'standard' | 'deep' | 'stealth';
  renderJs: boolean;
  premium: boolean;
  country?: string;
}

export interface ScrapingResult {
  success: boolean;
  html?: string;
  cost: number;
  statusCode: number;
  error?: string;
}

/**
 * Generate people search URLs for ScraperAPI
 */
export function generatePeopleSearchUrls(searchParams: any): { platform: string; url: string }[] {
  const { name, city, state, phone, email } = searchParams;
  const encodedName = encodeURIComponent(name);
  const urls: { platform: string; url: string }[] = [];

  // WhitePages
  if (city && state) {
    const location = `${city}-${state}`;
    urls.push({
      platform: 'whitepages',
      url: `https://www.whitepages.com/name/${encodedName}/${encodeURIComponent(location)}`
    });
  }

  // Spokeo
  urls.push({
    platform: 'spokeo',
    url: `https://www.spokeo.com/${encodedName}`
  });

  // TruePeopleSearch
  if (city && state) {
    urls.push({
      platform: 'truepeoplesearch',
      url: `https://www.truepeoplesearch.com/results?name=${encodedName}&citystatezip=${encodeURIComponent(city + ' ' + state)}`
    });
  }

  // FastPeopleSearch
  urls.push({
    platform: 'fastpeoplesearch',
    url: `https://www.fastpeoplesearch.com/${encodedName}`
  });

  return urls;
}

/**
 * Perform ScraperAPI request with platform-specific configuration
 */
export async function performScraperAPISearch(
  url: string, 
  platform: string, 
  apiKey: string
): Promise<ScrapingResult> {
  try {
    const config = getPlatformConfig(platform);
    const params = new URLSearchParams({
      api_key: apiKey,
      url: url,
      render: config.renderJs.toString(),
      format: 'html',
      ...(config.premium && { premium: 'true' }),
      ...(config.country && { country_code: config.country })
    });

    // Add mode-specific parameters
    if (config.mode === 'stealth') {
      params.append('residential', 'true');
      params.append('keep_headers', 'true');
    } else if (config.mode === 'deep') {
      params.append('premium', 'true');
      params.append('keep_headers', 'true');
    }

    const response = await fetch(`https://api.scraperapi.com/?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`ScraperAPI request failed: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const cost = getCreditCost(config.mode) * 0.001; // Convert credits to approximate USD

    return {
      success: true,
      html,
      cost,
      statusCode: response.status
    };

  } catch (error) {
    return {
      success: false,
      cost: 0,
      statusCode: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get platform-specific scraping configuration
 */
function getPlatformConfig(platform: string): ScrapingConfig {
  const configs: Record<string, ScrapingConfig> = {
    whitepages: {
      mode: 'stealth',
      renderJs: true,
      premium: true,
      country: 'US'
    },
    spokeo: {
      mode: 'deep',
      renderJs: true,
      premium: true
    },
    truepeoplesearch: {
      mode: 'standard',
      renderJs: true,
      premium: false
    },
    fastpeoplesearch: {
      mode: 'light',
      renderJs: false,
      premium: false
    }
  };

  return configs[platform] || {
    mode: 'standard',
    renderJs: true,
    premium: false
  };
}

/**
 * Get credit cost for different modes
 */
function getCreditCost(mode: string): number {
  const costs = {
    light: 1,
    standard: 10,
    deep: 25,
    stealth: 50
  };
  
  return costs[mode as keyof typeof costs] || 10;
}

/**
 * Extract entities from scraped HTML content
 */
export function extractEntitiesFromScrapedContent(
  html: string, 
  platform: string, 
  searchParams: any
): any[] {
  const results: any[] = [];
  
  try {
    // Platform-specific extraction patterns
    const extractors = {
      whitepages: extractFromWhitePages,
      spokeo: extractFromSpokeo,
      truepeoplesearch: extractFromTruePeopleSearch,
      fastpeoplesearch: extractFromFastPeopleSearch
    };

    const extractor = extractors[platform as keyof typeof extractors];
    if (extractor) {
      return extractor(html, searchParams);
    }

    // Generic extraction fallback
    return extractGenericData(html, platform, searchParams);

  } catch (error) {
    console.error(`Error extracting data from ${platform}:`, error);
    return [];
  }
}

/**
 * WhitePages specific data extraction
 */
function extractFromWhitePages(html: string, searchParams: any): any[] {
  const results: any[] = [];
  
  // Extract phone numbers
  const phoneRegex = /\(\d{3}\)\s*\d{3}-\d{4}/g;
  const phones = html.match(phoneRegex) || [];
  
  phones.forEach((phone, index) => {
    results.push({
      id: `whitepages-phone-${Date.now()}-${index}`,
      type: 'phone',
      value: phone,
      title: `Phone from WhitePages: ${phone}`,
      snippet: `Phone number found on WhitePages profile. High accuracy expected.`,
      url: 'https://www.whitepages.com',
      source: 'WhitePages (ScraperAPI)',
      confidence: 85,
      relevanceScore: 75,
      timestamp: new Date(),
      query: `ScraperAPI: ${searchParams.name}`,
      extractedEntities: [{
        type: 'phone',
        value: phone,
        confidence: 85
      }]
    });
  });

  // Extract addresses
  const addressRegex = /\d+\s+[A-Za-z\s]+(?:St|Ave|Rd|Dr|Ln|Blvd|Ct|Way)[A-Za-z\s,]*\d{5}/g;
  const addresses = html.match(addressRegex) || [];
  
  addresses.forEach((address, index) => {
    results.push({
      id: `whitepages-address-${Date.now()}-${index}`,
      type: 'address',
      value: address,
      title: `Address from WhitePages: ${address}`,
      snippet: `Address found on WhitePages profile. Property records may be available.`,
      url: 'https://www.whitepages.com',
      source: 'WhitePages (ScraperAPI)',
      confidence: 80,
      relevanceScore: 70,
      timestamp: new Date(),
      query: `ScraperAPI: ${searchParams.name}`,
      extractedEntities: [{
        type: 'address',
        value: address,
        confidence: 80
      }]
    });
  });

  return results;
}

/**
 * Spokeo specific data extraction
 */
function extractFromSpokeo(html: string, searchParams: any): any[] {
  const results: any[] = [];
  
  // Extract age information
  const ageRegex = /Age\s*:?\s*(\d{1,3})/gi;
  const ageMatches = html.match(ageRegex) || [];
  
  ageMatches.forEach((match, index) => {
    const ageMatch = match.match(/\d{1,3}/);
    if (ageMatch) {
      const age = ageMatch[0];
      results.push({
        id: `spokeo-age-${Date.now()}-${index}`,
        type: 'age',
        value: age,
        title: `Age from Spokeo: ${age}`,
        snippet: `Age information found on Spokeo profile. Cross-reference with other sources recommended.`,
        url: 'https://www.spokeo.com',
        source: 'Spokeo (ScraperAPI)',
        confidence: 75,
        relevanceScore: 65,
        timestamp: new Date(),
        query: `ScraperAPI: ${searchParams.name}`,
        extractedEntities: [{
          type: 'age',
          value: age,
          confidence: 75
        }]
      });
    }
  });

  return results;
}

/**
 * TruePeopleSearch specific data extraction
 */
function extractFromTruePeopleSearch(html: string, searchParams: any): any[] {
  const results: any[] = [];
  
  // Extract relatives/associates
  const relativeRegex = /(?:Relative|Associate|Family)[^<]*([A-Z][a-z]+\s+[A-Z][a-z]+)/gi;
  const relatives = html.match(relativeRegex) || [];
  
  relatives.forEach((match, index) => {
    const nameMatch = match.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    if (nameMatch) {
      const relativeName = nameMatch[1];
      results.push({
        id: `truepeoplesearch-relative-${Date.now()}-${index}`,
        type: 'relative',
        value: relativeName,
        title: `Relative/Associate: ${relativeName}`,
        snippet: `Potential relative or associate found on TruePeopleSearch. May share location or contact information.`,
        url: 'https://www.truepeoplesearch.com',
        source: 'TruePeopleSearch (ScraperAPI)',
        confidence: 70,
        relevanceScore: 60,
        timestamp: new Date(),
        query: `ScraperAPI: ${searchParams.name}`,
        extractedEntities: [{
          type: 'relative',
          value: relativeName,
          confidence: 70
        }]
      });
    }
  });

  return results;
}

/**
 * FastPeopleSearch specific data extraction
 */
function extractFromFastPeopleSearch(html: string, searchParams: any): any[] {
  const results: any[] = [];
  
  // Extract basic contact information
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = html.match(emailRegex) || [];
  
  emails.forEach((email, index) => {
    if (!email.includes('example.com') && !email.includes('test.com')) {
      results.push({
        id: `fastpeoplesearch-email-${Date.now()}-${index}`,
        type: 'email',
        value: email,
        title: `Email from FastPeopleSearch: ${email}`,
        snippet: `Email address found on FastPeopleSearch profile. Verification recommended.`,
        url: 'https://www.fastpeoplesearch.com',
        source: 'FastPeopleSearch (ScraperAPI)',
        confidence: 65,
        relevanceScore: 55,
        timestamp: new Date(),
        query: `ScraperAPI: ${searchParams.name}`,
        extractedEntities: [{
          type: 'email',
          value: email,
          confidence: 65
        }]
      });
    }
  });

  return results;
}

/**
 * Generic data extraction fallback
 */
function extractGenericData(html: string, platform: string, searchParams: any): any[] {
  const results: any[] = [];
  
  // Generic phone number extraction
  const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
  const phones = html.match(phoneRegex) || [];
  
  phones.slice(0, 3).forEach((phone, index) => {
    results.push({
      id: `${platform}-generic-phone-${Date.now()}-${index}`,
      type: 'phone',
      value: phone,
      title: `Phone from ${platform}: ${phone}`,
      snippet: `Phone number extracted from ${platform} via ScraperAPI.`,
      url: `https://www.${platform}.com`,
      source: `${platform} (ScraperAPI)`,
      confidence: 60,
      relevanceScore: 50,
      timestamp: new Date(),
      query: `ScraperAPI: ${searchParams.name}`,
      extractedEntities: [{
        type: 'phone',
        value: phone,
        confidence: 60
      }]
    });
  });

  // Generic email extraction
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = html.match(emailRegex) || [];
  
  emails.slice(0, 2).forEach((email, index) => {
    if (!email.includes('example.com') && !email.includes('noreply')) {
      results.push({
        id: `${platform}-generic-email-${Date.now()}-${index}`,
        type: 'email',
        value: email,
        title: `Email from ${platform}: ${email}`,
        snippet: `Email address extracted from ${platform} via ScraperAPI.`,
        url: `https://www.${platform}.com`,
        source: `${platform} (ScraperAPI)`,
        confidence: 55,
        relevanceScore: 45,
        timestamp: new Date(),
        query: `ScraperAPI: ${searchParams.name}`,
        extractedEntities: [{
          type: 'email',
          value: email,
          confidence: 55
        }]
      });
    }
  });

  return results;
}