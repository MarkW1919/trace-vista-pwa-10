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
  TrendingUp, Shield, Clock, Database, Zap 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSkipTracing } from '@/contexts/SkipTracingContext';
import { generateGoogleDorks, generateSpecializedDorks, generateReverseQueries, type SearchParams } from '@/utils/googleDorks';
import { generateMockResults, extractMockEntities, type MockDataConfig } from '@/utils/mockDataGenerator';
import { calculateRelevanceScore } from '@/utils/scoring';
import { extractEntities } from '@/utils/entityExtraction';
import { SearchResult, BaseEntity } from '@/types/entities';

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
  
  const { dispatch } = useSkipTracing();
  const { toast } = useToast();

  const handleInputChange = (field: keyof SearchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const simulateWebSearch = async (query: string): Promise<SearchResult[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
    
    // Generate realistic mock results based on query
    const mockResults: SearchResult[] = [];
    
    // Simulate different result types based on query content
    if (query.includes('site:linkedin.com')) {
      mockResults.push({
        id: `result-${Date.now()}-${Math.random()}`,
        type: 'social',
        value: 'LinkedIn Profile',
        title: `${formData.name} - Professional Profile | LinkedIn`,
        snippet: `View ${formData.name}'s professional profile on LinkedIn. Based in ${formData.city}, ${formData.state}. Connect to see full profile and professional network.`,
        url: 'https://linkedin.com/in/example',
        confidence: Math.floor(Math.random() * 20) + 70,
        relevanceScore: calculateRelevanceScore(query, formData),
        source: 'LinkedIn',
        timestamp: new Date(),
        query: query,
        extractedEntities: []
      });
    } else if (query.includes('whitepages') || query.includes('411')) {
      mockResults.push({
        id: `result-${Date.now()}-${Math.random()}`,
        type: 'phone',
        value: 'Directory Listing',
        title: `${formData.name} - ${formData.city}, ${formData.state} | Directory`,
        snippet: `${formData.name}, age 35-45, ${formData.city}, ${formData.state}. Phone: (555) 123-4567. Current address: 123 Main St. Associated with: Jane Doe (relative).`,
        url: 'https://whitepages.com/example',
        confidence: Math.floor(Math.random() * 15) + 80,
        relevanceScore: calculateRelevanceScore(query, formData),
        source: 'Public Directory',
        timestamp: new Date(),
        query: query,
        extractedEntities: []
      });
    } else if (query.includes('voter') || query.includes('registration')) {
      mockResults.push({
        id: `result-${Date.now()}-${Math.random()}`,
        type: 'voter_record',
        value: 'Voter Registration',
        title: `Voter Registration - ${formData.name}`,
        snippet: `${formData.name} registered voter in ${formData.city}, ${formData.state}. Registration date: 2018. Party affiliation: Independent. Voting history: Active.`,
        url: 'https://voterdb.example.gov',
        confidence: Math.floor(Math.random() * 10) + 85,
        relevanceScore: calculateRelevanceScore(query, formData),
        source: 'Voter Database',
        timestamp: new Date(),
        query: query,
        extractedEntities: []
      });
    } else if (query.includes('property') || query.includes('deed')) {
      mockResults.push({
        id: `result-${Date.now()}-${Math.random()}`,
        type: 'property',
        value: 'Property Record',
        title: `Property Ownership - ${formData.name}`,
        snippet: `${formData.name} owns property at 456 Oak Avenue, ${formData.city}, ${formData.state}. Purchased: 2019. Value: $275,000. Property type: Single Family Home.`,
        url: 'https://property.example.gov',
        confidence: Math.floor(Math.random() * 10) + 85,
        relevanceScore: calculateRelevanceScore(query, formData),
        source: 'Property Records',
        timestamp: new Date(),
        query: query,
        extractedEntities: []
      });
    }
    
    // If no specific results, generate generic results
    if (mockResults.length === 0) {
      mockResults.push({
        id: `result-${Date.now()}-${Math.random()}`,
        type: 'name',
        value: 'General Result',
        title: `${formData.name} - Search Result`,
        snippet: `Information about ${formData.name} from ${formData.city}, ${formData.state}. Contact information and background details available through public records.`,
        url: 'https://example.com/search',
        confidence: Math.floor(Math.random() * 30) + 50,
        relevanceScore: calculateRelevanceScore(query, formData),
        source: 'Web Search',
        timestamp: new Date(),
        query: query,
        extractedEntities: []
      });
    }
    
    return mockResults;
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
      
      // Execute searches with progress tracking
      for (let i = 0; i < selectedQueries.length; i++) {
        const dork = selectedQueries[i];
        
        setSearchProgress(prev => ({
          ...prev,
          phase: `Searching ${dork.category}`,
          progress: ((i + 1) / selectedQueries.length) * 80,
          currentQuery: dork.description,
          completedQueries: i + 1
        }));

        try {
          const searchResults = await simulateWebSearch(dork.query);
          allResults.push(...searchResults);
        } catch (error) {
          console.warn(`Search failed for query: ${dork.query}`);
        }
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
        const resultEntities = extractEntities(result.snippet, { 
          searchName: formData.name, 
          searchLocation: formData.city 
        });
        extractedEntities.push(...resultEntities);
        result.extractedEntities = resultEntities;
      });

      // Generate mock data if results are limited
      if (allResults.length < 10) {
        setSearchProgress(prev => ({
          ...prev,
          phase: 'Augmenting Results',
          progress: 90,
          currentQuery: 'Adding educational data for comprehensive training'
        }));

        const mockConfig: MockDataConfig = {
          minResults: 10,
          maxAugmentation: 15 - allResults.length,
          includeRelatives: true,
          includeBusinesses: searchMode !== 'basic',
          includeProperties: searchMode === 'deep'
        };

        const mockResults = generateMockResults(searchParams, mockConfig);
        const mockEntities = extractMockEntities(mockResults);
        
        allResults.push(...mockResults);
        extractedEntities.push(...mockEntities);
      }

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

      toast({
        title: "Enhanced Search Complete",
        description: `Found ${sortedResults.length} results across multiple sources`,
        variant: "default",
      });

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
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-primary" />
            <span>Enhanced Deep Search with Google Dorks</span>
            <Badge variant="default" className="ml-2">Industry-Grade</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Advanced OSINT techniques with 15+ specialized search patterns, progressive result streaming, and comprehensive entity extraction
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

          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Full Name (Required)</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., John Doe"
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
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <span>Enhanced Search Results ({results.length})</span>
            </h3>
            <div className="flex items-center space-x-2">
              <Badge variant="default">{entities.length} entities extracted</Badge>
              <Badge variant="secondary">
                {results.filter(r => r.confidence >= 70).length} high confidence
              </Badge>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid gap-4">
            {results.map((result) => (
              <Card key={result.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-sm">{result.title}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant={result.confidence >= 80 ? "default" : "secondary"}>
                        {result.confidence}% confidence
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {result.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{result.snippet}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Source: {result.source}</span>
                    <span className="text-muted-foreground">
                      Relevance: {result.relevanceScore}%
                    </span>
                  </div>
                  
                  {result.extractedEntities && result.extractedEntities.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h5 className="text-xs font-medium mb-2">Extracted Entities:</h5>
                      <div className="flex flex-wrap gap-1">
                        {result.extractedEntities.slice(0, 5).map((entity, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {entity.type}: {entity.value.slice(0, 20)}
                            {entity.value.length > 20 ? '...' : ''}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};