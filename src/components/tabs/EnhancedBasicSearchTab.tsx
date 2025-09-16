import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Calendar, MapPin, Phone, Mail, Target, 
  TrendingUp, Shield, Clock, Database, Zap, ExternalLink, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSkipTracing } from '@/contexts/SkipTracingContext';
import { generateGoogleDorks, generateSpecializedDorks, generateReverseQueries, type SearchParams } from '@/utils/googleDorks';
import { calculateRelevanceScore } from '@/utils/scoring';
import { extractEntities } from '@/utils/entityExtraction';
import { performRealWebSearch } from '@/utils/realWebSearch';
import { ApiSearchService } from '@/services/apiSearchService';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { SearchResult, BaseEntity } from '@/types/entities';
import { ConsentWarning } from '@/components/ConsentWarning';
import { LowResultsWarning } from '@/components/LowResultsWarning';
import { RealOSINTGuide } from '@/components/RealOSINTGuide';
import { AuthComponent } from '@/components/AuthComponent';
import { ApiKeyTester } from '@/components/ApiKeyTester';

interface SearchFormData {
  name: string;
  city: string;
  state: string;
  dob: string;
  address: string;
  phone: string;
  email: string;
}

interface SearchProgress {
  phase: string;
  progress: number;
  currentQuery: string;
  totalQueries: number;
  completedQueries: number;
}

export const EnhancedBasicSearchTab = () => {
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
  const [entities, setEntities] = useState<BaseEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState<SearchProgress>({
    phase: '',
    progress: 0,
    currentQuery: '',
    totalQueries: 0,
    completedQueries: 0
  });
  const [searchMode, setSearchMode] = useState<'basic' | 'deep' | 'targeted'>('basic');
  const [useAutomatedSearch, setUseAutomatedSearch] = useState(false);
  const [searchCost, setSearchCost] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  const { dispatch } = useSkipTracing();
  const { toast } = useToast();

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { SupabaseSearchService } = await import('@/services/supabaseSearchService');
        const authStatus = await SupabaseSearchService.isAuthenticated();
        setIsAuthenticated(authStatus);
        setUseAutomatedSearch(authStatus); // Auto-enable for authenticated users
        setAuthChecked(true);
        
        console.log('Authentication status:', authStatus);
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, []);

  const handleInputChange = (field: keyof SearchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const performEnhancedSearch = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter at least a name to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setResults([]);
    setEntities([]);
    dispatch({ type: 'SET_LOADING', payload: { module: 'basicSearch', loading: true } });

    try {
      const searchParams: SearchParams = {
        name: formData.name,
        city: formData.city || undefined,
        state: formData.state || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        dob: formData.dob || undefined,
        address: formData.address || undefined,
      };

      // Generate comprehensive query list based on search mode
      let allQueries = generateGoogleDorks(searchParams);
      
      if (searchMode === 'deep') {
        allQueries.push(...generateSpecializedDorks(searchParams, 'deep'));
        allQueries.push(...generateSpecializedDorks(searchParams, 'social'));
        allQueries.push(...generateSpecializedDorks(searchParams, 'business'));
      } else if (searchMode === 'targeted') {
        allQueries.push(...generateReverseQueries(searchParams));
        allQueries.push(...generateSpecializedDorks(searchParams, 'legal'));
      }

      // Limit queries based on mode
      const queryLimit = searchMode === 'basic' ? 8 : searchMode === 'deep' ? 15 : 12;
      const selectedQueries = allQueries.slice(0, queryLimit);

      setSearchProgress({
        phase: 'Initializing Google Dorks',
        progress: 0,
        currentQuery: '',
        totalQueries: selectedQueries.length,
        completedQueries: 0
      });

      const allResults: SearchResult[] = [];
      let totalSearchCost = 0;
      
      // For authenticated users, always use automated search via Edge Function
      if (isAuthenticated && useAutomatedSearch) {
        console.log('Using authenticated Edge Function search');
        
        setSearchProgress(prev => ({
          ...prev,
          phase: 'Automated Edge Function Search',
          progress: 10,
          currentQuery: 'Calling Supabase Edge Function for real API results',
          completedQueries: 0
        }));

        try {
          const { SupabaseSearchService } = await import('@/services/supabaseSearchService');
          
          const apiResponse = await SupabaseSearchService.performComprehensiveSearch(
            {
              name: formData.name,
              city: formData.city,
              state: formData.state,
              phone: formData.phone,
              email: formData.email,
              dob: formData.dob,
              address: formData.address,
            },
            searchMode,
            !!formData.email
          );

          if (apiResponse.success) {
            allResults.push(...apiResponse.results);
            totalSearchCost = apiResponse.cost;
            setSearchCost(totalSearchCost);

            setSearchProgress(prev => ({
              ...prev,
              phase: 'Processing Real API Results',
              progress: 80,
              currentQuery: `Found ${apiResponse.results.length} real results from APIs`,
              completedQueries: 1,
              totalQueries: 1
            }));

            toast({
              title: "Real API Search Complete",
              description: `Found ${apiResponse.results.length} results from SerpAPI/Hunter.io. Cost: $${totalSearchCost.toFixed(4)}`,
              variant: "default",
            });
            
            console.log('Edge Function search successful:', {
              resultCount: apiResponse.results.length,
              cost: totalSearchCost,
              sessionId: apiResponse.sessionId
            });
          } else {
            throw new Error(apiResponse.error || 'Edge Function search failed');
          }
        } catch (error) {
          console.error('Edge Function search error:', error);
          toast({
            title: "API Search Failed", 
            description: `Error: ${error.message}. Using educational content instead.`,
            variant: "destructive",
          });
          // Don't fall back to manual search for authenticated users - show the error
        }
      }
      
      // Only use educational content for non-authenticated users or when Edge Function fails
      if (!isAuthenticated && allResults.length === 0) {
        console.log('User not authenticated, showing educational content');
        
        setSearchProgress(prev => ({
          ...prev,
          phase: 'Educational Content',
          progress: 60,
          currentQuery: 'Generating educational search examples (sign in for real results)',
          completedQueries: 0,
          totalQueries: selectedQueries.length
        }));

        for (let i = 0; i < selectedQueries.length; i++) {
          const dork = selectedQueries[i];
          
          setSearchProgress(prev => ({
            ...prev,
            phase: `Educational ${dork.category} Examples`,
            progress: 60 + ((i + 1) / selectedQueries.length) * 20,
            currentQuery: `${dork.description} (Educational - Sign in for real results)`,
            completedQueries: i + 1
          }));

          try {
            const searchResults = await performRealWebSearch(dork.query, {
              name: formData.name,
              city: formData.city,
              state: formData.state,
              phone: formData.phone,
              email: formData.email,
              dob: formData.dob,
              address: formData.address,
            });
            allResults.push(...searchResults);
          } catch (error) {
            console.warn(`Manual search URL generation failed for query: ${dork.query}`);
          }
        }
      } else if (isAuthenticated && allResults.length === 0) {
        // If authenticated user got no results, show specific message
        toast({
          title: "No Real Results Found", 
          description: "The Edge Function search didn't return any results. This may be due to API limitations, insufficient API credits, or the subject having minimal public presence.",
          variant: "destructive",
        });
      }

      // Process and enhance results
      setSearchProgress(prev => ({
        ...prev,
        phase: 'Processing Results',
        progress: 85,
        currentQuery: 'Deduplicating and scoring results'
      }));

      // Extract entities from all results
      const extractedEntities: BaseEntity[] = [];
      allResults.forEach(result => {
        if (result.extractedEntities) {
          extractedEntities.push(...result.extractedEntities);
        } else {
          const resultEntities = extractEntities(result.snippet, { 
            searchName: formData.name, 
            searchLocation: formData.city 
          });
          extractedEntities.push(...resultEntities);
          result.extractedEntities = resultEntities;
        }
      });

      // Flag low results for authenticated users only
      dispatch({ type: 'SET_LOW_RESULTS', payload: allResults.length < 3 && isAuthenticated });

      // Final processing
      setSearchProgress(prev => ({
        ...prev,
        phase: 'Finalizing',
        progress: 95,
        currentQuery: 'Compiling comprehensive report'
      }));

      // Sort results by relevance and confidence
      const sortedResults = allResults.sort((a, b) => 
        (b.relevanceScore + b.confidence) - (a.relevanceScore + a.confidence)
      );

      setResults(sortedResults);
      setEntities(extractedEntities);

      // Add to global state
      dispatch({ type: 'ADD_RESULTS', payload: sortedResults });
      dispatch({ type: 'ADD_ENTITIES', payload: extractedEntities });
      dispatch({ type: 'ADD_TO_HISTORY', payload: `Enhanced Search: ${formData.name}` });

      setSearchProgress(prev => ({
        ...prev,
        phase: 'Complete',
        progress: 100,
        currentQuery: `Found ${sortedResults.length} results with ${extractedEntities.length} entities`
      }));

      if (!isAuthenticated) {
        toast({
          title: "Educational Search Complete",
          description: `Showing ${sortedResults.length} educational examples. Sign in for real API results.`,
          variant: "default",
        });
      }

    } catch (error) {
      toast({
        title: "Search Error",
        description: "An error occurred during the search. Please try again.",
        variant: "destructive",
      });
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
      dispatch({ type: 'SET_LOADING', payload: { module: 'basicSearch', loading: false } });
      
      // Clear progress after a delay
      setTimeout(() => {
        setSearchProgress({
          phase: '',
          progress: 0,
          currentQuery: '',
          totalQueries: 0,
          completedQueries: 0
        });
      }, 3000);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      city: '',
      state: '',
      dob: '',
      address: '',
      phone: '',
      email: ''
    });
    setResults([]);
    setEntities([]);
    setSearchProgress({
      phase: '',
      progress: 0,
      currentQuery: '',
      totalQueries: 0,
      completedQueries: 0
    });
    setSearchCost(0);
  };

  return (
    <div className="space-y-6">
      <ConsentWarning variant="prominent" />
      
      <AuthComponent />
      
      <ApiKeyTester />
      
      <ApiKeyManager />
      
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-primary" />
            <span>Enhanced Deep Search with Google Dorks</span>
            <Badge variant="default" className="ml-2">Industry-Grade</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Real OSINT search using Google Dorks - No mock data. Results depend on subject's public presence.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Mode Selection */}
          <Tabs value={searchMode} onValueChange={(value) => setSearchMode(value as typeof searchMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Basic</span>
              </TabsTrigger>
              <TabsTrigger value="deep" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Deep</span>
              </TabsTrigger>
              <TabsTrigger value="targeted" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Targeted</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="text-sm text-muted-foreground">
              Standard search with 8 primary Google Dorks covering basic identity, social media, and public records
            </TabsContent>
            <TabsContent value="deep" className="text-sm text-muted-foreground">
              Comprehensive search with 15+ queries including business records, genealogy, and deep social analysis
            </TabsContent>
            <TabsContent value="targeted" className="text-sm text-muted-foreground">
              Focused search using reverse lookups and legal/court record specialization
            </TabsContent>
          </Tabs>

          {/* Authentication Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {isAuthenticated ? (
                  <>
                    <Zap className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Real API Search Active</span>
                    <Badge variant="default" className="text-xs bg-green-500">Authenticated</Badge>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Educational Mode</span>
                    <Badge variant="outline" className="text-xs">Not Authenticated</Badge>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isAuthenticated ? (
                  <>Real SerpAPI & Hunter.io results via Edge Function
                  {searchCost > 0 && ` • Last search cost: $${searchCost.toFixed(4)}`}</>
                ) : (
                  'Sign in above to access real API searches with live data'
                )}
              </p>
            </div>
            {!authChecked && (
              <Badge variant="outline" className="text-xs">Checking...</Badge>
            )}
          </div>

          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Full Name (Consented Subject Only)</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., John Doe (with consent)"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g., john.doe@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>City</span>
              </Label>
              <Input
                id="city"
                placeholder="e.g., New York"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
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
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Phone Number</span>
              </Label>
              <Input
                id="phone"
                placeholder="e.g., (555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Date of Birth</span>
              </Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => handleInputChange('dob', e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Last Known Address</Label>
              <Textarea
                id="address"
                placeholder="e.g., 123 Main Street, Apt 4B"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={performEnhancedSearch}
              disabled={isSearching || !formData.name.trim()}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isSearching ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Run Enhanced Search
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isSearching}>
              Reset Form
            </Button>
          </div>

          {/* Progress Indicator */}
          {isSearching && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium">{searchProgress.phase}</span>
                    </div>
                    <Badge variant="secondary">
                      {searchProgress.completedQueries}/{searchProgress.totalQueries}
                    </Badge>
                  </div>
                  
                  <Progress value={searchProgress.progress} className="w-full" />
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{searchProgress.currentQuery}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {results.length > 0 && results.length < 5 && (
        <LowResultsWarning 
          resultCount={results.length}
          suggestions={[
            "Add more specific details (DOB, middle name)",
            "Try name variations or nicknames", 
            "Include additional location information",
            "Check if subject has strong privacy settings",
            "Verify spelling and try broader queries",
            "Subject may have limited public digital footprint"
          ]}
        />
      )}

      <RealOSINTGuide />

      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2 text-primary" />
            OSINT Search Sources ({results.length})
          </h3>
          
          <div className="mb-4">
            <Badge variant="outline" className="mr-2">Manual Investigation Required</Badge>
            <Badge variant="outline" className="mr-2">{entities.length} entities extracted</Badge>
            <Badge variant="outline">
              {results.filter(r => r.confidence > 0).length} high confidence
            </Badge>
          </div>
          
          <div className="grid gap-4">
            {results.map((result) => (
              <Card key={result.id} className="border-muted hover:border-primary/50 transition-colors">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground flex items-center">
                          {result.source === 'OSINT Education' && '🎓 '}
                          {result.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">{result.snippet}</p>
                      </div>
                      {result.confidence > 0 && (
                        <Badge variant="outline" className="ml-3">
                          {result.confidence}% confidence
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Platform: {result.source}
                      </span>
                      {result.url && (
                        <Button 
                          variant={result.source === 'OSINT Education' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => window.open(result.url, '_blank', 'noopener,noreferrer')}
                          className="text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {result.source === 'OSINT Education' ? 'Learn More' : 'Search Manually'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card className="mt-6 border-warning/20 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning-foreground">Professional OSINT Reminder</h4>
                  <p className="text-sm text-warning-foreground/80 mt-1">
                    The links above are starting points. Professional investigators combine multiple sources, 
                    use specialized databases, apply advanced techniques, and always verify findings through 
                    cross-referencing. Results quality depends on subject's digital footprint and privacy settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};