/**
 * Advanced ScraperAPI Service with comprehensive skip tracing capabilities
 * Enhanced entity extraction, rate limiting, and cost optimization
 */

export interface AdvancedScrapingConfig {
  apiKey: string;
  mode: 'light' | 'standard' | 'deep' | 'stealth';
  renderJs: boolean;
  format: 'html' | 'json';
  country?: string;
  premium?: boolean;
  sessionId?: string;
  retryAttempts?: number;
  userAgent?: string;
}

export interface AdvancedScrapingResult {
  success: boolean;
  url: string;
  html?: string;
  json?: any;
  entities: ExtractedEntity[];
  metadata: {
    statusCode: number;
    responseTime: number;
    proxyCountry: string;
    creditsUsed: number;
    costUSD: number;
    retryCount: number;
    bypassedCaptcha: boolean;
  };
  error?: string;
}

export interface ExtractedEntity {
  type: 'phone' | 'email' | 'address' | 'name' | 'age' | 'relative' | 'business' | 'social';
  value: string;
  confidence: number;
  source: string;
  context?: string;
  verified?: boolean;
  metadata?: Record<string, any>;
}

export interface SkipTracingPlatform {
  name: string;
  url: string;
  priority: number;
  expectedDataTypes: string[];
  creditCost: number;
  successRate: number;
  averageEntityCount: number;
}

export class AdvancedScraperApiService {
  private static readonly BASE_URL = 'https://api.scraperapi.com';
  private static readonly CREDIT_COSTS = {
    light: 1,
    standard: 10,
    deep: 25,
    stealth: 50
  };

  private static readonly SKIP_TRACING_PLATFORMS: SkipTracingPlatform[] = [
    {
      name: 'whitepages',
      url: 'https://www.whitepages.com',
      priority: 1,
      expectedDataTypes: ['phone', 'address', 'age', 'relative'],
      creditCost: 50,
      successRate: 0.85,
      averageEntityCount: 4.2
    },
    {
      name: 'truepeoplesearch',
      url: 'https://www.truepeoplesearch.com',
      priority: 1,
      expectedDataTypes: ['address', 'phone', 'relative'],
      creditCost: 10,
      successRate: 0.78,
      averageEntityCount: 3.8
    },
    {
      name: 'fastpeoplesearch',
      url: 'https://www.fastpeoplesearch.com',
      priority: 2,
      expectedDataTypes: ['relative', 'address', 'phone'],
      creditCost: 1,
      successRate: 0.65,
      averageEntityCount: 2.9
    },
    {
      name: 'spokeo',
      url: 'https://www.spokeo.com',
      priority: 2,
      expectedDataTypes: ['age', 'phone', 'email', 'social'],
      creditCost: 25,
      successRate: 0.72,
      averageEntityCount: 3.5
    },
    {
      name: 'beenverified',
      url: 'https://www.beenverified.com',
      priority: 2,
      expectedDataTypes: ['address', 'phone', 'business', 'relative'],
      creditCost: 25,
      successRate: 0.70,
      averageEntityCount: 3.1
    }
  ];

  /**
   * Perform comprehensive skip tracing search across multiple platforms
   */
  static async performSkipTracingSearch(
    searchParams: {
      name: string;
      city?: string;
      state?: string;
      phone?: string;
      email?: string;
      address?: string;
      age?: string;
    },
    config: {
      apiKey: string;
      maxCredits?: number;
      priorityPlatforms?: string[];
      requiredDataTypes?: string[];
    }
  ): Promise<{
    results: AdvancedScrapingResult[];
    totalCost: number;
    creditsUsed: number;
    platformsSearched: number;
    totalEntities: number;
    summary: Record<string, number>;
  }> {
    const results: AdvancedScrapingResult[] = [];
    let totalCost = 0;
    let creditsUsed = 0;
    let platformsSearched = 0;
    const entityCounts: Record<string, number> = {};

    // Check available credits
    const creditInfo = await this.getCreditInfo(config.apiKey);
    if (!creditInfo || creditInfo.remaining <= 0) {
      throw new Error('Insufficient ScraperAPI credits');
    }

    const availableCredits = Math.min(creditInfo.remaining, config.maxCredits || 200);
    console.log(`Starting skip tracing with ${availableCredits} available credits`);

    // Generate optimized search URLs
    const searchUrls = this.generateSkipTracingUrls(searchParams);
    
    // Filter by priority platforms if specified
    const prioritizedUrls = config.priorityPlatforms 
      ? searchUrls.filter(url => config.priorityPlatforms!.includes(url.platform))
      : searchUrls;

    // Sort by success rate and priority
    prioritizedUrls.sort((a, b) => {
      const platformA = this.SKIP_TRACING_PLATFORMS.find(p => p.name === a.platform);
      const platformB = this.SKIP_TRACING_PLATFORMS.find(p => p.name === b.platform);
      
      if (!platformA || !platformB) return 0;
      
      // Calculate priority score (success rate * average entities / credit cost)
      const scoreA = (platformA.successRate * platformA.averageEntityCount) / Math.sqrt(platformA.creditCost);
      const scoreB = (platformB.successRate * platformB.averageEntityCount) / Math.sqrt(platformB.creditCost);
      
      return scoreB - scoreA;
    });

    // Process each platform
    for (const urlInfo of prioritizedUrls) {
      const platform = this.SKIP_TRACING_PLATFORMS.find(p => p.name === urlInfo.platform);
      if (!platform) continue;

      // Check if we have enough credits
      if (creditsUsed + platform.creditCost > availableCredits) {
        console.log(`Skipping ${platform.name} - insufficient credits (need ${platform.creditCost}, have ${availableCredits - creditsUsed})`);
        continue;
      }

      try {
        console.log(`Processing ${platform.name} (Expected: ${platform.expectedDataTypes.join(', ')})`);
        
        const scrapingConfig: AdvancedScrapingConfig = {
          apiKey: config.apiKey,
          mode: platform.creditCost >= 25 ? 'deep' : platform.creditCost >= 10 ? 'standard' : 'light',
          renderJs: true,
          format: 'html',
          country: 'US',
          premium: platform.creditCost >= 25,
          retryAttempts: 2
        };

        const result = await this.scrapeWithAdvancedExtraction(
          urlInfo.url,
          urlInfo.platform,
          scrapingConfig,
          searchParams
        );

        if (result.success && result.entities.length > 0) {
          results.push(result);
          totalCost += result.metadata.costUSD;
          creditsUsed += result.metadata.creditsUsed;
          platformsSearched++;

          // Count entities by type
          result.entities.forEach(entity => {
            entityCounts[entity.type] = (entityCounts[entity.type] || 0) + 1;
          });

          console.log(`${platform.name}: SUCCESS - ${result.entities.length} entities, $${result.metadata.costUSD.toFixed(4)}`);
        } else {
          console.log(`${platform.name}: FAILED - ${result.error || 'No entities extracted'}`);
        }

        // Rate limiting with exponential backoff
        const delay = Math.min(5000, 1000 * Math.pow(1.5, platformsSearched));
        await new Promise(resolve => setTimeout(resolve, delay));

        // Stop if we have sufficient data
        if (results.length >= 3 && Object.keys(entityCounts).length >= 3) {
          console.log('Sufficient data collected, stopping early');
          break;
        }

      } catch (error) {
        console.error(`Error processing ${platform.name}:`, error);
      }
    }

    const totalEntities = Object.values(entityCounts).reduce((sum, count) => sum + count, 0);

    return {
      results,
      totalCost,
      creditsUsed,
      platformsSearched,
      totalEntities,
      summary: entityCounts
    };
  }

  /**
   * Enhanced scraping with comprehensive entity extraction
   */
  private static async scrapeWithAdvancedExtraction(
    url: string,
    platform: string,
    config: AdvancedScrapingConfig,
    searchParams: any
  ): Promise<AdvancedScrapingResult> {
    const startTime = Date.now();
    let retryCount = 0;
    
    while (retryCount <= (config.retryAttempts || 2)) {
      try {
        const params = new URLSearchParams({
          api_key: config.apiKey,
          url: url,
          render: config.renderJs.toString(),
          format: config.format,
          ...(config.premium && { premium: 'true' }),
          ...(config.country && { country_code: config.country }),
          ...(config.sessionId && { session_number: config.sessionId })
        });

        // Add mode-specific parameters
        if (config.mode === 'stealth') {
          params.append('residential', 'true');
          params.append('keep_headers', 'true');
        } else if (config.mode === 'deep') {
          params.append('premium', 'true');
          params.append('keep_headers', 'true');
        }

        const response = await fetch(`${this.BASE_URL}/?${params.toString()}`);
        const responseTime = Date.now() - startTime;

        if (!response.ok) {
          throw new Error(`ScraperAPI request failed: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const creditsUsed = this.CREDIT_COSTS[config.mode];
        
        // Advanced entity extraction
        const entities = this.extractEntitiesAdvanced(html, platform, searchParams);

        return {
          success: true,
          url,
          html,
          entities,
          metadata: {
            statusCode: response.status,
            responseTime,
            proxyCountry: response.headers.get('scraperapi-proxy-country') || 'unknown',
            creditsUsed,
            costUSD: creditsUsed * 0.001,
            retryCount,
            bypassedCaptcha: html.toLowerCase().includes('captcha') === false
          }
        };

      } catch (error) {
        retryCount++;
        if (retryCount > (config.retryAttempts || 2)) {
          return {
            success: false,
            url,
            entities: [],
            metadata: {
              statusCode: 0,
              responseTime: Date.now() - startTime,
              proxyCountry: 'unknown',
              creditsUsed: 0,
              costUSD: 0,
              retryCount,
              bypassedCaptcha: false
            },
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
        
        // Exponential backoff for retries
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Unexpected end of retry loop');
  }

  /**
   * Generate optimized URLs for skip tracing platforms
   */
  private static generateSkipTracingUrls(searchParams: {
    name: string;
    city?: string;
    state?: string;
    phone?: string;
    email?: string;
    address?: string;
    age?: string;
  }): { platform: string; url: string; priority: number }[] {
    const encodedName = encodeURIComponent(searchParams.name);
    const urls: { platform: string; url: string; priority: number }[] = [];

    // WhitePages - Most comprehensive
    if (searchParams.city && searchParams.state) {
      const location = `${searchParams.city.replace(/\s+/g, '-')}-${searchParams.state}`.toLowerCase();
      urls.push({
        platform: 'whitepages',
        url: `https://www.whitepages.com/name/${encodedName}/${encodeURIComponent(location)}`,
        priority: 1
      });
    }

    // TruePeopleSearch - Excellent for addresses
    if (searchParams.city && searchParams.state) {
      urls.push({
        platform: 'truepeoplesearch',
        url: `https://www.truepeoplesearch.com/results?name=${encodedName}&citystatezip=${encodeURIComponent(`${searchParams.city} ${searchParams.state}`)}`,
        priority: 1
      });
    }

    // FastPeopleSearch - Good for relatives
    urls.push({
      platform: 'fastpeoplesearch',
      url: `https://www.fastpeoplesearch.com/search/people/${encodedName}${searchParams.city && searchParams.state ? `/${encodeURIComponent(`${searchParams.city}-${searchParams.state}`)}` : ''}`,
      priority: 2
    });

    // Spokeo - Social profiles and age data
    const spokeoUrl = searchParams.city && searchParams.state 
      ? `https://www.spokeo.com/search?q=${encodedName}&citystate=${encodeURIComponent(`${searchParams.city}, ${searchParams.state}`)}`
      : `https://www.spokeo.com/search?q=${encodedName}`;
    
    urls.push({
      platform: 'spokeo',
      url: spokeoUrl,
      priority: 2
    });

    // BeenVerified - Background data
    if (searchParams.city && searchParams.state) {
      urls.push({
        platform: 'beenverified',
        url: `https://www.beenverified.com/people/${encodedName}/${encodeURIComponent(`${searchParams.city}-${searchParams.state}`)}`,
        priority: 2
      });
    }

    return urls.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Advanced entity extraction with platform-specific parsing
   */
  private static extractEntitiesAdvanced(
    html: string,
    platform: string,
    searchParams: any
  ): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Platform-specific extraction patterns
    const extractors = {
      whitepages: this.extractFromWhitePagesAdvanced,
      truepeoplesearch: this.extractFromTruePeopleSearchAdvanced,
      fastpeoplesearch: this.extractFromFastPeopleSearchAdvanced,
      spokeo: this.extractFromSpokeoAdvanced,
      beenverified: this.extractFromBeenVerifiedAdvanced
    };

    const extractor = extractors[platform as keyof typeof extractors];
    if (extractor) {
      return extractor(html, searchParams);
    }

    // Generic extraction fallback
    return this.extractGenericAdvanced(html, platform, searchParams);
  }

  /**
   * WhitePages advanced extraction
   */
  private static extractFromWhitePagesAdvanced(html: string, searchParams: any): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Phone number extraction with multiple formats
    const phonePatterns = [
      { pattern: /\(\d{3}\)\s*\d{3}-\d{4}/g, confidence: 90 },
      { pattern: /\d{3}-\d{3}-\d{4}/g, confidence: 85 },
      { pattern: /\d{3}\.\d{3}\.\d{4}/g, confidence: 80 }
    ];

    phonePatterns.forEach(({ pattern, confidence }) => {
      const matches = html.match(pattern) || [];
      matches.forEach(phone => {
        entities.push({
          type: 'phone',
          value: phone.trim(),
          confidence,
          source: 'WhitePages',
          context: 'Contact information',
          verified: true
        });
      });
    });

    // Address extraction with current/previous indicators
    const addressPattern = /(?:Current|Previous)?\s*(?:Address|Residence)[:\s]*([^<\n]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Ct|Court|Way|Pl|Place)[^<\n]*\d{5}(?:-\d{4})?)/gi;
    const addressMatches = html.match(addressPattern) || [];
    
    addressMatches.forEach(match => {
      const isCurrent = match.toLowerCase().includes('current');
      const address = match.replace(/^(?:Current|Previous)?\s*(?:Address|Residence)[:\s]*/i, '').trim();
      
      entities.push({
        type: 'address',
        value: address,
        confidence: isCurrent ? 90 : 75,
        source: 'WhitePages',
        context: isCurrent ? 'Current residence' : 'Previous residence',
        verified: true,
        metadata: { isCurrent }
      });
    });

    return entities;
  }

  /**
   * Generic advanced extraction
   */
  private static extractGenericAdvanced(html: string, platform: string, searchParams: any): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Basic phone extraction
    const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
    const phoneMatches = html.match(phoneRegex) || [];
    
    phoneMatches.slice(0, 3).forEach(phone => {
      entities.push({
        type: 'phone',
        value: phone.trim(),
        confidence: 60,
        source: platform,
        context: 'Generic extraction'
      });
    });

    // Email extraction
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatches = html.match(emailRegex) || [];
    
    emailMatches.slice(0, 2).forEach(email => {
      if (!email.includes('example.com') && !email.includes('noreply')) {
        entities.push({
          type: 'email',
          value: email,
          confidence: 55,
          source: platform,
          context: 'Generic extraction'
        });
      }
    });

    return entities;
  }

  // Placeholder methods for other platform extractors
  private static extractFromTruePeopleSearchAdvanced(html: string, searchParams: any): ExtractedEntity[] {
    return this.extractGenericAdvanced(html, 'truepeoplesearch', searchParams);
  }

  private static extractFromFastPeopleSearchAdvanced(html: string, searchParams: any): ExtractedEntity[] {
    return this.extractGenericAdvanced(html, 'fastpeoplesearch', searchParams);
  }

  private static extractFromSpokeoAdvanced(html: string, searchParams: any): ExtractedEntity[] {
    return this.extractGenericAdvanced(html, 'spokeo', searchParams);
  }

  private static extractFromBeenVerifiedAdvanced(html: string, searchParams: any): ExtractedEntity[] {
    return this.extractGenericAdvanced(html, 'beenverified', searchParams);
  }

  /**
   * Get comprehensive credit information
   */
  private static async getCreditInfo(apiKey: string) {
    try {
      const response = await fetch(`${this.BASE_URL}/account?api_key=${apiKey}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return {
        remaining: data.requestCount || data.remainingRequests || data.credits || 0,
        total: data.requestLimit || data.totalRequests || data.maxCredits || 0
      };
    } catch (error) {
      console.error('Error fetching credit info:', error);
      return null;
    }
  }
}