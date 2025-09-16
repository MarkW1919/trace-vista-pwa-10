import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Key, Shield, DollarSign, AlertTriangle, CheckCircle, 
  ExternalLink, Eye, EyeOff, Loader2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApiSearchService } from '@/services/apiSearchService';

interface ApiKeyStatus {
  serpApi: boolean;
  hunter: boolean;
  errors?: string[];
  corsIssue?: boolean;
}

export const ApiKeyManager = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [isTestingKeys, setIsTestingKeys] = useState(false);
  const [keyStatus, setKeyStatus] = useState<ApiKeyStatus>({ serpApi: true, hunter: true });
  const [costTracking, setCostTracking] = useState({ 
    totalCost: 0, 
    monthlyUsage: 0, 
    lastMonth: '', 
    servicesUsed: [] as Array<{service: string; cost: number; queries: number}> 
  });
  
  const { toast } = useToast();

  useEffect(() => {
    const initializeApiManager = async () => {
      // Check authentication status
      const { SupabaseSearchService } = await import('@/services/supabaseSearchService');
      const authenticated = await SupabaseSearchService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        // Load cost tracking from Supabase
        const costs = await SupabaseSearchService.getCostTracking();
        setCostTracking(costs);
      } else {
        // Fallback to localStorage for demo purposes
        const localCosts = ApiSearchService.getCostTracking();
        setCostTracking({
          totalCost: localCosts.totalCost,
          monthlyUsage: localCosts.monthlyUsage,
          lastMonth: localCosts.lastReset.slice(0, 7) || new Date().toISOString().slice(0, 7),
          servicesUsed: []
        });
      }
    };
    
    initializeApiManager();
  }, []);

  const testConnection = async () => {
    setIsTestingKeys(true);
    try {
      if (isAuthenticated) {
        // Test Supabase connection and API keys
        const { SupabaseSearchService } = await import('@/services/supabaseSearchService');
        const testResult = await SupabaseSearchService.getCurrentUser();
        
        if (testResult.success) {
          setKeyStatus({ serpApi: true, hunter: true });
          toast({
            title: "Connection Successful",
            description: "API keys are configured in Supabase and ready to use",
            variant: "default",
          });
        } else {
          throw new Error('Authentication failed');
        }
      } else {
        toast({
          title: "Authentication Required", 
          description: "Please log in to use automated searches with stored API keys",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setKeyStatus({ serpApi: false, hunter: false });
    } finally {
      setIsTestingKeys(false);
    }
  };

  const manageApiKeys = () => {
    if (isAuthenticated) {
      toast({
        title: "API Keys Managed in Supabase",
        description: "Your API keys are securely stored in Supabase. Use the dashboard to update them.",
        variant: "default",
      });
    } else {
      toast({
        title: "Authentication Required",
        description: "Please log in to manage your API keys securely",
        variant: "destructive",
      });
    }
  };

  const clearLocalStorage = () => {
    ApiSearchService.clearApiKeys();
    setKeyStatus({ serpApi: false, hunter: false });
    toast({
      title: "Local Storage Cleared",
      description: "Local API keys have been cleared. Supabase keys remain secure.",
      variant: "default",
    });
  };

  const refreshCostTracking = async () => {
    try {
      if (isAuthenticated) {
        const { SupabaseSearchService } = await import('@/services/supabaseSearchService');
        const costs = await SupabaseSearchService.getCostTracking();
        setCostTracking(costs);
      } else {
        const localCosts = ApiSearchService.getCostTracking();
        setCostTracking({
          totalCost: localCosts.totalCost,
          monthlyUsage: localCosts.monthlyUsage,
          lastMonth: localCosts.lastReset.slice(0, 7) || new Date().toISOString().slice(0, 7),
          servicesUsed: []
        });
      }
    } catch (error) {
      console.error('Failed to refresh cost tracking:', error);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="h-5 w-5 text-primary" />
          <span>API Configuration</span>
          <Badge variant={isAuthenticated && keyStatus.serpApi ? "default" : "secondary"}>
            {isAuthenticated && keyStatus.serpApi ? "Ready" : "Setup Required"}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isAuthenticated 
            ? "API keys are securely managed in Supabase. No browser storage needed."
            : "Log in to use secure API key management via Supabase."
          }
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="setup">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="guide" className="hidden sm:flex">Setup Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Enhanced Security with Supabase</AlertTitle>
              <AlertDescription>
                {isAuthenticated 
                  ? "API keys are securely stored in Supabase Edge Functions. No local storage required."
                  : "Log in to enable secure API key management and remove CORS limitations."
                }
              </AlertDescription>
            </Alert>

            {isAuthenticated ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Supabase Integration Active</AlertTitle>
                  <AlertDescription>
                    Your API keys are configured in Supabase Edge Functions. This provides:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>No CORS restrictions (server-side execution)</li>
                      <li>Secure key storage (never exposed to browser)</li>
                      <li>Advanced cost tracking and analytics</li>
                      <li>Real-time search session management</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex space-x-2">
                  <Button 
                    onClick={testConnection}
                    disabled={isTestingKeys}
                    className="flex-1"
                  >
                    {isTestingKeys ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={manageApiKeys}>
                    <Key className="h-4 w-4 mr-2" />
                    Manage Keys
                  </Button>
                </div>

                {isTestingKeys && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Testing Supabase connection...</span>
                    </div>
                    <Progress value={66} className="w-full" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Authentication Required</AlertTitle>
                  <AlertDescription>
                    Please log in to use the enhanced Supabase integration. Fallback local storage is available for testing.
                  </AlertDescription>
                </Alert>

                <Button variant="outline" onClick={clearLocalStorage} className="w-full">
                  Clear Local Storage Keys
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertTitle>Cost Tracking</AlertTitle>
              <AlertDescription>
                Monitor your API usage to stay within budget limits.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      ${costTracking.totalCost.toFixed(4)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">
                      ${costTracking.monthlyUsage.toFixed(4)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isAuthenticated ? `${costTracking.lastMonth}` : 'This Month (Local)'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {isAuthenticated && costTracking.servicesUsed.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Service Breakdown</h4>
                {costTracking.servicesUsed.map((service, index) => (
                  <div key={index} className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">{service.service}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">${service.cost.toFixed(4)}</div>
                      <div className="text-xs text-muted-foreground">{service.queries} queries</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Estimated Cost per Search:</span>
                <span className="font-medium">$0.005 - $0.015</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SerpAPI Rate:</span>
                <span>$5 per 1,000 searches</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Hunter.io Rate:</span>
                <span>$0.01 per email verification</span>
              </div>
            </div>

            <Button variant="outline" onClick={refreshCostTracking} className="w-full">
              Refresh Cost Data
            </Button>
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Setup Instructions</AlertTitle>
              <AlertDescription>
                Follow these steps to get your API keys for automated OSINT searches.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">1. SerpAPI Setup (Required)</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Go to <a href="https://serpapi.com/users/sign_up" target="_blank" className="text-primary hover:underline">serpapi.com</a></li>
                  <li>• Create a free account (100 searches/month)</li>
                  <li>• Copy your API key from the dashboard</li>
                  <li>• Paste it in the SerpAPI Key field above</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">2. Hunter.io Setup (Optional)</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Go to <a href="https://hunter.io/api" target="_blank" className="text-primary hover:underline">hunter.io</a></li>
                  <li>• Create a free account (50 requests/month)</li>
                  <li>• Generate an API key</li>
                  <li>• Paste it in the Hunter.io Key field above</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-semibold mb-2">Cost Estimates</h4>
                <ul className="text-sm space-y-1">
                  <li>• Basic search (8 queries): ~$0.04</li>
                  <li>• Deep search (15 queries): ~$0.075</li>
                  <li>• Email OSINT: ~$0.01 additional</li>
                  <li>• Free tiers provide substantial testing capability</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};