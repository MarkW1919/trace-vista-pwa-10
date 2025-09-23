/**
 * ScraperAPI Integration Service
 * Provides advanced web scraping capabilities with proxy rotation and CAPTCHA bypass
 */

export interface ScraperAPIConfig {
  apiKey: string;
  mode: 'light' | 'standard' | 'deep' | 'stealth';
  renderJs: boolean;
  format: 'html' | 'json';
  country?: string;
  premium?: boolean;
  sessionNumber?: number;
}

export interface ScrapingResult {
  success: boolean;
  url: string;
  html?: string;
  json?: any;
  statusCode: number;
  cost: number;
  credits: number;
  error?: string;
  metadata?: {
    responseTime: number;
    proxyCountry: string;
    renderingEngine?: string;
  };
}

export interface BatchScrapingRequest {
  urls: string[];
  config: Partial<ScraperAPIConfig>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface CreditInfo {
  remaining: number;
  total: number;
  resetDate: string;
  dailyUsage: number;
  monthlyUsage: number;
}

export class ScraperAPIService {
  private static readonly BASE_URL = 'https://api.scraperapi.com';
  private static readonly CREDIT_COSTS = {
    light: 1,     // Basic scraping
    standard: 10,  // JS rendering
    deep: 25,     // Premium proxies + JS
    stealth: 50   // Residential proxies + advanced features
  };

  // Cost tracking
  private static COST_STORAGE = 'scraperapi_costs';
  private static CREDIT_STORAGE = 'scraperapi_credits';

  /**
   * Scrape a single URL with ScraperAPI
   */
  static async scrapeUrl(
    url: string, 
    config: Partial<ScraperAPIConfig> = {}
  ): Promise<ScrapingResult> {
    try {
      const defaultConfig: ScraperAPIConfig = {
        apiKey: '',
        mode: 'standard',
        renderJs: true,
        format: 'html',
        ...config
      };

      const params = new URLSearchParams({
        api_key: defaultConfig.apiKey,
        url: url,
        render: defaultConfig.renderJs.toString(),
        format: defaultConfig.format,
        ...(defaultConfig.country && { country_code: defaultConfig.country }),
        ...(defaultConfig.premium && { premium: 'true' }),
        ...(defaultConfig.sessionNumber && { session_number: defaultConfig.sessionNumber.toString() })
      });

      // Add mode-specific parameters
      if (defaultConfig.mode === 'stealth') {
        params.append('residential', 'true');
        params.append('premium', 'true');
        params.append('keep_headers', 'true');
      } else if (defaultConfig.mode === 'deep') {
        params.append('premium', 'true');
        params.append('keep_headers', 'true');
      }

      const startTime = Date.now();
      const response = await fetch(`${this.BASE_URL}/?${params.toString()}`);
      const responseTime = Date.now() - startTime;
      
      const creditsUsed = this.CREDIT_COSTS[defaultConfig.mode];
      this.updateCreditTracking(creditsUsed);

      if (!response.ok) {
        throw new Error(`ScraperAPI request failed: ${response.status} ${response.statusText}`);
      }

      const data = defaultConfig.format === 'json' ? await response.json() : await response.text();
      
      return {
        success: true,
        url,
        [defaultConfig.format]: data,
        statusCode: response.status,
        cost: creditsUsed * 0.001, // Approximate cost in USD
        credits: creditsUsed,
        metadata: {
          responseTime,
          proxyCountry: response.headers.get('scraperapi-proxy-country') || 'unknown',
          renderingEngine: defaultConfig.renderJs ? 'chrome' : 'none'
        }
      };

    } catch (error) {
      return {
        success: false,
        url,
        statusCode: 0,
        cost: 0,
        credits: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Batch scrape multiple URLs
   */
  static async batchScrape(request: BatchScrapingRequest): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];
    const delay = this.getDelayForPriority(request.priority);

    for (const url of request.urls) {
      const result = await this.scrapeUrl(url, request.config);
      results.push(result);
      
      // Rate limiting between requests
      if (request.urls.indexOf(url) < request.urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  /**
   * Scrape social media profiles with optimized settings
   */
  static async scrapeSocialMedia(
    platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter',
    profileUrl: string,
    apiKey: string
  ): Promise<ScrapingResult> {
    const platformConfigs = {
      linkedin: {
        mode: 'stealth' as const,
        renderJs: true,
        premium: true,
        country: 'US'
      },
      facebook: {
        mode: 'deep' as const,
        renderJs: true,
        premium: true,
        sessionNumber: Math.floor(Math.random() * 100000)
      },
      instagram: {
        mode: 'stealth' as const,
        renderJs: true,
        premium: true,
        country: 'US'
      },
      twitter: {
        mode: 'standard' as const,
        renderJs: true,
        premium: false
      }
    };

    return this.scrapeUrl(profileUrl, {
      apiKey,
      ...platformConfigs[platform]
    });
  }

  /**
   * Scrape people search websites with anti-detection
   */
  static async scrapePeopleSearchSite(
    siteType: 'whitepages' | 'spokeo' | 'truepeoplesearch' | 'fastpeoplesearch',
    searchUrl: string,
    apiKey: string
  ): Promise<ScrapingResult> {
    const siteConfigs = {
      whitepages: {
        mode: 'stealth' as const,
        renderJs: true,
        premium: true,
        country: 'US',
        sessionNumber: Math.floor(Math.random() * 10000)
      },
      spokeo: {
        mode: 'deep' as const,
        renderJs: true,
        premium: true,
        sessionNumber: Math.floor(Math.random() * 10000)
      },
      truepeoplesearch: {
        mode: 'standard' as const,
        renderJs: true,
        premium: false
      },
      fastpeoplesearch: {
        mode: 'standard' as const,
        renderJs: false,
        premium: false
      }
    };

    return this.scrapeUrl(searchUrl, {
      apiKey,
      ...siteConfigs[siteType]
    });
  }

  /**
   * Get current credit information
   */
  static async getCreditInfo(apiKey: string): Promise<CreditInfo | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/account?api_key=${apiKey}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch credit info');
      }

      const data = await response.json();
      const creditInfo: CreditInfo = {
        remaining: data.requestCount || 0,
        total: data.requestLimit || 0,
        resetDate: data.resetDate || new Date().toISOString(),
        dailyUsage: this.getDailyUsage(),
        monthlyUsage: this.getMonthlyUsage()
      };

      localStorage.setItem(this.CREDIT_STORAGE, JSON.stringify(creditInfo));
      return creditInfo;

    } catch (error) {
      console.error('Error fetching ScraperAPI credit info:', error);
      return null;
    }
  }

  /**
   * Cost and credit tracking
   */
  private static updateCreditTracking(credits: number): void {
    const current = this.getCostTracking();
    const now = new Date();
    
    // Reset daily/monthly if needed
    if (this.isNewDay(current.lastUpdate)) {
      current.dailyUsage = 0;
    }
    if (this.isNewMonth(current.lastUpdate)) {
      current.monthlyUsage = 0;
    }
    
    current.totalCredits += credits;
    current.dailyUsage += credits;
    current.monthlyUsage += credits;
    current.lastUpdate = now.toISOString();
    
    localStorage.setItem(this.COST_STORAGE, JSON.stringify(current));
  }

  static getCostTracking(): {
    totalCredits: number;
    dailyUsage: number;
    monthlyUsage: number;
    lastUpdate: string;
  } {
    const stored = localStorage.getItem(this.COST_STORAGE);
    if (!stored) {
      return {
        totalCredits: 0,
        dailyUsage: 0,
        monthlyUsage: 0,
        lastUpdate: new Date().toISOString()
      };
    }
    return JSON.parse(stored);
  }

  private static getDailyUsage(): number {
    return this.getCostTracking().dailyUsage;
  }

  private static getMonthlyUsage(): number {
    return this.getCostTracking().monthlyUsage;
  }

  private static isNewDay(lastUpdate: string): boolean {
    const last = new Date(lastUpdate);
    const now = new Date();
    return last.getDate() !== now.getDate() || 
           last.getMonth() !== now.getMonth() || 
           last.getFullYear() !== now.getFullYear();
  }

  private static isNewMonth(lastUpdate: string): boolean {
    const last = new Date(lastUpdate);
    const now = new Date();
    return last.getMonth() !== now.getMonth() || 
           last.getFullYear() !== now.getFullYear();
  }

  private static getDelayForPriority(priority: string): number {
    const delays = {
      urgent: 100,
      high: 200,
      medium: 500,
      low: 1000
    };
    return delays[priority as keyof typeof delays] || 500;
  }

  /**
   * Test ScraperAPI key validity
   */
  static async testApiKey(apiKey: string): Promise<{
    valid: boolean;
    credits?: number;
    error?: string;
  }> {
    try {
      const creditInfo = await this.getCreditInfo(apiKey);
      
      if (creditInfo) {
        return {
          valid: true,
          credits: creditInfo.remaining
        };
      } else {
        return {
          valid: false,
          error: 'Failed to validate API key'
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate optimized search URLs for different platforms
   */
  static generateSearchUrls(
    name: string,
    location?: string,
    phone?: string,
    email?: string
  ): { platform: string; url: string }[] {
    const encodedName = encodeURIComponent(name);
    const encodedLocation = location ? encodeURIComponent(location) : '';
    const urls: { platform: string; url: string }[] = [];

    // WhitePages
    if (location) {
      urls.push({
        platform: 'whitepages',
        url: `https://www.whitepages.com/name/${encodedName}/${encodedLocation}`
      });
    }

    // Spokeo
    urls.push({
      platform: 'spokeo',
      url: `https://www.spokeo.com/${encodedName}`
    });

    // TruePeopleSearch
    if (location) {
      const [city, state] = location.split(',').map(s => s.trim());
      if (city && state) {
        urls.push({
          platform: 'truepeoplesearch',
          url: `https://www.truepeoplesearch.com/results?name=${encodedName}&citystatezip=${encodeURIComponent(city + ' ' + state)}`
        });
      }
    }

    // FastPeopleSearch
    urls.push({
      platform: 'fastpeoplesearch',
      url: `https://www.fastpeoplesearch.com/${encodedName}`
    });

    // LinkedIn
    urls.push({
      platform: 'linkedin',
      url: `https://www.linkedin.com/search/results/people/?keywords=${encodedName}`
    });

    // Facebook (public search)
    urls.push({
      platform: 'facebook',
      url: `https://www.facebook.com/public/${encodedName}`
    });

    return urls;
  }
}