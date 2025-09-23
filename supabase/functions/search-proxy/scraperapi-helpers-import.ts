/**
 * Enhanced ScraperAPI helper functions for comprehensive skip tracing
 * Consolidated and optimized for maximum entity extraction and success rates
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
 * Generate comprehensive people search URLs for professional skip tracing
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

  // TIER 1 - Premium sites with highest data quality
  if (cityClean && stateClean) {
    const locationSlug = `${cityClean.replace(/\s+/g, '-')}-${stateClean.replace(/\s+/g, '-')}`.toLowerCase();
    
    // WhitePages - Most comprehensive contact info
    urls.push({
      platform: 'whitepages',
      url: `https://www.whitepages.com/name/${encodedName}/${encodeURIComponent(locationSlug)}`,
      priority: 1,
      credits: 50 // Premium stealth mode for best success rate
    });

    // TruePeopleSearch - Current addresses and phone numbers
    urls.push({
      platform: 'truepeoplesearch',
      url: `https://www.truepeoplesearch.com/results?name=${encodedName}&citystatezip=${encodeURIComponent(`${cityClean} ${stateClean} ${zip}`.trim())}`,
      priority: 1,
      credits: 25 // Deep mode for comprehensive data
    });

    // Spokeo - Age, education, social profiles, relatives
    urls.push({
      platform: 'spokeo',
      url: `https://www.spokeo.com/search?q=${encodedName}&g=${encodeURIComponent(`${cityClean} ${stateClean}`)}`,
      priority: 1,
      credits: 25
    });
  }

  // TIER 2 - High-value supplementary sources
  if (cityClean && stateClean) {
    // BeenVerified - Criminal records, property history, employment
    urls.push({
      platform: 'beenverified',
      url: `https://www.beenverified.com/people/${encodedName}/${encodeURIComponent(`${cityClean}-${stateClean}`)}`,
      priority: 2,
      credits: 25
    });

    // PeopleFinders - Business connections, professional history
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

  // SPECIALIZED SEARCHES - Critical for skip tracing
  
  // Phone number reverse lookup (HIGH PRIORITY)
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      urls.push({
        platform: 'whitepages-reverse',
        url: `https://www.whitepages.com/phone/${cleanPhone}`,
        priority: 1,
        credits: 50 // Premium for reverse phone lookup
      });
      
      urls.push({
        platform: 'truecaller',
        url: `https://www.truecaller.com/search/us/${cleanPhone}`,
        priority: 2,
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
  }

  // Sort by priority and return optimized list for skip tracing
  return urls.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.credits - a.credits; // Higher credit searches tend to have better data
  }).slice(0, 12); // Limit for cost management
}

/**
 * Perform ScraperAPI request with enhanced configuration for skip tracing
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
      autoparse: 'false',
      keep_headers: 'true'
    });

    // Add premium features for better success rates
    if (config.premium) {
      params.append('premium', 'true');
    }
    
    if (config.country) {
      params.append('country_code', config.country);
    }

    // Mode-specific optimizations
    if (config.mode === 'stealth') {
      params.append('residential', 'true');
      params.append('session', '1');
    } else if (config.mode === 'deep') {
      params.append('premium', 'true');
    }

    console.log(`ScraperAPI request for ${platform}: ${url.substring(0, 100)}... (mode: ${config.mode})`);
    
    const response = await fetch(`https://api.scraperapi.com/?${params.toString()}`);
    
    if (!response.ok) {
      console.error(`ScraperAPI failed for ${platform}:`, response.status, response.statusText);
      return {
        success: false,
        cost: getCreditCost(config.mode) * 0.001,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const html = await response.text();
    const cost = getCreditCost(config.mode) * 0.001;

    // Validate content quality
    if (html.length < 100 || html.includes('Access Denied') || html.includes('Blocked')) {
      console.warn(`ScraperAPI returned blocked/minimal content for ${platform}`);
      return {
        success: false,
        html: html,
        cost: cost,
        statusCode: response.status,
        error: 'Content appears blocked or insufficient'
      };
    }

    console.log(`ScraperAPI success for ${platform}: ${html.length} chars, cost: $${cost.toFixed(4)}`);
    
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

/**
 * Get platform-specific scraping configuration optimized for skip tracing
 */
function getPlatformConfig(platform: string): ScrapingConfig {
  const configs: Record<string, ScrapingConfig> = {
    // PREMIUM SITES - Use stealth/deep modes for anti-detection
    'whitepages': {
      mode: 'stealth',
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
    'spokeo': {
      mode: 'deep',
      renderJs: true,
      premium: true
    },
    'beenverified': {
      mode: 'deep',
      renderJs: true,
      premium: true
    },
    'peoplefinders': {
      mode: 'deep',
      renderJs: true,
      premium: true
    },
    'intelius': {
      mode: 'deep',
      renderJs: true,
      premium: true
    },
    
    // STANDARD SITES - Balance cost vs success
    'truepeoplesearch': {
      mode: 'deep', // Upgraded for better success
      renderJs: true,
      premium: false
    },
    'truecaller': {
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
    
    // BASIC SITES - Cost-effective
    'fastpeoplesearch': {
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
 * Get credit cost for different ScraperAPI modes
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
 * Extract comprehensive entities from scraped HTML for skip tracing
 */
export function extractEntitiesFromScrapedContent(
  html: string, 
  platform: string, 
  searchParams: any
): any[] {
  console.log(`Entity extraction for ${platform}, HTML length: ${html.length}`);
  
  try {
    // Platform-specific extraction for maximum yield
    if (platform === 'whitepages' || platform === 'whitepages-reverse') {
      return extractFromWhitePages(html, searchParams, platform);
    } else if (platform === 'spokeo') {
      return extractFromSpokeo(html, searchParams);
    } else if (platform === 'truepeoplesearch') {
      return extractFromTruePeopleSearch(html, searchParams);
    } else if (platform === 'fastpeoplesearch') {
      return extractFromFastPeopleSearch(html, searchParams);
    } else if (['beenverified', 'peoplefinders', 'intelius'].includes(platform)) {
      return extractFromPremiumSites(html, searchParams, platform);
    }

    // Enhanced generic extraction as fallback
    return extractGenericAdvanced(html, platform, searchParams);

  } catch (error) {
    console.error(`Error extracting data from ${platform}:`, error);
    return [];
  }
}

/**
 * WhitePages enhanced extraction - maximum entity yield
 */
function extractFromWhitePages(html: string, searchParams: any, platform: string): any[] {
  const results: any[] = [];
  const isReverse = platform === 'whitepages-reverse';
  
  // Enhanced phone patterns for comprehensive extraction
  const phonePatterns = [
    /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/g,
    /\d{3}[-.\s]\d{3}[-.\s]\d{4}/g,
    /\+1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /\b\d{10}\b/g
  ];
  
  const extractedPhones = new Set<string>();
  phonePatterns.forEach(pattern => {
    const matches = html.match(pattern) || [];
    matches.forEach(phone => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10 || cleaned.length === 11) {
        const formatted = cleaned.length === 11 
          ? `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
          : `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        extractedPhones.add(formatted);
      }
    });
  });

  Array.from(extractedPhones).forEach((phone, index) => {
    results.push({
      id: `whitepages-phone-${Date.now()}-${index}`,
      type: 'phone',
      value: phone,
      title: `Phone from WhitePages: ${phone}`,
      snippet: `${isReverse ? 'Owner information for' : 'Verified contact number'} from WhitePages`,
      url: 'https://www.whitepages.com',
      source: 'WhitePages (ScraperAPI)',
      confidence: 92,
      relevanceScore: 88,
      timestamp: new Date(),
      extractedEntities: [{
        type: 'phone',
        value: phone,
        confidence: 92
      }]
    });
  });

  // Enhanced address extraction
  const addressPatterns = [
    /\b\d+\s+[A-Za-z\s]{3,30}\s+(St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Ct|Court|Way|Pl|Place|Cir|Circle)[A-Za-z\s,#\d]*?\s*\d{5}(-\d{4})?\b/gi,
    /(?:Current|Previous|Prior)\s*(?:Address|Residence)[:\s]*([^<\n]{10,80})/gi
  ];

  const extractedAddresses = new Set<string>();
  addressPatterns.forEach(pattern => {
    const matches = html.match(pattern) || [];
    matches.forEach(match => {
      const cleaned = match.replace(/^(Current|Previous|Prior|Lives at|Address)[:\s]*/i, '').trim();
      if (cleaned.length > 10 && cleaned.length < 100) {
        extractedAddresses.add(cleaned);
      }
    });
  });

  Array.from(extractedAddresses).forEach((address, index) => {
    const isCurrent = html.toLowerCase().includes('current') && 
                     html.toLowerCase().indexOf(address.toLowerCase()) > html.toLowerCase().indexOf('current');
    
    results.push({
      id: `whitepages-address-${Date.now()}-${index}`,
      type: 'address',
      value: address,
      title: `${isCurrent ? 'Current' : 'Previous'} Address: ${address}`,
      snippet: `${isCurrent ? 'Current residential' : 'Historical'} address from WhitePages records`,
      url: 'https://www.whitepages.com',
      source: 'WhitePages (ScraperAPI)',
      confidence: isCurrent ? 88 : 78,
      relevanceScore: isCurrent ? 85 : 75,
      timestamp: new Date(),
      extractedEntities: [{
        type: 'address',
        value: address,
        confidence: isCurrent ? 88 : 78
      }]
    });
  });

  // Enhanced relatives/associates extraction
  const relativePatterns = [
    /(?:Related\s+to|Associates?|Family|Relatives?|Lives\s+with|Household)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*\s+[A-Z][a-z]+)/gi,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*,\s*age\s+\d+)?(?:\s*-\s*(?:Relative|Associate|Family))/gi
  ];

  const extractedRelatives = new Set<string>();
  relativePatterns.forEach(pattern => {
    const matches = html.match(pattern) || [];
    matches.forEach(match => {
      const nameMatch = match.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*\s+[A-Z][a-z]+)/);
      if (nameMatch && nameMatch[1] !== searchParams.name && nameMatch[1].length > 4) {
        extractedRelatives.add(nameMatch[1].trim());
      }
    });
  });

  Array.from(extractedRelatives).forEach((relativeName, index) => {
    results.push({
      id: `whitepages-relative-${Date.now()}-${index}`,
      type: 'relative',
      value: relativeName,
      title: `Related Person: ${relativeName}`,
      snippet: `Family member or associate identified through WhitePages`,
      url: 'https://www.whitepages.com',
      source: 'WhitePages (ScraperAPI)',
      confidence: 82,
      relevanceScore: 78,
      timestamp: new Date(),
      extractedEntities: [{
        type: 'relative',
        value: relativeName,
        confidence: 82
      }]
    });
  });

  // Age extraction
  const agePatterns = [
    /(?:Age|Born)[:\s]*(\d{1,3})/gi,
    /(\d{1,3})\s*(?:years?\s*old|yrs?)/gi
  ];

  agePatterns.forEach((pattern, patternIndex) => {
    const matches = html.match(pattern) || [];
    matches.forEach((match, index) => {
      const ageMatch = match.match(/(\d{1,3})/);
      if (ageMatch) {
        const age = parseInt(ageMatch[1]);
        if (age >= 18 && age <= 120) {
          results.push({
            id: `whitepages-age-${Date.now()}-${patternIndex}-${index}`,
            type: 'age',
            value: age.toString(),
            title: `Age: ${age} years old`,
            snippet: `Age information from WhitePages records`,
            url: 'https://www.whitepages.com',
            source: 'WhitePages (ScraperAPI)',
            confidence: 78,
            relevanceScore: 68,
            timestamp: new Date(),
            extractedEntities: [{
              type: 'age',
              value: age.toString(),
              confidence: 78
            }]
          });
        }
      }
    });
  });

  return results;
}

/**
 * Spokeo extraction - specializes in age, education, social connections
 */
function extractFromSpokeo(html: string, searchParams: any): any[] {
  const results: any[] = [];
  
  const patterns = {
    age: /(?:Age|Born)[:\s]*(\d{1,3})/gi,
    education: /(?:Education|School|College|University)[:\s]*([^<\n]{5,50})/gi,
    employment: /(?:Work|Employment|Job|Company)[:\s]*([^<\n]{3,40})/gi
  };

  Object.entries(patterns).forEach(([type, pattern], patternIndex) => {
    const matches = html.match(pattern) || [];
    matches.forEach((match, index) => {
      const valueMatch = match.match(type === 'age' ? /(\d{1,3})/ : /[:\s]*([^<\n]{3,50})/);
      
      if (valueMatch) {
        const value = valueMatch[1].trim();
        if (type === 'age' && (parseInt(value) < 18 || parseInt(value) > 120)) return;
        
        results.push({
          id: `spokeo-${type}-${Date.now()}-${patternIndex}-${index}`,
          type: type,
          value: value,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${value}`,
          snippet: `${type} information from Spokeo profile`,
          url: 'https://www.spokeo.com',
          source: 'Spokeo (ScraperAPI)',
          confidence: 75,
          relevanceScore: 70,
          timestamp: new Date(),
          extractedEntities: [{
            type: type,
            value: value,
            confidence: 75
          }]
        });
      }
    });
  });

  return results;
}

/**
 * TruePeopleSearch extraction - focuses on current addresses and relatives
 */
function extractFromTruePeopleSearch(html: string, searchParams: any): any[] {
  const results: any[] = [];
  
  // Relatives extraction
  const relativePattern = /(?:Relative|Associate|Family)[^<]*([A-Z][a-z]+\s+[A-Z][a-z]+)/gi;
  const relatives = html.match(relativePattern) || [];
  
  relatives.forEach((match, index) => {
    const nameMatch = match.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    if (nameMatch && nameMatch[1] !== searchParams.name) {
      results.push({
        id: `truepeoplesearch-relative-${Date.now()}-${index}`,
        type: 'relative',
        value: nameMatch[1],
        title: `Related Person: ${nameMatch[1]}`,
        snippet: `Potential relative found via TruePeopleSearch`,
        url: 'https://www.truepeoplesearch.com',
        source: 'TruePeopleSearch (ScraperAPI)',
        confidence: 70,
        relevanceScore: 65,
        timestamp: new Date(),
        extractedEntities: [{
          type: 'relative',
          value: nameMatch[1],
          confidence: 70
        }]
      });
    }
  });

  // Add generic extraction for phones and addresses
  results.push(...extractGenericAdvanced(html, 'truepeoplesearch', searchParams));
  return results;
}

/**
 * FastPeopleSearch extraction
 */
function extractFromFastPeopleSearch(html: string, searchParams: any): any[] {
  return extractGenericAdvanced(html, 'fastpeoplesearch', searchParams);
}

/**
 * Premium sites extraction (BeenVerified, PeopleFinders, Intelius)
 */
function extractFromPremiumSites(html: string, searchParams: any, platform: string): any[] {
  const results = extractGenericAdvanced(html, platform, searchParams);
  
  // Add premium-specific patterns
  const premiumPatterns = {
    criminal: /(?:Criminal|Arrest|Court)[^<]*([^<\n]{10,50})/gi,
    property: /(?:Property|Real Estate|Owner)[^<]*([^<\n]{15,60})/gi,
    business: /(?:Business|Company|Employer)[^<]*([^<\n]{5,40})/gi
  };

  Object.entries(premiumPatterns).forEach(([type, pattern], patternIndex) => {
    const matches = html.match(pattern) || [];
    matches.slice(0, 2).forEach((match, index) => {
      const valueMatch = match.match(/[^<]*([^<\n]{5,60})/);
      if (valueMatch && valueMatch[1].trim().length > 5) {
        results.push({
          id: `${platform}-${type}-${Date.now()}-${patternIndex}-${index}`,
          type: type,
          value: valueMatch[1].trim(),
          title: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${valueMatch[1].trim()}`,
          snippet: `${type} information from ${platform}`,
          url: `https://www.${platform}.com`,
          source: `${platform} (ScraperAPI)`,
          confidence: 72,
          relevanceScore: 68,
          timestamp: new Date(),
          extractedEntities: [{
            type: type,
            value: valueMatch[1].trim(),
            confidence: 72
          }]
        });
      }
    });
  });

  return results;
}

/**
 * Enhanced generic extraction for comprehensive entity detection
 */
function extractGenericAdvanced(html: string, platform: string, searchParams: any): any[] {
  const results: any[] = [];
  
  // Comprehensive phone extraction
  const phonePatterns = [
    /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g,
    /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/g,
    /\+1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /\b\d{10}\b/g
  ];

  const extractedPhones = new Set<string>();
  phonePatterns.forEach(pattern => {
    const matches = html.match(pattern) || [];
    matches.forEach(phone => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10 || cleaned.length === 11) {
        const formatted = cleaned.length === 11 
          ? `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
          : `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        extractedPhones.add(formatted);
      }
    });
  });

  Array.from(extractedPhones).slice(0, 3).forEach((phone, index) => {
    results.push({
      id: `${platform}-phone-${Date.now()}-${index}`,
      type: 'phone',
      value: phone,
      title: `Phone from ${platform}: ${phone}`,
      snippet: `Phone number extracted from ${platform}`,
      url: `https://www.${platform}.com`,
      source: `${platform} (ScraperAPI)`,
      confidence: 65,
      relevanceScore: 60,
      timestamp: new Date(),
      extractedEntities: [{
        type: 'phone',
        value: phone,
        confidence: 65
      }]
    });
  });

  // Email extraction
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = html.match(emailPattern) || [];
  
  emails.slice(0, 2).forEach((email, index) => {
    if (!email.includes('noreply') && !email.includes('example')) {
      results.push({
        id: `${platform}-email-${Date.now()}-${index}`,
        type: 'email',
        value: email,
        title: `Email from ${platform}: ${email}`,
        snippet: `Email address found on ${platform}`,
        url: `https://www.${platform}.com`,
        source: `${platform} (ScraperAPI)`,
        confidence: 70,
        relevanceScore: 65,
        timestamp: new Date(),
        extractedEntities: [{
          type: 'email',
          value: email,
          confidence: 70
        }]
      });
    }
  });

  return results;
}