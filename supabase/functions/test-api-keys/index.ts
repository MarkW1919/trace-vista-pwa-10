import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Get API keys from Supabase secrets
    const serpApiKey = Deno.env.get('SERPAPI_API_KEY');
    const hunterApiKey = Deno.env.get('HUNTER_API_KEY');

    console.log('Testing API keys for user:', user.id);

    const results = {
      serpApi: {
        available: !!serpApiKey,
        keyLength: serpApiKey?.length || 0,
        valid: false,
        error: null as string | null,
        testResults: null as any
      },
      hunter: {
        available: !!hunterApiKey,
        keyLength: hunterApiKey?.length || 0,
        valid: false,
        error: null as string | null,
        testResults: null as any
      }
    };

    // Test SerpAPI
    if (serpApiKey) {
      console.log('Testing SerpAPI key...');
      try {
        // Simple test query
        const testParams = new URLSearchParams({
          engine: 'google',
          q: 'test search',
          api_key: serpApiKey,
          num: '1'
        });

        const serpResponse = await fetch(`https://serpapi.com/search?${testParams}`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Supabase-Edge-Function/1.0'
          }
        });

        const serpData = await serpResponse.json();
        
        if (serpResponse.ok && !serpData.error) {
          results.serpApi.valid = true;
          results.serpApi.testResults = {
            status: serpResponse.status,
            searchId: serpData.search_metadata?.id,
            credits: serpData.search_metadata?.total_time_taken,
            resultsCount: serpData.organic_results?.length || 0
          };
          console.log('SerpAPI test successful:', results.serpApi.testResults);
        } else {
          results.serpApi.error = serpData.error || `HTTP ${serpResponse.status}: ${serpResponse.statusText}`;
          console.error('SerpAPI test failed:', results.serpApi.error);
        }
      } catch (error) {
        results.serpApi.error = error instanceof Error ? error.message : 'Unknown error';
        console.error('SerpAPI test exception:', error);
      }
    } else {
      results.serpApi.error = 'API key not found in Supabase secrets';
    }

    // Test Hunter.io
    if (hunterApiKey) {
      console.log('Testing Hunter.io key...');
      try {
        const hunterResponse = await fetch(
          `https://api.hunter.io/v2/account?api_key=${hunterApiKey}`,
          {
            method: 'GET',
            headers: {
              'User-Agent': 'Supabase-Edge-Function/1.0'
            }
          }
        );

        const hunterData = await hunterResponse.json();
        
        if (hunterResponse.ok && !hunterData.errors) {
          results.hunter.valid = true;
          results.hunter.testResults = {
            status: hunterResponse.status,
            planName: hunterData.data?.plan_name,
            requestsUsed: hunterData.data?.requests?.used,
            requestsAvailable: hunterData.data?.requests?.available,
            resetDate: hunterData.data?.reset_date
          };
          console.log('Hunter.io test successful:', results.hunter.testResults);
        } else {
          results.hunter.error = hunterData.errors?.[0]?.details || `HTTP ${hunterResponse.status}: ${hunterResponse.statusText}`;
          console.error('Hunter.io test failed:', results.hunter.error);
        }
      } catch (error) {
        results.hunter.error = error instanceof Error ? error.message : 'Unknown error';
        console.error('Hunter.io test exception:', error);
      }
    } else {
      results.hunter.error = 'API key not found in Supabase secrets';
    }

    // Log comprehensive results
    console.log('API Key Test Results:', {
      serpApiValid: results.serpApi.valid,
      hunterValid: results.hunter.valid,
      errors: {
        serpApi: results.serpApi.error,
        hunter: results.hunter.error
      }
    });

    return new Response(JSON.stringify({
      success: true,
      userId: user.id,
      results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API key test error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});