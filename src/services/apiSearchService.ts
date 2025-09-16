interface ApiSearchParams {
  name: string;
  location?: string;
  phone?: string;
  email?: string;
  dob?: string;
  address?: string;
}

interface SearchApiResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  confidence: number;
  relevanceScore: number;
  timestamp: Date;
  extractedEntities?: any[];
}

interface ApiSearchResponse {
  success: boolean;
  results: SearchApiResult[];
  cost: number;
  totalResults: number;
  error?: string;
}

interface EmailOsintResult {
  email: string;
  platforms: string[];
  breaches: number;
  confidence: number;
  domain_info?: {
    registrar: string;
    created_date: string;
    expires_date: string;
  };
}

export class ApiSearchService {
  private static SERPAPI_KEY_STORAGE = 'serpapi_key';
  private static HUNTER_KEY_STORAGE = 'hunter_key';
  private static COST_TRACKING_STORAGE = 'api_costs';

  // API Key Management
  static saveApiKeys(serpApiKey: string, hunterKey?: string): void {
    localStorage.setItem(this.SERPAPI_KEY_STORAGE, serpApiKey);
    if (hunterKey) {
      localStorage.setItem(this.HUNTER_KEY_STORAGE, hunterKey);
    }
  }

  static getApiKeys(): { serpApiKey: string | null; hunterKey: string | null } {
    return {
      serpApiKey: localStorage.getItem(this.SERPAPI_KEY_STORAGE),
      hunterKey: localStorage.getItem(this.HUNTER_KEY_STORAGE)
    };
  }

  static clearApiKeys(): void {
    localStorage.removeItem(this.SERPAPI_KEY_STORAGE);
    localStorage.removeItem(this.HUNTER_KEY_STORAGE);
  }

  // Cost Tracking
  static getCostTracking(): { totalCost: number; monthlyUsage: number; lastReset: string } {
    const stored = localStorage.getItem(this.COST_TRACKING_STORAGE);
    if (!stored) {
      return { totalCost: 0, monthlyUsage: 0, lastReset: new Date().toISOString() };
    }
    return JSON.parse(stored);
  }

  static updateCostTracking(cost: number): void {
    const current = this.getCostTracking();
    const now = new Date();
    const lastReset = new Date(current.lastReset);
    
    // Reset monthly usage if it's a new month
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      current.monthlyUsage = 0;
      current.lastReset = now.toISOString();
    }
    
    current.totalCost += cost;
    current.monthlyUsage += cost;
    
    localStorage.setItem(this.COST_TRACKING_STORAGE, JSON.stringify(current));
  }

  // SerpAPI Search
  static async performSerpApiSearch(query: string, location?: string): Promise<ApiSearchResponse> {
    const { serpApiKey } = this.getApiKeys();
    if (!serpApiKey) {
      return { success: false, results: [], cost: 0, totalResults: 0, error: 'SerpAPI key not found' };
    }

    try {
      const params = new URLSearchParams({
        engine: 'google',
        q: query,
        api_key: serpApiKey,
        num: '20',
        ...(location && { location: location })
      });

      const response = await fetch(`https://serpapi.com/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'SerpAPI request failed');
      }

      const results: SearchApiResult[] = (data.organic_results || []).map((result: any, index: number) => ({
        id: `serpapi-${Date.now()}-${index}`,
        title: result.title || 'No title',
        snippet: result.snippet || 'No snippet available',
        url: result.link || '#',
        source: result.displayed_link || 'Unknown',
        confidence: this.calculateResultConfidence(result, query),
        relevanceScore: this.calculateRelevanceScore(result, query),
        timestamp: new Date(),
        extractedEntities: []
      }));

      // SerpAPI costs approximately $5 per 1000 searches
      const searchCost = 0.005;
      this.updateCostTracking(searchCost);

      return {
        success: true,
        results,
        cost: searchCost,
        totalResults: data.search_information?.total_results || results.length,
        error: undefined
      };

    } catch (error) {
      console.error('SerpAPI search error:', error);
      return {
        success: false,
        results: [],
        cost: 0,
        totalResults: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Hunter.io Email OSINT
  static async performEmailOsint(email: string): Promise<{ success: boolean; result?: EmailOsintResult; cost: number; error?: string }> {
    const { hunterKey } = this.getApiKeys();
    if (!hunterKey) {
      return { success: false, cost: 0, error: 'Hunter.io key not found' };
    }

    try {
      const response = await fetch(`https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${hunterKey}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.details || 'Hunter.io request failed');
      }

      const result: EmailOsintResult = {
        email: email,
        platforms: data.data.sources || [],
        breaches: 0, // Hunter.io doesn't provide breach data directly
        confidence: data.data.score || 0,
        domain_info: data.data.domain ? {
          registrar: data.data.domain.registrar || 'Unknown',
          created_date: data.data.domain.creation_date || 'Unknown',
          expires_date: data.data.domain.expires_date || 'Unknown'
        } : undefined
      };

      // Hunter.io costs vary, approximately $0.01 per verification
      const searchCost = 0.01;
      this.updateCostTracking(searchCost);

      return {
        success: true,
        result,
        cost: searchCost,
        error: undefined
      };

    } catch (error) {
      console.error('Hunter.io email OSINT error:', error);
      return {
        success: false,
        cost: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Comprehensive Search combining multiple APIs
  static async performComprehensiveSearch(params: ApiSearchParams): Promise<ApiSearchResponse> {
    const allResults: SearchApiResult[] = [];
    let totalCost = 0;
    let hasErrors = false;
    const errors: string[] = [];

    // Generate search queries
    const queries = this.generateSearchQueries(params);
    
    // Perform multiple SerpAPI searches
    for (const query of queries) {
      try {
        const response = await this.performSerpApiSearch(query.query, params.location);
        if (response.success) {
          // Add query context to results
          const contextualResults = response.results.map(result => ({
            ...result,
            id: `${query.category}-${result.id}`,
            source: `${result.source} (${query.category})`
          }));
          allResults.push(...contextualResults);
          totalCost += response.cost;
        } else {
          errors.push(`${query.category}: ${response.error}`);
          hasErrors = true;
        }
        
        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errors.push(`${query.category}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        hasErrors = true;
      }
    }

    // Perform email OSINT if email provided
    if (params.email) {
      try {
        const emailResult = await this.performEmailOsint(params.email);
        if (emailResult.success && emailResult.result) {
          // Convert email result to search result format
          allResults.push({
            id: `email-osint-${Date.now()}`,
            title: `Email OSINT: ${emailResult.result.email}`,
            snippet: `Email confidence: ${emailResult.result.confidence}%. Found on ${emailResult.result.platforms.join(', ')}. Domain info available.`,
            url: `mailto:${emailResult.result.email}`,
            source: 'Hunter.io Email OSINT',
            confidence: emailResult.result.confidence,
            relevanceScore: 85,
            timestamp: new Date(),
            extractedEntities: []
          });
          totalCost += emailResult.cost;
        } else if (emailResult.error) {
          errors.push(`Email OSINT: ${emailResult.error}`);
          hasErrors = true;
        }
      } catch (error) {
        errors.push(`Email OSINT: ${error instanceof Error ? error.message : 'Unknown error'}`);
        hasErrors = true;
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueResults = this.deduplicateResults(allResults);
    const sortedResults = uniqueResults.sort((a, b) => 
      (b.confidence + b.relevanceScore) - (a.confidence + a.relevanceScore)
    );

    return {
      success: !hasErrors || allResults.length > 0,
      results: sortedResults,
      cost: totalCost,
      totalResults: sortedResults.length,
      error: hasErrors ? errors.join('; ') : undefined
    };
  }

  // Helper Methods
  private static generateSearchQueries(params: ApiSearchParams): Array<{ query: string; category: string }> {
    const queries: Array<{ query: string; category: string }> = [];
    const { name, location, phone, email, dob, address } = params;

    // Basic identity searches
    queries.push({ query: `"${name}"`, category: 'Basic Identity' });
    
    if (location) {
      queries.push({ query: `"${name}" "${location}"`, category: 'Location-based' });
    }

    // Contact information searches
    if (phone) {
      queries.push({ query: `"${phone}"`, category: 'Phone Lookup' });
      queries.push({ query: `"${name}" "${phone}"`, category: 'Name + Phone' });
    }

    if (email) {
      queries.push({ query: `"${email}"`, category: 'Email Search' });
      queries.push({ query: `"${name}" "${email}"`, category: 'Name + Email' });
    }

    // Address-based searches
    if (address) {
      queries.push({ query: `"${name}" "${address}"`, category: 'Address Search' });
    }

    // Social media searches
    queries.push({ query: `"${name}" site:linkedin.com`, category: 'LinkedIn' });
    queries.push({ query: `"${name}" site:facebook.com`, category: 'Facebook' });
    queries.push({ query: `"${name}" site:twitter.com OR site:x.com`, category: 'Twitter/X' });

    // Professional/business searches
    queries.push({ query: `"${name}" "company" OR "business" OR "work"`, category: 'Professional' });
    
    // Public records
    if (location) {
      queries.push({ query: `"${name}" "court" OR "record" OR "property" "${location}"`, category: 'Public Records' });
    }

    return queries.slice(0, 8); // Limit to 8 queries to control costs
  }

  private static calculateResultConfidence(result: any, query: string): number {
    let confidence = 50; // Base confidence

    // Title relevance
    if (result.title && result.title.toLowerCase().includes(query.toLowerCase())) {
      confidence += 20;
    }

    // Snippet relevance
    if (result.snippet && result.snippet.toLowerCase().includes(query.toLowerCase())) {
      confidence += 15;
    }

    // Domain authority (simplified)
    const domain = result.displayed_link || '';
    if (domain.includes('linkedin.com') || domain.includes('facebook.com')) {
      confidence += 10;
    }

    return Math.min(confidence, 100);
  }

  private static calculateRelevanceScore(result: any, query: string): number {
    const title = (result.title || '').toLowerCase();
    const snippet = (result.snippet || '').toLowerCase();
    const queryLower = query.toLowerCase();

    let score = 0;

    // Exact matches in title
    if (title.includes(queryLower)) score += 30;
    
    // Exact matches in snippet
    if (snippet.includes(queryLower)) score += 20;

    // Partial matches
    const queryWords = queryLower.split(' ');
    queryWords.forEach(word => {
      if (word.length > 2) {
        if (title.includes(word)) score += 5;
        if (snippet.includes(word)) score += 3;
      }
    });

    return Math.min(score, 100);
  }

  private static deduplicateResults(results: SearchApiResult[]): SearchApiResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.title}-${result.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // API Key Format Validation
  static validateApiKeyFormat(serpApiKey: string, hunterKey?: string): { serpApi: boolean; hunter: boolean; errors: string[] } {
    const results = { serpApi: false, hunter: false };
    const errors: string[] = [];

    // SerpAPI key validation (typically 64 character hex string)
    if (serpApiKey) {
      if (serpApiKey.length < 32) {
        errors.push('SerpAPI key appears too short (expected 32+ characters)');
      } else if (!/^[a-fA-F0-9]+$/.test(serpApiKey)) {
        errors.push('SerpAPI key should contain only hexadecimal characters (0-9, a-f)');
      } else {
        results.serpApi = true;
      }
    }

    // Hunter.io key validation (typically 40 character alphanumeric)
    if (hunterKey) {
      if (hunterKey.length < 32) {
        errors.push('Hunter.io key appears too short (expected 32+ characters)');
      } else if (!/^[a-zA-Z0-9]+$/.test(hunterKey)) {
        errors.push('Hunter.io key should contain only alphanumeric characters');
      } else {
        results.hunter = true;
      }
    }

    return { ...results, errors };
  }

  // Test API Keys with CORS-compatible approach
  static async testApiKeys(serpApiKey: string, hunterKey?: string): Promise<{ 
    serpApi: boolean; 
    hunter: boolean; 
    errors: string[]; 
    corsIssue: boolean; 
  }> {
    const formatValidation = this.validateApiKeyFormat(serpApiKey, hunterKey);
    const results = { serpApi: false, hunter: false, errors: [...formatValidation.errors], corsIssue: false };

    // If format validation fails, return early
    if (!formatValidation.serpApi && serpApiKey) {
      return results;
    }

    // Attempt actual API testing with CORS detection
    if (serpApiKey && formatValidation.serpApi) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`https://serpapi.com/search?engine=google&q=test&api_key=${serpApiKey}&num=1`, {
          signal: controller.signal,
          mode: 'cors'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          results.serpApi = true;
        } else if (response.status === 401) {
          results.errors.push('SerpAPI key is invalid - received authentication error');
        } else {
          results.errors.push(`SerpAPI returned error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            results.errors.push('SerpAPI test timed out - this may indicate CORS restrictions');
            results.corsIssue = true;
          } else if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
            results.errors.push('Cannot test SerpAPI key due to browser CORS restrictions');
            results.corsIssue = true;
            // If format is valid but we have CORS issues, assume key might be valid
            results.serpApi = formatValidation.serpApi;
          } else if (error.message.includes('Failed to fetch')) {
            results.errors.push('Cannot reach SerpAPI - check internet connection or CORS restrictions');
            results.corsIssue = true;
            results.serpApi = formatValidation.serpApi; // Assume valid if format is correct
          } else {
            results.errors.push(`SerpAPI test error: ${error.message}`);
          }
        }
      }
    }

    // Test Hunter.io with similar approach
    if (hunterKey && formatValidation.hunter) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`https://api.hunter.io/v2/account?api_key=${hunterKey}`, {
          signal: controller.signal,
          mode: 'cors'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          results.hunter = true;
        } else if (response.status === 401) {
          results.errors.push('Hunter.io key is invalid - received authentication error');
        } else {
          results.errors.push(`Hunter.io returned error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            results.errors.push('Hunter.io test timed out - this may indicate CORS restrictions');
            results.corsIssue = true;
          } else if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
            results.errors.push('Cannot test Hunter.io key due to browser CORS restrictions');
            results.corsIssue = true;
            results.hunter = formatValidation.hunter;
          } else if (error.message.includes('Failed to fetch')) {
            results.errors.push('Cannot reach Hunter.io - check internet connection or CORS restrictions');
            results.corsIssue = true;
            results.hunter = formatValidation.hunter;
          } else {
            results.errors.push(`Hunter.io test error: ${error.message}`);
          }
        }
      }
    }

    return results;
  }
}