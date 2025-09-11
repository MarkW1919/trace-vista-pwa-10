import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mail, Shield, AlertTriangle, CheckCircle, Globe } from 'lucide-react';
import { useSkipTracing } from '@/contexts/SkipTracingContext';
import { useToast } from '@/hooks/use-toast';
import { EmailFootprint } from '@/types/entities';

// Simulate 120+ platforms like Holehe
const EMAIL_PLATFORMS = [
  'Facebook', 'Twitter', 'Instagram', 'LinkedIn', 'GitHub', 'Google', 'Microsoft',
  'Amazon', 'Netflix', 'Spotify', 'Adobe', 'Dropbox', 'PayPal', 'eBay',
  'Reddit', 'Pinterest', 'Snapchat', 'TikTok', 'YouTube', 'Steam', 'Discord',
  'Slack', 'Zoom', 'Skype', 'WhatsApp', 'Telegram', 'Signal', 'Viber',
  'WordPress', 'Tumblr', 'Medium', 'Blogger', 'Flickr', 'Imgur', 'Vimeo',
  'SoundCloud', 'Twitch', 'Patreon', 'Kickstarter', 'GoFundMe', 'Airbnb',
  'Uber', 'Lyft', 'DoorDash', 'Grubhub', 'Venmo', 'CashApp', 'Zelle'
];

export const EmailOsintTab = () => {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<EmailFootprint | null>(null);
  const [progress, setProgress] = useState(0);
  
  const { dispatch } = useSkipTracing();
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const simulateEmailCheck = async (email: string): Promise<EmailFootprint> => {
    // Simulate realistic checking with progress
    const platforms: string[] = [];
    let breachCount = 0;
    
    // Simulate checking each platform
    for (let i = 0; i < EMAIL_PLATFORMS.length; i++) {
      const platform = EMAIL_PLATFORMS[i];
      setProgress(((i + 1) / EMAIL_PLATFORMS.length) * 100);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Simulate realistic hit rate (15-25% for most emails)
      if (Math.random() < 0.2) {
        platforms.push(platform);
      }
      
      // Simulate breach data (lower probability)
      if (Math.random() < 0.05) {
        breachCount++;
      }
    }

    // Simulate domain analysis
    const domain = email.split('@')[1];
    const domainInfo = {
      registrar: 'Simulated Registrar Inc.',
      createdDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 10).toISOString().split('T')[0],
      expiresDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000 * 2).toISOString().split('T')[0],
    };

    return {
      id: `email-${Date.now()}`,
      type: 'email',
      value: email,
      confidence: Math.min(95, 40 + platforms.length * 2),
      source: 'Email OSINT',
      timestamp: new Date(),
      platforms,
      breachCount,
      domainInfo,
      verified: platforms.length > 3,
    };
  };

  const handleEmailSearch = async () => {
    if (!email || !validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setProgress(0);
    dispatch({ type: 'SET_LOADING', payload: { module: 'emailSearch', loading: true } });

    try {
      const emailFootprint = await simulateEmailCheck(email);
      setResults(emailFootprint);
      
      // Add to global state
      dispatch({ type: 'ADD_ENTITIES', payload: [emailFootprint] });
      dispatch({ type: 'ADD_TO_HISTORY', payload: `Email OSINT: ${email}` });
      
      toast({
        title: "Email Analysis Complete",
        description: `Found footprints on ${emailFootprint.platforms.length} platforms`,
        variant: emailFootprint.platforms.length > 0 ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to analyze email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
      setProgress(0);
      dispatch({ type: 'SET_LOADING', payload: { module: 'emailSearch', loading: false } });
    }
  };

  const handleReset = () => {
    setEmail('');
    setResults(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-primary" />
            <span>Email OSINT Analysis</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Check email footprints across 120+ platforms and analyze digital presence
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter email address (e.g., example@domain.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="flex-1"
            />
            <Button 
              onClick={handleEmailSearch} 
              disabled={isSearching || !email}
              className="bg-primary hover:bg-primary/90"
            >
              {isSearching ? 'Analyzing...' : 'Analyze Email'}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isSearching}>
              Reset
            </Button>
          </div>

          {isSearching && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Scanning platforms...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Platform Footprints</span>
                <Badge variant="secondary">{results.platforms.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.platforms.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {results.platforms.map((platform) => (
                    <Badge key={platform} variant="default" className="justify-center">
                      {platform}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No platform footprints found
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-warning" />
                <span>Security Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Data Breaches</span>
                <Badge variant={results.breachCount > 0 ? "destructive" : "default"}>
                  {results.breachCount}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Confidence Score</span>
                <Badge variant={results.confidence >= 70 ? "default" : "secondary"}>
                  {results.confidence}%
                </Badge>
              </div>

              {results.breachCount > 0 && (
                <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">
                      Security Alert
                    </span>
                  </div>
                  <p className="text-xs text-destructive/80 mt-1">
                    This email appears in {results.breachCount} known data breach(es)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {results.domainInfo && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-accent" />
                  <span>Domain Intelligence</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Registrar</h4>
                    <p className="font-medium">{results.domainInfo.registrar}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Created Date</h4>
                    <p className="font-medium">{results.domainInfo.createdDate}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Expires Date</h4>
                    <p className="font-medium">{results.domainInfo.expiresDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card className="border-warning/20 bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-warning-foreground">Educational Use Only</h4>
              <p className="text-sm text-warning-foreground/80">
                This tool simulates email OSINT techniques for educational purposes. 
                Real email checking should only be performed with proper consent and for legitimate purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};