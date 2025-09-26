import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SearchResults from '@/components/SearchResults';
import { Search, Calendar, MapPin, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SupabaseSearchService } from '@/services/supabaseSearchService';
import { SearchResult } from '@/types/entities';
import { useAuth } from '@/contexts/AuthContext';
import { AuthComponent } from '@/components/AuthComponent';

interface SearchFormData {
  name: string;
  city: string;
  state: string;
  dob: string;
  address: string;
  phone: string;
  email: string;
}


export const BasicSearchTab = () => {
  const [formData, setFormData] = useState<SearchFormData>({
    name: '',
    city: '',
    state: '',
    dob: '',
    address: '',
    phone: '',
    email: ''
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();

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

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to perform searches.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await SupabaseSearchService.performComprehensiveSearch(
        {
          name: formData.name,
          city: formData.city,
          state: formData.state,
          phone: formData.phone,
          email: formData.email,
          dob: formData.dob,
          address: formData.address,
        },
        'deep',
        !!formData.email
      );

      if (searchResults.success) {
        setResults(searchResults.results);
        toast({
          title: "Search Complete",
          description: `Found ${searchResults.results.length} results. Cost: $${searchResults.cost.toFixed(4)}`,
        });
      } else {
        throw new Error(searchResults.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: error instanceof Error ? error.message : "An error occurred while searching. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Deep Search (Fast & Efficient)</h2>
        <p className="text-muted-foreground">
          Tier 1: Quick comprehensive search across web sources using SerpAPI for fast results. 
          Perfect for initial investigations and lead generation.
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
            <div className="space-y-2">
              <Label htmlFor="email">Email Address (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
          </div>

          {!isAuthenticated && !authLoading && (
            <div className="mb-4">
              <AuthComponent />
            </div>
          )}
          
          <Button 
            onClick={handleSearch} 
            disabled={isLoading || !formData.name.trim() || !isAuthenticated || authLoading} 
            className="w-full mt-6"
          >
            {isLoading ? 'Searching...' : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Start Search
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <SearchResults 
          results={results}
          loading={isLoading}
        />
      )}
    </div>
  );
};