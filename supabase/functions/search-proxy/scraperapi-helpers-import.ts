// Import helper functions (inline for edge function compatibility)
export function generatePeopleSearchUrls(searchParams: any): { platform: string; url: string }[] {
  const { name, city, state } = searchParams;
  const encodedName = encodeURIComponent(name);
  const urls: { platform: string; url: string }[] = [];

  // WhitePages
  if (city && state) {
    const location = `${city}-${state}`.replace(/\s+/g, '-');
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

  return urls;
}

export async function performScraperAPISearch(
  url: string,
  platform: string, 
  apiKey: string
): Promise<{ success: boolean; html?: string; cost: number; statusCode: number; error?: string }> {
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

    if (config.mode === 'stealth') {
      params.append('residential', 'true');
      params.append('keep_headers', 'true');
    } else if (config.mode === 'deep') {
      params.append('premium', 'true');
      params.append('keep_headers', 'true');
    }

    console.log(`ScraperAPI request for ${platform}: ${url.substring(0, 100)}...`);
    const response = await fetch(`https://api.scraperapi.com/?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`ScraperAPI request failed: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const cost = getCreditCost(config.mode) * 0.001;

    console.log(`ScraperAPI success for ${platform}: ${html.length} chars, ${getCreditCost(config.mode)} credits`);

    return {
      success: true,
      html,
      cost,
      statusCode: response.status
    };

  } catch (error) {
    console.error(`ScraperAPI error for ${platform}:`, error);
    return {
      success: false,
      cost: 0,
      statusCode: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function getPlatformConfig(platform: string): {
  mode: string;
  renderJs: boolean;
  premium: boolean;
  country?: string;
} {
  const configs: Record<string, any> = {
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
    }
  };

  return configs[platform] || {
    mode: 'standard',
    renderJs: true,
    premium: false
  };
}

function getCreditCost(mode: string): number {
  const costs: Record<string, number> = {
    light: 1,
    standard: 10,
    deep: 25,
    stealth: 50
  };
  
  return costs[mode] || 10;
}

export function extractEntitiesFromScrapedContent(
  html: string,
  platform: string,
  searchParams: any
): any[] {
  const results: any[] = [];
  
  try {
    // Platform-specific extraction
    if (platform === 'whitepages') {
      return extractFromWhitePages(html, searchParams);
    } else if (platform === 'spokeo') {
      return extractFromSpokeo(html, searchParams);
    } else if (platform === 'truepeoplesearch') {
      return extractFromTruePeopleSearch(html, searchParams);
    }

    // Generic extraction fallback
    return extractGenericData(html, platform, searchParams);

  } catch (error) {
    console.error(`Error extracting data from ${platform}:`, error);
    return [];
  }
}

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
      snippet: `Phone number found on WhitePages profile via ScraperAPI.`,
      url: 'https://www.whitepages.com',
      source: 'WhitePages (ScraperAPI)',
      confidence: 85,
      relevanceScore: 75,
      timestamp: new Date(),
      extractedEntities: [{
        type: 'phone',
        value: phone,
        confidence: 85
      }]
    });
  });

  return results;
}

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
        snippet: `Age information found on Spokeo profile via ScraperAPI.`,
        url: 'https://www.spokeo.com',
        source: 'Spokeo (ScraperAPI)',
        confidence: 75,
        relevanceScore: 65,
        timestamp: new Date(),
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
        snippet: `Potential relative or associate found via ScraperAPI on TruePeopleSearch.`,
        url: 'https://www.truepeoplesearch.com',
        source: 'TruePeopleSearch (ScraperAPI)',
        confidence: 70,
        relevanceScore: 60,
        timestamp: new Date(),
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

function extractGenericData(html: string, platform: string, searchParams: any): any[] {
  const results: any[] = [];
  
  // Generic phone extraction
  const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
  const phones = html.match(phoneRegex) || [];
  
  phones.slice(0, 2).forEach((phone, index) => {
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
      extractedEntities: [{
        type: 'phone',
        value: phone,
        confidence: 60
      }]
    });
  });

  return results;
}