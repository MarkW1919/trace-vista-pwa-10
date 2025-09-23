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
 * Generate comprehensive people search URLs for advanced skip tracing
 */
export function generatePeopleSearchUrls(searchParams: any): { platform: string; url: string; priority: number; credits: number }[] {
  const { name, city, state, phone, email, address } = searchParams;
  const encodedName = encodeURIComponent(name);
  const urls: { platform: string; url: string; priority: number; credits: number }[] = [];

  // Parse location components
  let cityClean = city?.trim() || '';
  let stateClean = state?.trim() || '';
  
  // Extract zip code if present in address
  const zipMatch = address?.match(/\b\d{5}(-\d{4})?\b/) || [];
  const zip = zipMatch[0] || '';

  // TIER 1 - Premium sites with highest success rates for skip tracing
  if (cityClean && stateClean) {
    const locationSlug = `${cityClean.replace(/\s+/g, '-')}-${stateClean.replace(/\s+/g, '-')}`.toLowerCase();
    
    // WhitePages - Most comprehensive contact info
    urls.push({
      platform: 'whitepages',
      url: `https://www.whitepages.com/name/${encodedName}/${encodeURIComponent(locationSlug)}`,
      priority: 1,
      credits: 50 // Stealth mode for maximum success
    });

    // TruePeopleSearch - Current addresses and relatives
    urls.push({
      platform: 'truepeoplesearch',
      url: `https://www.truepeoplesearch.com/results?name=${encodedName}&citystatezip=${encodeURIComponent(`${cityClean} ${stateClean} ${zip}`.trim())}`,
      priority: 1,
      credits: 25 // Enhanced for better data
    });

    // Spokeo - Age, education, social profiles
    urls.push({
      platform: 'spokeo',
      url: `https://www.spokeo.com/search?q=${encodedName}&g=${encodeURIComponent(`${cityClean} ${stateClean}`)}`,
      priority: 1,
      credits: 25
    });
  }

  // TIER 2 - High-value supplementary sources
  if (cityClean && stateClean) {
    // BeenVerified - Criminal records, property history
    urls.push({
      platform: 'beenverified',
      url: `https://www.beenverified.com/people/${encodedName}/${encodeURIComponent(`${cityClean}-${stateClean}`)}`,
      priority: 2,
      credits: 25
    });

    // PeopleFinders - Employment history, business connections
    urls.push({
      platform: 'peoplefinders',
      url: `https://www.peoplefinders.com/people/${encodedName}/${encodeURIComponent(`${cityClean}-${stateClean}`)}`,
      priority: 2,
      credits: 25
    });

    // Intelius - Comprehensive background data
    urls.push({
      platform: 'intelius',
      url: `https://www.intelius.com/people-search/${encodedName}/${encodeURIComponent(`${cityClean}-${stateClean}`)}`,
      priority: 2,
      credits: 25
    });
  }

  // TIER 3 - Cost-effective broad searches
  // FastPeopleSearch - Good relatives and basic contact info
  urls.push({
    platform: 'fastpeoplesearch',
    url: cityClean && stateClean 
      ? `https://www.fastpeoplesearch.com/search/people/${encodedName}/${encodeURIComponent(`${cityClean}-${stateClean}`)}`
      : `https://www.fastpeoplesearch.com/search/people/${encodedName}`,
    priority: 3,
    credits: 1 // Light mode sufficient
  });

  // SPECIALIZED SEARCHES - High priority for skip tracing

  // Phone number reverse lookup
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      urls.push({
        platform: 'whitepages-reverse',
        url: `https://www.whitepages.com/phone/${cleanPhone}`,
        priority: 1,
        credits: 50
      });
      
      urls.push({
        platform: 'truecaller',
        url: `https://www.truecaller.com/search/us/${cleanPhone}`,
        priority: 2,
        credits: 10
      });

      urls.push({
        platform: 'phonevalidator',
        url: `https://www.phonevalidator.com/search/results.aspx?phoneno=${cleanPhone}`,
        priority: 3,
        credits: 10
      });
    }
  }

  // Email-based searches for social and professional connections
  if (email && email.includes('@')) {
    urls.push({
      platform: 'pipl-email',
      url: `https://pipl.com/search/?q=${encodeURIComponent(email)}`,
      priority: 2,
      credits: 25
    });
    
    // Professional network searches
    const domain = email.split('@')[1];
    if (!['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain.toLowerCase())) {
      urls.push({
        platform: 'company-search',
        url: `https://www.linkedin.com/company/${domain.replace('.com', '')}`,
        priority: 3,
        credits: 10
      });
    }
  }

  // Property and address history searches
  if (address && cityClean && stateClean) {
    const encodedAddress = encodeURIComponent(address);
    
    urls.push({
      platform: 'property-search',
      url: `https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(`${cityClean}_${stateClean}`)}?search=${encodedAddress}`,
      priority: 3,
      credits: 10
    });

    urls.push({
      platform: 'property-history',
      url: `https://www.zillow.com/homes/${encodedAddress.replace(/\s+/g, '-')}-${encodeURIComponent(cityClean)}-${encodeURIComponent(stateClean)}_rb/`,
      priority: 3,
      credits: 10
    });
  }

  // Sort by priority and return optimized list for skip tracing
  return urls.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.credits - a.credits; // Higher credit searches tend to have better data
  }).slice(0, 15); // Increased limit for comprehensive skip tracing
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
 * Get platform-specific scraping configuration optimized for skip tracing
 */
function getPlatformConfig(platform: string): ScrapingConfig {
  const configs: Record<string, ScrapingConfig> = {
    // HIGH-VALUE SITES - Use premium modes for best success rates
    whitepages: {
      mode: 'stealth',        // Residential proxies + advanced anti-detection
      renderJs: true,
      premium: true,
      country: 'US'
    },
    'whitepages-reverse': {
      mode: 'stealth',
      renderJs: true,
      premium: true,
      country: 'US'
    },
    spokeo: {
      mode: 'deep',           // Premium proxies + JS rendering
      renderJs: true,
      premium: true
    },
    beenverified: {
      mode: 'deep',
      renderJs: true, 
      premium: true
    },
    peoplefinders: {
      mode: 'deep',
      renderJs: true,
      premium: true
    },
    intelius: {
      mode: 'deep',
      renderJs: true,
      premium: true
    },
    
    // MEDIUM-VALUE SITES - Standard mode with JS rendering
    truepeoplesearch: {
      mode: 'standard',
      renderJs: true,
      premium: false
    },
    truecaller: {
      mode: 'standard',
      renderJs: true,
      premium: false
    },
    'pipl-email': {
      mode: 'standard',
      renderJs: true,
      premium: false
    },
    'property-search': {
      mode: 'standard',
      renderJs: true,
      premium: false
    },
    
    // COST-EFFECTIVE SITES - Light mode sufficient
    fastpeoplesearch: {
      mode: 'light',          // Basic scraping, no JS needed
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
 * WhitePages specific data extraction - Enhanced for comprehensive skip tracing
 */
function extractFromWhitePages(html: string, searchParams: any): any[] {
  const results: any[] = [];
  
  // Enhanced phone number extraction - multiple formats
  const phonePatterns = [
    /\(\d{3}\)\s*\d{3}-\d{4}/g,                    // (555) 123-4567
    /\d{3}-\d{3}-\d{4}/g,                          // 555-123-4567
    /\d{3}\.\d{3}\.\d{4}/g,                        // 555.123.4567  
    /\d{3}\s+\d{3}\s+\d{4}/g,                      // 555 123 4567
    /\+?1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g    // +1-555-123-4567
  ];
  
  const allPhones = new Set<string>();
  phonePatterns.forEach(pattern => {
    const matches = html.match(pattern) || [];
    matches.forEach(phone => allPhones.add(phone.trim()));
  });

  Array.from(allPhones).forEach((phone, index) => {
    results.push({
      id: `whitepages-phone-${Date.now()}-${index}`,
      type: 'phone',
      value: phone,
      title: `Phone from WhitePages: ${phone}`,
      snippet: `Verified phone number from WhitePages. Current or recent contact information.`,
      url: 'https://www.whitepages.com',
      source: 'WhitePages (ScraperAPI)',
      confidence: 90,
      relevanceScore: 85,
      timestamp: new Date(),
      query: `ScraperAPI: ${searchParams.name}`,
      extractedEntities: [{
        type: 'phone',
        value: phone,
        confidence: 90
      }]
    });
  });

  // Enhanced address extraction - current and previous addresses
  const addressPatterns = [
    /\d+\s+[A-Za-z\s]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Ct|Court|Way|Pl|Place|Cir|Circle)[A-Za-z\s,#\d]*\d{5}(-\d{4})?/gi,
    /(?:Current|Previous|Prior)\s*(?:Address|Residence)[:\s]*([^<\n]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Ct|Court|Way|Pl|Place)[^<\n]*\d{5})/gi
  ];

  const allAddresses = new Set<string>();
  addressPatterns.forEach(pattern => {
    const matches = html.match(pattern) || [];
    matches.forEach(addr => {
      const cleaned = addr.replace(/^(Current|Previous|Prior)\s*(?:Address|Residence)[:\s]*/i, '').trim();
      if (cleaned.length > 10) allAddresses.add(cleaned);
    });
  });

  Array.from(allAddresses).forEach((address, index) => {
    const isCurrent = html.toLowerCase().includes('current') && html.toLowerCase().indexOf(address.toLowerCase()) > html.toLowerCase().indexOf('current');
    results.push({
      id: `whitepages-address-${Date.now()}-${index}`,
      type: 'address',
      value: address,
      title: `${isCurrent ? 'Current' : 'Previous'} Address from WhitePages: ${address}`,
      snippet: `${isCurrent ? 'Current residential' : 'Previous'} address found on WhitePages. Property ownership records may be available.`,
      url: 'https://www.whitepages.com',
      source: 'WhitePages (ScraperAPI)',
      confidence: isCurrent ? 85 : 75,
      relevanceScore: isCurrent ? 80 : 70,
      timestamp: new Date(),
      query: `ScraperAPI: ${searchParams.name}`,
      extractedEntities: [{
        type: 'address',
        value: address,
        confidence: isCurrent ? 85 : 75
      }]
    });
  });

  // Extract relatives and associates
  const relativePatterns = [
    /(?:Related to|Associates?|Family|Relatives?)[:\s]*([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    /(?:Lives with|Household members?)[:\s]*([A-Z][a-z]+\s+[A-Z][a-z]+)/gi
  ];

  const allRelatives = new Set<string>();
  relativePatterns.forEach(pattern => {
    const matches = html.match(pattern) || [];
    matches.forEach(match => {
      const nameMatch = match.match(/([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (nameMatch && nameMatch[1] !== searchParams.name) {
        allRelatives.add(nameMatch[1]);
      }
    });
  });

  Array.from(allRelatives).forEach((relativeName, index) => {
    results.push({
      id: `whitepages-relative-${Date.now()}-${index}`,
      type: 'relative',
      value: relativeName,
      title: `Related Person from WhitePages: ${relativeName}`,
      snippet: `Family member or associate found on WhitePages. May share address or contact information.`,
      url: 'https://www.whitepages.com',
      source: 'WhitePages (ScraperAPI)',
      confidence: 80,
      relevanceScore: 75,
      timestamp: new Date(),
      query: `ScraperAPI: ${searchParams.name}`,
      extractedEntities: [{
        type: 'relative',
        value: relativeName,
        confidence: 80
      }]
    });
  });

  // Extract age information
  const agePattern = /(?:Age|Born)[:\s]*(\d{1,3})|(\d{1,3})\s*(?:years?\s*old|yrs?)/gi;
  const ageMatches = html.match(agePattern) || [];
  
  ageMatches.forEach((match, index) => {
    const ageMatch = match.match(/\d{1,3}/);
    if (ageMatch) {
      const age = parseInt(ageMatch[0]);
      if (age >= 18 && age <= 120) {
        results.push({
          id: `whitepages-age-${Date.now()}-${index}`,
          type: 'age',
          value: age.toString(),
          title: `Age from WhitePages: ${age}`,
          snippet: `Age information from WhitePages profile. Useful for identity verification.`,
          url: 'https://www.whitepages.com',
          source: 'WhitePages (ScraperAPI)',
          confidence: 75,
          relevanceScore: 65,
          timestamp: new Date(),
          query: `ScraperAPI: ${searchParams.name}`,
          extractedEntities: [{
            type: 'age',
            value: age.toString(),
            confidence: 75
          }]
        });
      }
    }
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