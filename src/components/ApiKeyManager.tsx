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
  const [serpApiKey, setSerpApiKey] = useState('');
  const [hunterKey, setHunterKey] = useState('');
  const [showKeys, setShowKeys] = useState(false);
  const [isTestingKeys, setIsTestingKeys] = useState(false);
  const [keyStatus, setKeyStatus] = useState<ApiKeyStatus>({ serpApi: false, hunter: false });
  const [costTracking, setCostTracking] = useState({ totalCost: 0, monthlyUsage: 0, lastReset: '' });
  const [skipValidation, setSkipValidation] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    // Load existing keys
    const { serpApiKey: existingSerpKey, hunterKey: existingHunterKey } = ApiSearchService.getApiKeys();
    if (existingSerpKey) setSerpApiKey(existingSerpKey);
    if (existingHunterKey) setHunterKey(existingHunterKey);

    // Load cost tracking
    setCostTracking(ApiSearchService.getCostTracking());

    // Test existing keys
    if (existingSerpKey || existingHunterKey) {
      testApiKeys(existingSerpKey || '', existingHunterKey || '');
    }
  }, []);

  const testApiKeys = async (serpKey: string, hunterKey: string) => {
    if (!serpKey && !hunterKey) return;
    
    setIsTestingKeys(true);
    try {
      const results = await ApiSearchService.testApiKeys(serpKey, hunterKey);
      setKeyStatus(results);
      
      if (results.corsIssue) {
        toast({
          title: "CORS Restrictions Detected",
          description: "Cannot test keys directly in browser. Keys saved based on format validation.",
          variant: "default",
        });
      } else if (results.serpApi || results.hunter) {
        toast({
          title: "API Keys Tested",
          description: `SerpAPI: ${results.serpApi ? '✓ Valid' : '✗ Invalid'}, Hunter.io: ${results.hunter ? '✓ Valid' : '✗ Invalid'}`,
          variant: "default",
        });
      } else if (results.errors.length > 0) {
        toast({
          title: "API Key Issues",
          description: results.errors[0],
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "API Test Error",
        description: "Failed to test API keys. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsTestingKeys(false);
    }
  };

  const saveApiKeys = async () => {
    if (!serpApiKey.trim()) {
      toast({
        title: "Missing SerpAPI Key",
        description: "SerpAPI key is required for automated searches",
        variant: "destructive",
      });
      return;
    }

    if (skipValidation) {
      // Skip validation and save keys directly
      ApiSearchService.saveApiKeys(serpApiKey, hunterKey);
      setKeyStatus({ serpApi: true, hunter: !!hunterKey });
      toast({
        title: "API Keys Saved",
        description: "Keys saved without validation. You can test them during searches.",
        variant: "default",
      });
      return;
    }

    setIsTestingKeys(true);
    try {
      // Test keys before saving
      const results = await ApiSearchService.testApiKeys(serpApiKey, hunterKey);
      
      if (results.serpApi || results.corsIssue) {
        ApiSearchService.saveApiKeys(serpApiKey, hunterKey);
        setKeyStatus(results);
        
        const message = results.corsIssue 
          ? "Keys saved based on format validation (CORS prevented full testing)"
          : "Your API keys have been saved and tested successfully";
        
        toast({
          title: "API Keys Saved",
          description: message,
          variant: "default",
        });
      } else {
        toast({
          title: "API Key Validation Failed",
          description: results.errors?.[0] || "Please check your API keys and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Save Error",
        description: "Failed to save API keys. Please try again or use 'Skip Validation'.",
        variant: "destructive",
      });
    } finally {
      setIsTestingKeys(false);
    }
  };

  const clearApiKeys = () => {
    ApiSearchService.clearApiKeys();
    setSerpApiKey('');
    setHunterKey('');
    setKeyStatus({ serpApi: false, hunter: false });
    toast({
      title: "API Keys Cleared",
      description: "All API keys have been removed from storage",
      variant: "default",
    });
  };

  const refreshCostTracking = () => {
    setCostTracking(ApiSearchService.getCostTracking());
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="h-5 w-5 text-primary" />
          <span>API Configuration</span>
          <Badge variant={keyStatus.serpApi ? "default" : "secondary"}>
            {keyStatus.serpApi ? "Ready" : "Setup Required"}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure API keys for automated OSINT searches. Your keys are stored securely in your browser.
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
              <AlertTitle>Security Notice</AlertTitle>
              <AlertDescription>
                API keys are stored locally in your browser only. They are never sent to our servers.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serpapi-key" className="flex items-center space-x-2">
                  <span>SerpAPI Key</span>
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                  {keyStatus.serpApi && <CheckCircle className="h-4 w-4 text-success" />}
                </Label>
                <div className="relative">
                  <Input
                    id="serpapi-key"
                    type={showKeys ? "text" : "password"}
                    placeholder="Enter your SerpAPI key"
                    value={serpApiKey}
                    onChange={(e) => setSerpApiKey(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowKeys(!showKeys)}
                  >
                    {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your free API key at{' '}
                  <a 
                    href="https://serpapi.com/users/sign_up" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center"
                  >
                    serpapi.com <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                  {' '}(100 free searches/month)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hunter-key" className="flex items-center space-x-2">
                  <span>Hunter.io Key</span>
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                  {keyStatus.hunter && <CheckCircle className="h-4 w-4 text-success" />}
                </Label>
                <div className="relative">
                  <Input
                    id="hunter-key"
                    type={showKeys ? "text" : "password"}
                    placeholder="Enter your Hunter.io key (optional)"
                    value={hunterKey}
                    onChange={(e) => setHunterKey(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  For email OSINT. Get your key at{' '}
                  <a 
                    href="https://hunter.io/api" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center"
                  >
                    hunter.io <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                  {' '}(50 free requests/month)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="skip-validation"
                    checked={skipValidation}
                    onChange={(e) => setSkipValidation(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="skip-validation" className="text-sm">
                    Skip validation (save keys without testing)
                  </Label>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={saveApiKeys} 
                    disabled={isTestingKeys || !serpApiKey.trim()}
                    className="flex-1"
                  >
                    {isTestingKeys ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing Keys...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        {skipValidation ? 'Save Keys' : 'Save & Test Keys'}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={clearApiKeys}>
                    Clear
                  </Button>
                </div>
              </div>

              {isTestingKeys && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Testing API Keys...</span>
                  </div>
                  <Progress value={66} className="w-full" />
                </div>
              )}

              {keyStatus.errors && keyStatus.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Validation Issues</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {keyStatus.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                    {keyStatus.corsIssue && (
                      <div className="mt-2 text-sm">
                        <strong>Tip:</strong> Use "Skip validation" to save keys based on format, 
                        or test them manually at{' '}
                        <a href="https://serpapi.com/search" target="_blank" className="text-primary hover:underline">
                          serpapi.com/search
                        </a>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
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
                      ${costTracking.totalCost.toFixed(3)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">
                      ${costTracking.monthlyUsage.toFixed(3)}
                    </div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                </CardContent>
              </Card>
            </div>

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