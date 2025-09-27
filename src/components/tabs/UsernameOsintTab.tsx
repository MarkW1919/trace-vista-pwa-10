import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Search, Globe, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PlatformResult {
  platform: string;
  url: string;
  found: boolean;
  response_time: number;
  profile_data?: {
    displayName?: string;
    bio?: string;
    location?: string;
    followerCount?: number;
    verified?: boolean;
    avatar?: string;
  };
  confidence: number;
}

interface UsernameSearchResult {
  username: string;
  total_platforms: number;
  found_platforms: number;
  platforms: PlatformResult[];
  search_time: number;
  session_id: string;
}

export const UsernameOsintTab = () => {
  const [username, setUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<UsernameSearchResult | null>(null);
  const [progress, setProgress] = useState(0);
  
  const { toast } = useToast();

  const validateUsername = (username: string): boolean => {
    // Basic username validation - alphanumeric and basic symbols
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    return usernameRegex.test(username) && username.length >= 2 && username.length <= 50;
  };

  const handleUsernameSearch = async () => {
    if (!username || !validateUsername(username)) {
      toast({
        title: "Invalid Username",
        description: "Please enter a valid username (2-50 characters, letters, numbers, dots, underscores, hyphens only)",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setProgress(0);
    setResults(null);

    try {
      console.log('Starting username OSINT search:', username);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 15, 90));
      }, 1000);

      const { data, error } = await supabase.functions.invoke('username-osint', {
        body: { username, userId: 'demo-user' }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        throw new Error(`Username search error: ${error.message}`);
      }

      console.log('Username OSINT response:', data);

      if (data && data.success && data.results) {
        setResults(data.results);
        toast({
          title: "Username Search Complete",
          description: `Found ${data.results.found_platforms} platforms for username: ${username}`,
          variant: data.results.found_platforms > 0 ? "default" : "destructive",
        });
      } else {
        throw new Error(data?.error || 'No results returned');
      }

    } catch (err: any) {
      console.error('Username search error:', err);
      toast({
        title: "Search Error",
        description: err.message || "Failed to search username. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setUsername('');
    setResults(null);
    setProgress(0);
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <span>Username OSINT Search</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Search for a username across 30+ popular platforms and social networks. 
            Powered by Maigret-style comprehensive username intelligence.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter username to search (e.g., johndoe123)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleUsernameSearch()}
            />
            <Button 
              onClick={handleUsernameSearch} 
              disabled={isSearching || !username}
              className="bg-primary hover:bg-primary/90"
            >
              {isSearching ? 'Searching...' : 'Search Username'}
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
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-success" />
                  <span>Search Results for "{results.username}"</span>
                </span>
                <Badge variant={results.found_platforms > 0 ? "default" : "secondary"}>
                  {results.found_platforms}/{results.total_platforms} platforms
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{results.found_platforms}</div>
                  <div className="text-sm text-muted-foreground">Platforms Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{results.total_platforms}</div>
                  <div className="text-sm text-muted-foreground">Platforms Checked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{formatResponseTime(results.search_time)}</div>
                  <div className="text-sm text-muted-foreground">Search Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Found Platforms */}
          {results.platforms.filter(p => p.found).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Found Accounts ({results.platforms.filter(p => p.found).length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {results.platforms
                    .filter(p => p.found)
                    .map((platform, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-success/5 border-success/20">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <div>
                            <h4 className="font-medium">{platform.platform}</h4>
                            {platform.profile_data?.displayName && (
                              <p className="text-sm text-muted-foreground">
                                Name: {platform.profile_data.displayName}
                              </p>
                            )}
                            {platform.profile_data?.bio && (
                              <p className="text-sm text-muted-foreground truncate max-w-md">
                                Bio: {platform.profile_data.bio}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">
                            {Math.round(platform.confidence * 100)}% confidence
                          </Badge>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatResponseTime(platform.response_time)}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(platform.url, '_blank')}
                          >
                            <Globe className="h-4 w-4 mr-1" />
                            Visit
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Not Found Platforms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-muted-foreground" />
                <span>Not Found ({results.platforms.filter(p => !p.found).length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {results.platforms
                  .filter(p => !p.found)
                  .map((platform, index) => (
                    <Badge key={index} variant="outline" className="justify-center">
                      {platform.platform}
                    </Badge>
                  ))}
              </div>
              {results.platforms.filter(p => !p.found).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  All checked platforms returned results!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-warning/20 bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-warning mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-warning-foreground">Ethical Usage Notice</h4>
              <p className="text-sm text-warning-foreground/80">
                This tool searches public platforms for username availability and basic profile information. 
                Always ensure you have proper authorization before investigating any individual. 
                Respect privacy and use this tool responsibly for legitimate purposes only.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};