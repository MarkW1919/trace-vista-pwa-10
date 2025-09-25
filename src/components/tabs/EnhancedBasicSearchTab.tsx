import React, { useState } from 'react';
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
  // PHASE 2 FIX: Improved state management with clear separation of concerns
  const [searchState, setSearchState] = useState({
    isSearching: false,
    searchMode: propSearchMode,
    useRealAPI: false,
    hasScraperAPI: false,
    searchCost: 0,
    retryCount: 0
  });
  const [searchProgress, setSearchProgress] = useState<SearchProgress>({
    phase: '',
    progress: 0,
    currentQuery: '',
    totalQueries: 0,
    completedQueries: 0
  });
  
  const { dispatch } = useSkipTracing();
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading, sessionValid, refreshSession } = useAuth();
  
  // Auto-detect real API availability based on authentication
  React.useEffect(() => {
    if (isAuthenticated && sessionValid) {
      setSearchState(prev => ({ ...prev, useRealAPI: true }));
    } else if (!authLoading) {
      setSearchState(prev => ({ ...prev, useRealAPI: false }));
    }
  }, [isAuthenticated, sessionValid, authLoading]);

  const handleInputChange = (field: keyof SearchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // PHASE 2 FIX: Enhanced search function with intelligent retry and better error handling
  const performEnhancedSearch = async (retryAttempt = 0) => {
    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter at least a name to search",
        variant: "destructive",
      });
      return;
    }

    // Update search state
    setSearchState(prev => ({ 
      ...prev, 
      isSearching: true, 
      searchMode: searchState.searchMode,
      retryCount: retryAttempt 
    }));
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

      // PHASE 2 FIX: Clear separation of educational vs real search logic
      const allResults: SearchResult[] = [];
      let totalSearchCost = 0;
      
      // Real API Search for authenticated users with valid sessions
      if (searchState.useRealAPI && isAuthenticated && sessionValid) {
        console.log('Initiating real API search via Edge Function');
        
        setSearchProgress({
          phase: 'Connecting to Live APIs',
          progress: 5,
          currentQuery: 'Authenticating with SerpAPI and ScraperAPI (may take 25-35 seconds)...',
          totalQueries: 1,
          completedQueries: 0
        });

        try {
          // PHASE 2 FIX: Automatic session refresh if needed
          if (!sessionValid) {
            console.log('Session invalid, attempting refresh before API call...');
            const refreshed = await refreshSession();
            if (!refreshed) {
              throw new Error('Session refresh failed - please sign in again');
            }
          }

          setSearchProgress(prev => ({
            ...prev,
            phase: 'Processing Real API Search',
            progress: 15,
            currentQuery: 'Executing comprehensive search with live APIs...'
          }));

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
            searchState.searchMode,
            !!formData.email
          );

          if (apiResponse.success && apiResponse.results.length > 0) {
            allResults.push(...apiResponse.results);
            totalSearchCost = apiResponse.cost;
            
            setSearchState(prev => ({ ...prev, searchCost: totalSearchCost }));

            setSearchProgress(prev => ({
              ...prev,
              phase: 'Processing Live Results',
              progress: 85,
              currentQuery: `Successfully processed ${apiResponse.results.length} real results from live APIs`,
              completedQueries: 1
            }));

            toast({
              title: "Live API Search Successful",
              description: `Found ${apiResponse.results.length} real results. Cost: $${totalSearchCost.toFixed(4)}`,
              variant: "default",
            });
            
          } else {
            // PHASE 2 FIX: Intelligent retry logic for API failures
            if (retryAttempt < 2 && apiResponse.error?.includes('timeout')) {
              console.log(`API timeout detected, retrying (attempt ${retryAttempt + 1}/2)...`);
              
              setSearchProgress(prev => ({
                ...prev,
                phase: 'Retrying Search',
                progress: 25,
                currentQuery: `Timeout detected, retrying search (attempt ${retryAttempt + 1}/2)...`
              }));

              // Retry after 2 seconds
              setTimeout(() => {
                performEnhancedSearch(retryAttempt + 1);
              }, 2000);
              return;
            }
            
            throw new Error(apiResponse.error || 'No real results found from live APIs');
          }
          
        } catch (apiError: any) {
          console.error('Real API search error:', apiError);
          
          // PHASE 2 FIX: Enhanced error categorization and handling
          let errorCategory = 'general';
          let shouldRetry = false;
          
          if (apiError.message?.includes('timeout') || apiError.message?.includes('Timeout')) {
            errorCategory = 'timeout';
            shouldRetry = retryAttempt < 2;
          } else if (apiError.message?.includes('Authentication') || apiError.message?.includes('401')) {
            errorCategory = 'auth';
            shouldRetry = false;
          } else if (apiError.message?.includes('credits') || apiError.message?.includes('quota')) {
            errorCategory = 'credits';
            shouldRetry = false;
          }

          if (shouldRetry) {
            console.log(`Error category: ${errorCategory}, retrying (attempt ${retryAttempt + 1}/2)...`);
            
            setSearchProgress(prev => ({
              ...prev,
              phase: 'Retrying After Error',
              progress: 30,
              currentQuery: `${errorCategory} error detected, retrying (attempt ${retryAttempt + 1}/2)...`
            }));

            setTimeout(() => {
              performEnhancedSearch(retryAttempt + 1);
            }, 3000);
            return;
          }

          // Final error handling - no more retries
          const errorMessages = {
            timeout: "Search timeout - APIs are taking longer than expected. Please try again in a few moments.",
            auth: "Authentication error - please sign out and sign in again to refresh your session.",
            credits: "API credits exhausted - please check your API usage and billing.",
            general: `Real API search failed: ${apiError.message}. Please check your connection and try again.`
          };

          toast({
            title: "API Search Failed", 
            description: errorMessages[errorCategory as keyof typeof errorMessages],
            variant: "destructive",
          });
          
          throw apiError;
        }
        
      } else if (!isAuthenticated) {
        // Educational mode for non-authenticated users
        console.log('User not authenticated - showing educational content');
        
        setSearchProgress({
          phase: 'Educational Content Generation',
          progress: 20,
          currentQuery: 'Generating educational search examples (sign in for real API results)',
          totalQueries: 8,
          completedQueries: 0
        });

        // Generate educational content with proper Google Dorks
        const allQueries = generateGoogleDorks(searchParams);
        const selectedQueries = allQueries.slice(0, 8);

        for (let i = 0; i < selectedQueries.length; i++) {
          const dork = selectedQueries[i];
          
          setSearchProgress(prev => ({
            ...prev,
            phase: `Educational ${dork.category} Examples`,
            progress: 20 + ((i + 1) / selectedQueries.length) * 60,
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
            console.warn(`Educational content generation failed for query: ${dork.query}`);
          }
        }

      } else {
        // Authenticated but session issues
        toast({
          title: "Session Issue",
          description: "Authentication session needs refresh. Please sign out and sign in again.",
          variant: "destructive",
        });
        return;
      }

      // PHASE 2 FIX: Enhanced result processing with better progress tracking
      setSearchProgress(prev => ({
        ...prev,
        phase: 'Processing Results',
        progress: 90,
        currentQuery: 'Analyzing and scoring results...'
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
      dispatch({ type: 'SET_LOW_RESULTS', payload: sortedResults.length < 3 && isAuthenticated });

      setSearchProgress({
        phase: 'Complete',
        progress: 100,
        currentQuery: `Found ${sortedResults.length} results with ${extractedEntities.length} entities`,
        totalQueries: 1,
        completedQueries: 1
      });

      // Success messages based on search type
      if (searchState.useRealAPI) {
        toast({
          title: "Live Search Complete",
          description: `Found ${sortedResults.length} real results${totalSearchCost > 0 ? `. Cost: $${totalSearchCost.toFixed(4)}` : ''}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Educational Search Complete",
          description: `Generated ${sortedResults.length} educational examples. Sign in for real API results.`,
          variant: "default",
        });
      }

    } catch (error: any) {
      console.error('Search error:', error);
      
      toast({
        title: "Search Error",
        description: error?.message || "An error occurred during the search. Please try again.",
        variant: "destructive",
      });
      
    } finally {
      setSearchState(prev => ({ ...prev, isSearching: false }));
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

  // PHASE 2 FIX: Enhanced reset function with proper state cleanup
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
    setSearchState(prev => ({ 
      ...prev, 
      searchCost: 0, 
      retryCount: 0,
      isSearching: false 
    }));
  };

  return (
    <div className="space-y-6">
      <ConsentWarning variant="prominent" />
      
      <AuthComponent />
      
      <ApiKeyTester />
      
        {/* ScraperAPI Management */}
        <ScraperAPIManager onApiKeyUpdate={(hasAPI) => 
          setSearchState(prev => ({ ...prev, hasScraperAPI: hasAPI }))
        } />

        {/* Search History */}
        <SearchHistory />
      
      <Card className="border-primary/20">
        <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary" />
              <span>{searchState.searchMode === 'deep' ? 'Deep Search' : 'Enhanced Pro Search'} with Google Dorks</span>
              <Badge variant="default" className="ml-2">
                {searchState.searchMode === 'enhanced' ? 'Maximum Accuracy' : 'Industry-Grade'}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {searchState.searchMode === 'enhanced' 
                ? 'Most comprehensive OSINT search with intelligent filtering and enhanced accuracy based on training data'
                : 'Fast comprehensive OSINT search using strategic Google Dorks - Real APIs, no mock data'
              }
            </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Mode Selection */}
          <Tabs value={searchState.searchMode} onValueChange={(value) => 
            setSearchState(prev => ({ ...prev, searchMode: value as 'deep' | 'enhanced' }))
          }>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deep" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Deep Search</span>
              </TabsTrigger>
              <TabsTrigger value="enhanced" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Enhanced Pro</span>
                {searchState.hasScraperAPI && <Badge variant="secondary" className="text-xs px-1">Pro</Badge>}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="deep" className="text-sm text-muted-foreground">
              Fast comprehensive search with 12 strategic queries including business records, social media, and public data
            </TabsContent>
            <TabsContent value="enhanced" className="text-sm text-muted-foreground">
              {searchState.hasScraperAPI ? (
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
                {searchState.useRealAPI ? (
                  <>Real SerpAPI & Hunter.io results via Edge Function
                  {searchState.searchCost > 0 && ` • Last search cost: $${searchState.searchCost.toFixed(4)}`}
                  {searchState.retryCount > 0 && ` • Retry attempts: ${searchState.retryCount}`}</>
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
              onClick={() => performEnhancedSearch()}
              disabled={searchState.isSearching || !formData.name.trim()}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {searchState.isSearching ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  {searchState.retryCount > 0 ? `Retrying... (${searchState.retryCount}/2)` : 'Searching...'}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Run Enhanced Search
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={searchState.isSearching}>
              Reset Form
            </Button>
          </div>

          {/* PHASE 2 FIX: Enhanced progress indicator with real-time API status */}
          {searchState.isSearching && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium">{searchProgress.phase}</span>
                      {searchState.retryCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Retry {searchState.retryCount}/2
                        </Badge>
                      )}
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
                  
                  {searchState.useRealAPI && (
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      <span>Live API Search Active • Estimated time: 25-35 seconds</span>
                    </div>
                  )}
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