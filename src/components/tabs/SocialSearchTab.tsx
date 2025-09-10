import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Search, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialProfile {
  platform: string;
  username: string;
  url: string;
  status: 'found' | 'not_found' | 'checking';
  lastChecked?: string;
}

// Mock social platforms for demonstration
const mockPlatforms = [
  'Twitter', 'Instagram', 'Facebook', 'LinkedIn', 'GitHub', 'Reddit',
  'TikTok', 'YouTube', 'Pinterest', 'Snapchat', 'Discord', 'Telegram'
];

const performSocialSearch = async (username: string): Promise<SocialProfile[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return mockPlatforms.map(platform => {
    // Randomly determine if profile exists (for demo purposes)
    const exists = Math.random() > 0.7;
    return {
      platform,
      username,
      url: `https://${platform.toLowerCase()}.com/${username}`,
      status: exists ? 'found' : 'not_found',
      lastChecked: new Date().toISOString()
    };
  });
};

export const SocialSearchTab = () => {
  const [username, setUsername] = useState('');
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a username to search for.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const results = await performSocialSearch(username);
      setProfiles(results);
      const foundCount = results.filter(p => p.status === 'found').length;
      toast({
        title: "Search Complete",
        description: `Found ${foundCount} potential profiles across ${results.length} platforms.`,
      });
    } catch (error) {
      toast({
        title: "Search Error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const foundProfiles = profiles.filter(p => p.status === 'found');
  const notFoundCount = profiles.filter(p => p.status === 'not_found').length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Social Media Profile Discovery</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Search for social media profiles across multiple platforms. This demonstrates how 
          usernames can be correlated across different services to build a digital footprint profile.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Username Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username to Search</Label>
              <Input
                id="username"
                placeholder="e.g., johndoe123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Tip: Try common username patterns like firstname.lastname, firstnamelastname, or firstname123
              </p>
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isLoading || !username.trim()}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {isLoading ? 'Searching Platforms...' : 'Search Social Profiles'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Checking platforms...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {profiles.length > 0 && !isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <div className="text-2xl font-bold text-success">{foundProfiles.length}</div>
                <p className="text-sm text-muted-foreground">Profiles Found</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <XCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <div className="text-2xl font-bold">{notFoundCount}</div>
                <p className="text-sm text-muted-foreground">Not Found</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{profiles.length}</div>
                <p className="text-sm text-muted-foreground">Total Checked</p>
              </CardContent>
            </Card>
          </div>

          {foundProfiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-success" />
                  Found Profiles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {foundProfiles.map((profile, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          {profile.platform}
                        </Badge>
                        <span className="font-medium">{profile.username}</span>
                      </div>
                      <a
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>View</span>
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">Educational Note:</h4>
              <p className="text-sm text-muted-foreground">
                This simulation demonstrates how usernames can be systematically checked across platforms. 
                In a real investigation, tools like Sherlock or WhatsMyName would perform similar searches 
                across hundreds of platforms. Always ensure you have proper authorization before conducting 
                such searches in professional contexts.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};