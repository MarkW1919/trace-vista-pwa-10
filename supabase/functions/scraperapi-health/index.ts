import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScraperAPIHealthResponse {
  success: boolean;
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: {
    apiConnection: boolean;
    creditsAvailable: boolean;
    responseTime: number;
  };
  credits?: {
    remaining: number;
    total: number;
    resetDate: string;
  };
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { scraperApiKey } = await req.json();

    if (!scraperApiKey) {
      return Response.json(
        {
          success: false,
          status: 'unhealthy',
          checks: {
            apiConnection: false,
            creditsAvailable: false,
            responseTime: 0
          },
          error: 'ScraperAPI key not provided'
        } as ScraperAPIHealthResponse,
        { headers: corsHeaders }
      );
    }

    // Test ScraperAPI connection with a simple request
    const startTime = Date.now();
    
    try {
      const testUrl = 'https://httpbin.org/html';
      const params = new URLSearchParams({
        api_key: scraperApiKey,
        url: testUrl,
        render: 'false',
        format: 'html'
      });

      const response = await fetch(`https://api.scraperapi.com/?${params.toString()}`);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`ScraperAPI returned ${response.status}: ${response.statusText}`);
      }

      // Get account info to check credits
      const accountResponse = await fetch(`https://api.scraperapi.com/account?api_key=${scraperApiKey}`);
      
      let creditsInfo = null;
      let creditsAvailable = false;

      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        const requestCount = accountData.requestCount || 0;
        const requestLimit = accountData.requestLimit || accountData.totalRequests || accountData.maxCredits || 0;
        const remaining = Math.max(0, requestLimit - requestCount);
        
        creditsInfo = {
          remaining,
          total: requestLimit,
          resetDate: accountData.resetDate || accountData.billingCycleEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        creditsAvailable = remaining > 0;
      }

      const healthResponse: ScraperAPIHealthResponse = {
        success: true,
        status: creditsAvailable ? 'healthy' : 'degraded',
        checks: {
          apiConnection: true,
          creditsAvailable,
          responseTime
        },
        ...(creditsInfo && { credits: creditsInfo })
      };

      return Response.json(healthResponse, { headers: corsHeaders });

    } catch (apiError) {
      const responseTime = Date.now() - startTime;
      
      return Response.json(
        {
          success: false,
          status: 'unhealthy',
          checks: {
            apiConnection: false,
            creditsAvailable: false,
            responseTime
          },
          error: apiError instanceof Error ? apiError.message : 'Unknown API error'
        } as ScraperAPIHealthResponse,
        { headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('ScraperAPI health check error:', error);
    
    return Response.json(
      {
        success: false,
        status: 'unhealthy',
        checks: {
          apiConnection: false,
          creditsAvailable: false,
          responseTime: 0
        },
        error: error instanceof Error ? error.message : 'Health check failed'
      } as ScraperAPIHealthResponse,
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
});