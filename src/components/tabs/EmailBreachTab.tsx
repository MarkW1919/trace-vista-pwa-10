import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mail, Shield, AlertTriangle, Database, Globe, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BreachResult {
  source: string;
  breach_date: string;
  leaked_data: string[];
  breach_description: string;
  verified: boolean;
  password_hash?: string;
  confidence: number;
}

interface EmailSearchResult {
  email: string;
  breaches_found: number;
  breaches: BreachResult[];
  domain_info: {
    domain: string;
    mx_records?: string[];
    whois_data?: any;
  };
  platform_accounts: string[];
  search_time: number;
  session_id: string;
}

export const EmailBreachTab = () => {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<EmailSearchResult | null>(null);
  const [progress, setProgress] = useState(0);
  
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
    setResults(null);

    try {
      console.log('Starting email breach search:', email);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('email-breach-search', {
        body: { email, userId: 'demo-user' }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        throw new Error(`Email breach search error: ${error.message}`);
      }

      console.log('Email breach response:', data);

      if (data && data.success && data.results) {
        setResults(data.results);
        toast({
          title: "Email Search Complete",
          description: `Found ${data.results.breaches_found} breaches and ${data.results.platform_accounts.length} platform accounts`,
          variant: data.results.breaches_found > 0 ? "destructive" : "default",
        });
      } else {
        throw new Error(data?.error || 'No results returned');
      }

    } catch (err: any) {
      console.error('Email search error:', err);
      toast({
        title: "Search Error",
        description: err.message || "Failed to search email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setEmail('');
    setResults(null);
    setProgress(0);
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getSeverityColor = (breachCount: number) => {
    if (breachCount === 0) return 'text-success';
    if (breachCount <= 2) return 'text-warning';
    return 'text-destructive';
  };

  const getSeverityBadge = (breachCount: number) => {
    if (breachCount === 0) return 'default';
    if (breachCount <= 2) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-primary" />
            <span>Email Breach & Intelligence Search</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Search for email addresses in known data breaches and check platform account existence. 
            Powered by H8mail-style comprehensive email OSINT and breach database analysis.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter email address to analyze (e.g., example@domain.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleEmailSearch()}
            />
            <Button 
              onClick={handleEmailSearch} 
              disabled={isSearching || !email}
              className="bg-primary hover:bg-primary/90"
            >
              {isSearching ? 'Analyzing...' : 'Search Email'}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isSearching}>
              Reset
            </Button>
          </div>

          {isSearching && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Scanning breach databases and platforms...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-primary" />
                  <span>Analysis Results for "{results.email}"</span>
                </span>
                <Badge variant={getSeverityBadge(results.breaches_found)}>
                  {results.breaches_found} breaches found
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getSeverityColor(results.breaches_found)}`}>
                    {results.breaches_found}
                  </div>
                  <div className="text-sm text-muted-foreground">Data Breaches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{results.platform_accounts.length}</div>
                  <div className="text-sm text-muted-foreground">Platform Accounts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{results.domain_info.domain}</div>
                  <div className="text-sm text-muted-foreground">Email Domain</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{formatResponseTime(results.search_time)}</div>
                  <div className="text-sm text-muted-foreground">Search Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breach Results */}
          {results.breaches.length > 0 && (
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span>Data Breaches Found ({results.breaches.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.breaches.map((breach, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-destructive/5 border-destructive/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-destructive">{breach.source}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={breach.verified ? "default" : "outline"}>
                            {breach.verified ? "Verified" : "Unverified"}
                          </Badge>
                          <Badge variant="secondary">
                            {Math.round(breach.confidence * 100)}% confidence
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{breach.breach_description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Breach Date:</strong> {breach.breach_date}
                        </div>
                        <div>
                          <strong>Leaked Data:</strong> {breach.leaked_data.join(', ')}
                        </div>
                      </div>
                      {breach.password_hash && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <strong>Password Hash Found:</strong> {breach.password_hash.substring(0, 16)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platform Accounts */}
          {results.platform_accounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-accent" />
                  <span>Platform Accounts ({results.platform_accounts.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {results.platform_accounts.map((platform, index) => (
                    <Badge key={index} variant="default" className="justify-center">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Domain Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-primary" />
                <span>Domain Intelligence</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Domain</h4>
                  <p className="font-medium">{results.domain_info.domain}</p>
                </div>
                {results.domain_info.mx_records && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Mail Servers</h4>
                    <div className="space-y-1">
                      {results.domain_info.mx_records.map((mx, index) => (
                        <Badge key={index} variant="outline" className="block text-xs">
                          {mx}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* No Breaches Found */}
          {results.breaches.length === 0 && (
            <Card className="border-success/20 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-success" />
                  <div>
                    <h4 className="font-medium text-success-foreground">No Breaches Found</h4>
                    <p className="text-sm text-success-foreground/80">
                      This email address was not found in any known data breach databases.
                    </p>
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
              <h4 className="font-medium text-warning-foreground">Privacy & Security Notice</h4>
              <p className="text-sm text-warning-foreground/80">
                This tool searches public breach databases and platform APIs for security analysis purposes. 
                Always ensure you have proper authorization before analyzing any email address. 
                Use responsibly and respect privacy laws and regulations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};