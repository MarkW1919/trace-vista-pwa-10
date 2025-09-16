import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TestTube, CheckCircle, XCircle, AlertTriangle, 
  Loader2, Key, Database, Clock, DollarSign 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiTestResults {
  serpApi: {
    available: boolean;
    keyLength: number;
    valid: boolean;
    error: string | null;
    testResults: any;
  };
  hunter: {
    available: boolean;
    keyLength: number;
    valid: boolean;
    error: string | null;
    testResults: any;
  };
}

export const ApiKeyTester = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<ApiTestResults | null>(null);
  const { toast } = useToast();

  const testApiKeys = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-api-keys', {
        body: {}
      });

      if (error) {
        throw new Error(`Test function failed: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'API key test failed');
      }

      setResults(data.results);
      
      const serpStatus = data.results.serpApi.valid ? '✅ Valid' : '❌ Invalid';
      const hunterStatus = data.results.hunter.valid ? '✅ Valid' : '❌ Invalid';
      
      toast({
        title: "API Key Test Complete",
        description: `SerpAPI: ${serpStatus} • Hunter.io: ${hunterStatus}`,
        variant: data.results.serpApi.valid || data.results.hunter.valid ? "default" : "destructive",
      });

    } catch (error) {
      console.error('API key test error:', error);
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TestTube className="h-5 w-5 text-primary" />
          <span>API Key Diagnostics</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test your Supabase-stored API keys to diagnose search issues
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button 
            onClick={testApiKeys} 
            disabled={testing}
            className="flex-1"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Keys...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Run Diagnostic Test
              </>
            )}
          </Button>
        </div>

        {testing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Testing API connections...</span>
            </div>
            <Progress value={50} className="w-full" />
          </div>
        )}

        {results && (
          <div className="space-y-4">
            {/* SerpAPI Results */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center space-x-2">
                    <Key className="h-4 w-4" />
                    <span>SerpAPI</span>
                  </div>
                  <Badge variant={results.serpApi.valid ? "default" : "destructive"}>
                    {results.serpApi.valid ? (
                      <><CheckCircle className="h-3 w-3 mr-1" />Valid</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" />Invalid</>
                    )}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Key Available:</span>
                    <div className="font-medium">
                      {results.serpApi.available ? '✅ Yes' : '❌ No'} 
                      {results.serpApi.available && ` (${results.serpApi.keyLength} chars)`}
                    </div>
                  </div>
                  {results.serpApi.testResults && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="font-medium">{results.serpApi.testResults.status}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Search ID:</span>
                        <div className="font-medium font-mono text-xs">
                          {results.serpApi.testResults.searchId || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Results Found:</span>
                        <div className="font-medium">{results.serpApi.testResults.resultsCount}</div>
                      </div>
                    </>
                  )}
                </div>

                {results.serpApi.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>SerpAPI Error</AlertTitle>
                    <AlertDescription className="font-mono text-xs">
                      {results.serpApi.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Hunter.io Results */}
            <Card className="border-l-4 border-l-accent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>Hunter.io</span>
                  </div>
                  <Badge variant={results.hunter.valid ? "default" : "destructive"}>
                    {results.hunter.valid ? (
                      <><CheckCircle className="h-3 w-3 mr-1" />Valid</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" />Invalid</>
                    )}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Key Available:</span>
                    <div className="font-medium">
                      {results.hunter.available ? '✅ Yes' : '❌ No'}
                      {results.hunter.available && ` (${results.hunter.keyLength} chars)`}
                    </div>
                  </div>
                  {results.hunter.testResults && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Plan:</span>
                        <div className="font-medium">{results.hunter.testResults.planName || 'Free'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Requests Used:</span>
                        <div className="font-medium">
                          {results.hunter.testResults.requestsUsed || 0} / {results.hunter.testResults.requestsAvailable || 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reset Date:</span>
                        <div className="font-medium text-xs">
                          {results.hunter.testResults.resetDate || 'N/A'}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {results.hunter.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Hunter.io Error</AlertTitle>
                    <AlertDescription className="font-mono text-xs">
                      {results.hunter.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Summary & Recommendations */}
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Diagnostic Summary</AlertTitle>
              <AlertDescription>
                {results.serpApi.valid && results.hunter.valid ? (
                  "✅ All API keys are working correctly. Search issues may be due to query complexity or rate limiting."
                ) : results.serpApi.valid ? (
                  "⚠️ SerpAPI is working but Hunter.io has issues. Email OSINT will be limited."
                ) : results.hunter.valid ? (
                  "⚠️ Hunter.io is working but SerpAPI has issues. Main search results will be limited to manual URLs."
                ) : (
                  "❌ Both API keys have issues. Please check your Supabase secrets configuration and API key validity."
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};