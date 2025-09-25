// src/components/tabs/EnhancedBasicSearchTab.tsx
// React + TypeScript component for the Enhanced Basic Search tab.
// Refactored to use the useSearch hook for centralized search logic.

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSkipTracing } from '@/contexts/SkipTracingContext';
import { useSearch } from '@/hooks/useSearch';
import { ConsentWarning } from '@/components/ConsentWarning';
import { AuthComponent } from '@/components/AuthComponent';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { SearchHistory } from '@/components/SearchHistory';
import SearchResults from '@/components/SearchResults';
import { LowResultsWarning } from '@/components/LowResultsWarning';
import { RealOSINTGuide } from '@/components/RealOSINTGuide';

type SearchFormData = {
  name: string;
  city: string;
  state: string;
  dob: string;
  address: string;
  phone: string;
  email: string;
};

interface EnhancedBasicSearchTabProps {
  searchMode?: 'deep' | 'enhanced';
  onNavigateToReport?: () => void;
}

const EnhancedBasicSearchTab: React.FC<EnhancedBasicSearchTabProps> = ({ 
  searchMode = 'enhanced', 
  onNavigateToReport 
}) => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { state, dispatch } = useSkipTracing();
  
  // Form data state (kept in component)
  const [formData, setFormData] = useState<SearchFormData>({
    name: '',
    city: '',
    state: '',
    dob: '',
    address: '',
    phone: '',
    email: ''
  });

  // Use the search hook for all search-related state and logic
  const {
    isSearching,
    error,
    results,
    rawResults,
    filteredOutCount,
    sessionId,
    progress,
    performSearch
  } = useSearch({ 
    query: '', 
    page: 1, 
    user_id: user?.id || null 
  });

  const handleInputChange = (field: keyof SearchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const doSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate at least one field is filled
    const hasInput = formData.name.trim() || formData.email.trim() || formData.phone.trim();
    if (!hasInput) {
      toast({
        title: 'Input Required',
        description: 'Please provide at least a name, email, or phone number to search.',
        variant: 'destructive'
      });
      return;
    }
    
    // Build search query from form data
    const queryParts = [
      formData.name,
      formData.email,
      formData.phone,
      formData.city,
      formData.state,
      formData.address
    ].filter(Boolean);
    const searchQuery = queryParts.join(' ');
    
    // Use the hook to perform the search
    const result = await performSearch({ 
      query: searchQuery, 
      page: 1, 
      user_id: user?.id || null 
    });

    if (result?.success) {
      // Update global context with dispatch actions
      dispatch({ type: 'ADD_RESULTS', payload: results });
      dispatch({ type: 'ADD_TO_HISTORY', payload: `Enhanced Search: ${formData.name || 'Multi-field search'}` });

      // Show helpful note if items were filtered
      if (filteredOutCount && filteredOutCount > 0) {
        toast({
          title: 'Results filtered',
          description: `${filteredOutCount} results were filtered out by heuristics. Try broadening your query or check advanced settings.`,
          variant: 'default'
        });
      }
    } else if (result?.error) {
      toast({ 
        title: 'Search failed', 
        description: result.error, 
        variant: 'destructive' 
      });
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
  };

  return (
    <div className="space-y-6">
        <ConsentWarning />
        <AuthComponent />
        <ApiKeyManager />
        
        {state.searchHistory.length > 0 && <SearchHistory />}
      
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Basic Search</CardTitle>
          <Tabs value={searchMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deep">Deep Search</TabsTrigger>
              <TabsTrigger value="enhanced">Enhanced Search</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={isAuthenticated ? "default" : "secondary"}>
              {isAuthenticated ? "Authenticated" : "Demo Mode"}
            </Badge>
            <Badge variant={isAuthenticated ? "default" : "outline"}>
              {isAuthenticated ? "Real API" : "Educational"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="John Smith"
              disabled={isSearching}
              maxLength={100}
            />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john@example.com"
                disabled={isSearching}
                maxLength={255}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                disabled={isSearching}
                maxLength={20}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Los Angeles"
                disabled={isSearching}
                maxLength={100}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="CA"
                disabled={isSearching}
                maxLength={50}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => handleInputChange('dob', e.target.value)}
                disabled={isSearching}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main St, Los Angeles, CA 90210"
                disabled={isSearching}
                maxLength={200}
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={doSearch} 
              disabled={isSearching}
              className="flex-1"
              type="submit"
            >
              {isSearching ? 'Searching...' : 'Run Enhanced Search'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={isSearching}
            >
              Reset Form
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {isSearching && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{progress.phase}</span>
                <span>{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} />
              {progress.currentQuery && (
                <p className="text-xs text-muted-foreground">
                  Current: {progress.currentQuery}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Completed: {progress.completedQueries} / {progress.totalQueries || 1}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm">
        <div>Phase: <strong>{progress.phase}</strong> — Progress: {progress.progress}%</div>
        {progress.startedAt && <div className="text-xs text-muted">Started: {new Date(progress.startedAt).toLocaleString()}</div>}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Results area — only show "No results" after complete and no results */}
      {(!isSearching && progress.phase === 'complete' && (results?.length || 0) === 0) && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          No real results found. Try adjusting your search parameters.
        </div>
      )}

      {/* Progressive results (if any) */}
      {Array.isArray(results) && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r: any, i: number) => (
            <div key={r.result_hash || r.url || i} className="p-3 border rounded bg-white">
              <a href={r.url} target="_blank" rel="noreferrer" className="text-lg font-semibold">{r.title || r.url}</a>
              <div className="text-sm mt-1">{r.snippet}</div>
              <div className="text-xs mt-2 text-muted">Source: {r.source} — Confidence: {typeof r.confidence === 'number' ? (Math.round(r.confidence * 100) + '%') : '—'}</div>
            </div>
          ))}
        </div>
      )}

      {/* Raw debug results (collapsible) */}
      {Array.isArray(rawResults) && rawResults.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer">Show raw results & debug info</summary>
          <pre className="max-h-64 overflow-auto text-xs bg-slate-50 p-2 rounded mt-2">{JSON.stringify(rawResults, null, 2)}</pre>
        </details>
      )}

      {/* Low Results Warning */}
      {results.length > 0 && results.length < 3 && (
        <LowResultsWarning resultCount={results.length} />
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          <SearchResults 
            results={results}
            rawResults={rawResults}
            filteredOutCount={filteredOutCount}
            loading={isSearching}
          />
          
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Remember: Always verify information and respect privacy laws when conducting OSINT research.
            </p>
            <RealOSINTGuide />
          </div>
        </>
      )}
    </div>
  );
};

export default EnhancedBasicSearchTab;
