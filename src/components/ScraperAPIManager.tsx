import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Shield, Zap, TrendingUp, Eye, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { ScraperAPIService } from '@/services/scraperApiService';

interface ScraperAPIManagerProps {
  onApiKeyUpdate?: (isValid: boolean) => void;
}

export const ScraperAPIManager: React.FC<ScraperAPIManagerProps> = ({ onApiKeyUpdate }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    credits?: number;
    error?: string;
    hasCredits?: boolean;
  } | null>(null);
  const [costTracking, setCostTracking] = useState({
    totalCredits: 0,
    dailyUsage: 0,
    monthlyUsage: 0
  });
  const [creditInfo, setCreditInfo] = useState<any>(null);

  useEffect(() => {
    // Load stored API key
    const stored = localStorage.getItem('scraperapi_key');
    if (stored) {
      setApiKey(stored);
      validateApiKey(stored);
    }

    // Load cost tracking
    const tracking = ScraperAPIService.getCostTracking();
    setCostTracking(tracking);
  }, []);

  const validateApiKey = async (key: string) => {
    setIsValidating(true);
    try {
      console.log('Validating ScraperAPI key...');
      const result = await ScraperAPIService.testApiKey(key);
      setValidationResult(result);
      
      if (result.valid) {
        localStorage.setItem('scraperapi_key', key);
        console.log('API key valid, fetching credit info...');
        const creditInfo = await ScraperAPIService.getCreditInfo(key);
        setCreditInfo(creditInfo);
        console.log('Credit info updated:', creditInfo);
      }
      
      onApiKeyUpdate?.(result.valid && result.hasCredits);
    } catch (error) {
      console.error('API key validation error:', error);
      setValidationResult({
        valid: false,
        error: 'Failed to validate API key'
      });
    }
    setIsValidating(false);
  };

  const handleSave = () => {
    if (apiKey.trim()) {
      validateApiKey(apiKey.trim());
    }
  };

  const handleClear = () => {
    setApiKey('');
    setValidationResult(null);
    setCreditInfo(null);
    localStorage.removeItem('scraperapi_key');
    onApiKeyUpdate?.(false);
  };

  const getUsageColor = (usage: number, limit: number) => {
    const percentage = (usage / limit) * 100;
    if (percentage >= 90) return 'destructive';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  const getModeDescription = (mode: string) => {
    const descriptions = {
      light: 'Basic web scraping without JavaScript rendering. Fast and cost-effective for simple content.',
      standard: 'JavaScript rendering enabled. Handles dynamic content and basic anti-bot measures.',
      deep: 'Premium proxies + JavaScript rendering. Bypasses advanced security measures.',
      stealth: 'Residential proxies + maximum anti-detection features. Highest success rate for protected sites.'
    };
    return descriptions[mode as keyof typeof descriptions] || '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          ScraperAPI Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="modes">Modes</TabsTrigger>
            <TabsTrigger value="monitoring">Monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ScraperAPI Key</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter your ScraperAPI key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSave} 
                  disabled={!apiKey.trim() || isValidating}
                  className="px-6"
                >
                  {isValidating ? 'Testing...' : 'Save'}
                </Button>
              </div>
            </div>

            {validationResult && (
              <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
                <div className="flex items-center gap-2">
                  {validationResult.valid ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <AlertDescription>
                    {validationResult.valid ? (
                      validationResult.hasCredits ? (
                        `API key valid! Credits available: ${validationResult.credits?.toLocaleString()}`
                      ) : (
                        <div className="space-y-2">
                          <p className="text-amber-600 font-medium">
                            API key valid, but no credits remaining: {validationResult.credits?.toLocaleString() || 0}
                          </p>
                          <p className="text-sm">
                            Enhanced scraping will be disabled until credits are refilled. Regular search functionality remains available.
                          </p>
                        </div>
                      )
                    ) : (
                      `Invalid API key: ${validationResult.error}`
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {validationResult?.valid && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleClear}>
                  Clear Key
                </Button>
                <Badge 
                  variant={validationResult.hasCredits ? "secondary" : "destructive"} 
                  className="ml-auto"
                >
                  {validationResult.hasCredits 
                    ? "Enhanced scraping enabled" 
                    : "No credits - enhanced scraping disabled"
                  }
                </Badge>
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Benefits of ScraperAPI integration:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>10x higher success rate on people search websites</li>
                <li>JavaScript rendering for dynamic content</li>
                <li>Automatic CAPTCHA solving and proxy rotation</li>
                <li>Access to premium residential IP addresses</li>
                <li>Enhanced social media profile extraction</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            {creditInfo && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Credits Remaining</span>
                    <span className="text-lg font-bold text-primary">
                      {creditInfo.remaining.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={(creditInfo.remaining / creditInfo.total) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {creditInfo.total.toLocaleString()} total credits
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Daily Usage</span>
                    <span className="text-lg font-bold">
                      {costTracking.dailyUsage.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Usage</span>
                    <span className="text-lg font-bold">
                      {costTracking.monthlyUsage.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Credit Costs by Mode
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { mode: 'Light', cost: 1, desc: 'Basic scraping' },
                  { mode: 'Standard', cost: 10, desc: 'JS rendering' },
                  { mode: 'Deep', cost: 25, desc: 'Premium proxies' },
                  { mode: 'Stealth', cost: 50, desc: 'Residential IPs' }
                ].map(({ mode, cost, desc }) => (
                  <div key={mode} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{mode}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                    <Badge variant="outline">{cost} credits</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="modes" className="space-y-4">
            <div className="space-y-4">
              {[
                { 
                  name: 'Light Mode', 
                  cost: 1,
                  icon: <Zap className="h-4 w-4" />,
                  features: ['Fast execution', 'No JavaScript', 'Basic scraping'],
                  useCase: 'Simple websites, basic contact info'
                },
                { 
                  name: 'Standard Mode', 
                  cost: 10,
                  icon: <Settings className="h-4 w-4" />,
                  features: ['JavaScript rendering', 'Dynamic content', 'Standard proxies'],
                  useCase: 'Most people search sites, social profiles'
                },
                { 
                  name: 'Deep Mode', 
                  cost: 25,
                  icon: <Eye className="h-4 w-4" />,
                  features: ['Premium proxies', 'Advanced JS handling', 'High success rate'],
                  useCase: 'Protected sites, professional networks'
                },
                { 
                  name: 'Stealth Mode', 
                  cost: 50,
                  icon: <Shield className="h-4 w-4" />,
                  features: ['Residential IPs', 'Maximum stealth', 'Anti-detection'],
                  useCase: 'Heavily protected sites, premium data'
                }
              ].map((mode) => (
                <Card key={mode.name} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {mode.icon}
                          <h4 className="font-medium">{mode.name}</h4>
                          <Badge variant="secondary">{mode.cost} credits</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{mode.useCase}</p>
                        <div className="flex flex-wrap gap-1">
                          {mode.features.map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ScraperAPI integration enhances data collection by providing access to protected
                websites and dynamic content. Monitor usage to optimize costs and success rates.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium">Success Rate Optimization</h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Recommended strategies:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Use Light mode for basic sites (TruePeopleSearch, FastPeopleSearch)</li>
                  <li>Use Standard mode for most people search sites</li>
                  <li>Use Deep mode for Spokeo, WhitePages premium content</li>
                  <li>Use Stealth mode only for heavily protected or premium sites</li>
                  <li>Monitor success rates and adjust modes as needed</li>
                </ul>
              </div>
            </div>

            {validationResult?.valid && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle className="h-4 w-4" />
                  <span>ScraperAPI is active and will enhance your skip tracing searches</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};