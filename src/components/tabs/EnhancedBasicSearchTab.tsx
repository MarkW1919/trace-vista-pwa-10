import { useState } from 'react';
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
import { SearchResults } from '@/components/SearchResults';
import { calculateRelevanceScore } from '@/utils/scoring';
import { extractEntities } from '@/utils/entityExtraction';
import { performRealWebSearch } from '@/utils/realWebSearch';
import { ApiSearchService } from '@/services/apiSearchService';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { ScraperAPIManager } from '@/components/ScraperAPIManager';
import { SearchResult, BaseEntity } from '@/types/entities';
import { ConsentWarning } from '@/components/ConsentWarning';
import { LowResultsWarning } from '@/components/LowResultsWarning';
import { RealOSINTGuide } from '@/components/RealOSINTGuide';
import { AuthComponent } from '@/components/AuthComponent';
import { useAuth } from '@/contexts/AuthContext';
import { ApiKeyTester } from '@/components/ApiKeyTester';
import { generateMockResults, MockDataConfig } from '@/utils/mockDataGenerator';
import { SearchHistory } from '@/components/SearchHistory';

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

interface EnhancedBasicSearchTabProps {
  searchMode?: 'deep' | 'enhanced';
  onNavigateToReport?: (result: SearchResult) => void;
}

export const EnhancedBasicSearchTab = ({ searchMode: propSearchMode = 'deep', onNavigateToReport }: EnhancedBasicSearchTabProps) => {
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
  const [searchMode, setSearchMode] = useState<'deep' | 'enhanced'>(propSearchMode);
  const [hasScraperAPI, setHasScraperAPI] = useState(false);
  const [useAutomatedSearch, setUseAutomatedSearch] = useState(false);
  const [searchCost, setSearchCost] = useState(0);
  
  const { dispatch } = useSkipTracing();
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();

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
      } else if (searchMode === 'enhanced') {
        allQueries.push(...generateReverseQueries(searchParams));
        allQueries.push(...generateSpecializedDorks(searchParams, 'legal'));
        allQueries.push(...generateSpecializedDorks(searchParams, 'deep'));
        allQueries.push(...generateSpecializedDorks(searchParams, 'social'));
        allQueries.push(...generateSpecializedDorks(searchParams, 'business'));
      }

      // Limit queries based on mode  
      const queryLimit = searchMode === 'deep' ? 12 : 20;
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
        console.log('Using authenticated Edge Function search for real API results');
        
        setSearchProgress(prev => ({
          ...prev,
          phase: 'Real API Search',
          progress: 10,
          currentQuery: 'Connecting to advanced search APIs (this may take 20-30 seconds)...',
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
              phase: 'Processing Live Results',
              progress: 80,
              currentQuery: `Processed ${apiResponse.results.length} real results from APIs`,
              completedQueries: 1,
              totalQueries: 1
            }));

            toast({
              title: "Live API Search Successful",
              description: `Found ${apiResponse.results.length} real results. Cost: $${totalSearchCost.toFixed(4)}`,
              variant: "default",
            });
            
            console.log('Live API search successful:', {
              resultCount: apiResponse.results.length,
              cost: totalSearchCost,
              sessionId: apiResponse.sessionId
            });
          } else {
            throw new Error(apiResponse.error || 'Edge Function search failed');
          }
        } catch (error) {
          console.error('Live API search error:', error);
          
          // Handle timeout errors gracefully
          if (error.message?.includes('timeout') || error.message?.includes('Timeout') || error.message?.includes('504')) {
            setSearchProgress(prev => ({
              ...prev,
              phase: 'Search Timeout - Using Demo Mode',
              progress: 50,
              currentQuery: 'API timeout detected - switching to educational examples...'
            }));
            
            toast({
              title: "Search Timeout", 
              description: "The search APIs are taking longer than expected. Showing educational examples instead.",
              variant: "default",
            });
            
            // Fall back to educational content for timeout scenarios
            console.log('Falling back to educational content due to timeout');
            const mockConfig: MockDataConfig = {
              minResults: 5,
              maxAugmentation: 3,
              includeRelatives: true,
              includeBusinesses: true,
              includeProperties: true,
            };
            const mockResults = generateMockResults({
              name: formData.name,
              city: formData.city,
              state: formData.state,
              phone: formData.phone,
              email: formData.email,
              dob: formData.dob,
              address: formData.address,
            }, mockConfig);
            allResults.push(...mockResults);
            
          } else {
            toast({
              title: "API Search Failed", 
              description: `Real API search failed: ${error.message}. Check API keys and connection.`,
              variant: "destructive",
            });
            
            // For non-timeout errors, don't fallback to educational content
            throw error;
          }
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
      
        {/* ScraperAPI Management */}
        <ScraperAPIManager onApiKeyUpdate={setHasScraperAPI} />

        {/* Search History */}
        <SearchHistory />
      
      <Card className="border-primary/20">
        <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary" />
              <span>{searchMode === 'deep' ? 'Deep Search' : 'Enhanced Pro Search'} with Google Dorks</span>
              <Badge variant="default" className="ml-2">
                {searchMode === 'enhanced' ? 'Maximum Accuracy' : 'Industry-Grade'}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {searchMode === 'enhanced' 
                ? 'Most comprehensive OSINT search with intelligent filtering and enhanced accuracy based on training data'
                : 'Fast comprehensive OSINT search using strategic Google Dorks - Real APIs, no mock data'
              }
            </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Mode Selection */}
          <Tabs value={searchMode} onValueChange={(value) => setSearchMode(value as 'deep' | 'enhanced')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deep" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Deep Search</span>
              </TabsTrigger>
              <TabsTrigger value="enhanced" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Enhanced Pro</span>
                {hasScraperAPI && <Badge variant="secondary" className="text-xs px-1">Pro</Badge>}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="deep" className="text-sm text-muted-foreground">
              Fast comprehensive search with 12 strategic queries including business records, social media, and public data
            </TabsContent>
            <TabsContent value="enhanced" className="text-sm text-muted-foreground">
              {hasScraperAPI ? (
                <span className="text-success">Most comprehensive search with 20+ queries, ScraperAPI integration, CAPTCHA bypass, and residential proxies for maximum accuracy</span>
              ) : (
                <span className="text-warning">Most comprehensive search mode - configure ScraperAPI for enhanced data collection capabilities</span>
              )}
            </TabsContent>
          </Tabs>

          {/* Authentication Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {authLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">Checking authentication...</span>
                  </>
                ) : isAuthenticated ? (
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
            {authLoading && (
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
          
          <SearchResults 
            results={results} 
            isLoading={false}
            onViewReport={(result) => {
              dispatch({ type: 'SET_FILTERED_REPORT', payload: result as any });
              onNavigateToReport?.(result as any);
            }}
          />
          
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