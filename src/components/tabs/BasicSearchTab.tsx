import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchResults } from '@/components/SearchResults';
import { Search, Calendar, MapPin, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchFormData {
  name: string;
  city: string;
  state: string;
  dob: string;
  address: string;
  phone: string;
}

// Mock search function - in a real app, this would connect to actual APIs
const performSearch = async (formData: SearchFormData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate mock results based on search terms
  const mockResults = [
    {
      id: '1',
      title: `${formData.name} - Public Records`,
      snippet: `Found potential match for ${formData.name} in ${formData.city}, ${formData.state}. Address: 123 Main St, Phone: 555-0123, Email: ${formData.name.toLowerCase().replace(' ', '.')}@email.com`,
      url: 'https://example.com/public-records',
      source: 'Public Records',
      entities: [
        { type: 'phone' as const, value: '555-0123', confidence: 0.85 },
        { type: 'email' as const, value: `${formData.name.toLowerCase().replace(' ', '.')}@email.com`, confidence: 0.78 },
        { type: 'address' as const, value: '123 Main St', confidence: 0.92 }
      ]
    },
    {
      id: '2',
      title: `${formData.name} - Social Media Profile`,
      snippet: `Professional profile found for ${formData.name}. Location: ${formData.city}. Connections to local businesses and community organizations.`,
      url: 'https://example.com/social-profile',
      source: 'Social Media',
      entities: [
        { type: 'name' as const, value: formData.name, confidence: 0.95 }
      ]
    },
    {
      id: '3',
      title: `${formData.name} - Business Directory`,
      snippet: `Business listing found. Contact information and professional history available. Last updated 6 months ago.`,
      url: 'https://example.com/business-directory',
      source: 'Business Directory',
      entities: [
        { type: 'phone' as const, value: '555-0456', confidence: 0.67 }
      ]
    }
  ];
  
  return mockResults;
};

export const BasicSearchTab = () => {
  const [formData, setFormData] = useState<SearchFormData>({
    name: '',
    city: '',
    state: '',
    dob: '',
    address: '',
    phone: ''
  });
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof SearchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name to search for.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await performSearch(formData);
      setResults(searchResults);
      toast({
        title: "Search Complete",
        description: `Found ${searchResults.length} potential matches.`,
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Basic Skip Tracing Search</h2>
        <p className="text-muted-foreground">
          Enter available information to search public sources for leads. This demonstrates 
          how small pieces of information can be correlated to build a profile.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Search Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="e.g., John Doe"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Last Known City</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="city"
                  className="pl-10"
                  placeholder="e.g., New York"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="e.g., NY"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth (optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dob"
                  type="date"
                  className="pl-10"
                  value={formData.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Last Known Address (optional)</Label>
              <Textarea
                id="address"
                placeholder="123 Main St, Apt 4B"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Last Known Phone (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  className="pl-10"
                  placeholder="555-123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>
          <Button 
            onClick={handleSearch}
            disabled={isLoading || !formData.name.trim()}
            className="mt-6 w-full bg-gradient-primary hover:opacity-90"
          >
            {isLoading ? 'Searching...' : 'Run Search'}
          </Button>
        </CardContent>
      </Card>

      {(results.length > 0 || isLoading) && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Search Results</h3>
          <SearchResults results={results} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
};