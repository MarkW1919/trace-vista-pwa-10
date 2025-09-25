// src/components/tabs/EnhancedBasicSearchTab.tsx
// React + TypeScript component for the Enhanced Basic Search tab.
// Replaces window.location.reload() behavior, persists search state across auth refresh,
// provides classified error handling, and deterministic progress phases.

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSkipTracing } from '@/contexts/SkipTracingContext';
import { ConsentWarning } from '@/components/ConsentWarning';
import { AuthComponent } from '@/components/AuthComponent';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { SearchHistory } from '@/components/SearchHistory';
import { SearchResults } from '@/components/SearchResults';
import { LowResultsWarning } from '@/components/LowResultsWarning';
import { RealOSINTGuide } from '@/components/RealOSINTGuide';

type SearchParams = {
  query: string;
  page?: number;
  user_id?: string | null;
};

type SearchState = {
  isSearching: boolean;
  error: string | null;
  results: any[];
  rawResults?: any[];
  filteredOutCount?: number;
  sessionId?: string | null;
};

type ProgressState = {
  phase: 'idle' | 'queued' | 'fetching' | 'extracting' | 'persisting' | 'complete';
  progress: number;
  currentQuery: string;
  totalQueries: number;
  completedQueries: number;
  startedAt?: number;
};

interface EnhancedBasicSearchTabProps {
  searchMode?: 'deep' | 'enhanced';
  onNavigateToReport?: () => void;
}

const STORAGE_KEY = 'tracevista_pending_search_state_v1';
const SEARCH_FUNCTION_PATH = '/functions/v1/search-proxy';

const EnhancedBasicSearchTab: React.FC<EnhancedBasicSearchTabProps> = ({ 
  searchMode = 'enhanced', 
  onNavigateToReport 
}) => {
  const { toast } = useToast();
  const { user, isAuthenticated, sessionValid, refreshSession } = useAuth();
  const { 
    setSearchResults, 
    setExtractedEntities, 
    searchHistory, 
    addToSearchHistory,
    currentSearchQuery,
    setCurrentSearchQuery 
  } = useSkipTracing();
  
  const [searchParams, setSearchParams] = useState<SearchParams>({ query: '', page: 1 });
  const [searchState, setSearchState] = useState<SearchState>({ isSearching: false, error: null, results: [] });
  const [searchProgress, setSearchProgress] = useState<ProgressState>({
    phase: 'idle',
    progress: 0,
    currentQuery: '',
    totalQueries: 1,
    completedQueries: 0,
  });

  const inFlightAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    // Restore pending state on mount
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.searchParams) setSearchParams(parsed.searchParams);
        if (parsed?.searchState) setSearchState((prev) => ({ ...prev, ...parsed.searchState }));
        if (parsed?.searchProgress) setSearchProgress(parsed.searchProgress);
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.warn('Failed to restore search state', err);
      }
    }
  }, []);

  // Save to localStorage helper
  function persistSearchState() {
    const snapshot = { searchParams, searchState, searchProgress };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (err) {
      console.warn('persistSearchState failed', err);
    }
  }

  // Helper to compute progress percent
  function computePercent(phaseIndex: number, totalPhases = 4) {
    return Math.min(100, Math.round(((phaseIndex) / totalPhases) * 100));
  }

  // Validate/refresh session before API call — attempts server-side refresh before failing
  async function ensureValidSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('supabase.getSession error', error);
      }
      if (!session) {
        // Attempt session refresh directly with Supabase
        try {
          const refreshed = await refreshSession();
          if (refreshed) {
            return true;
          } else {
            return false;
          }
        } catch (err) {
          console.warn('session refresh attempt failed', err);
          return false;
        }
      }
      // Optionally check expiry window
      if (session && (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000) + 60)) {
        // token expires soon - attempt refresh
        try {
          const refreshed = await refreshSession();
          if (refreshed) {
            return true;
          }
        } catch (err) {
          console.warn('refresh failed', err);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error('ensureValidSession error', err);
      return false;
    }
  }

  function classifyErrorMessage(err: any) {
    if (!err) return 'An unexpected error occurred.';
    const msg = String(err?.message || err);
    if (/timeout|timed out|AbortError/i.test(msg)) return 'The search timed out. Try again or simplify your query.';
    if (/auth|401|unauthorized/i.test(msg)) return 'Authentication error. Please sign back in.';
    if (/rate limit|429/i.test(msg)) return 'Rate limit reached. Try again in a few seconds.';
    if (/no results/i.test(msg)) return 'No results found for these search parameters.';
    return msg;
  }

  async function doSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    // Clear prior state
    setSearchState({ isSearching: true, error: null, results: [] });
    setSearchProgress({
      phase: 'queued',
      progress: 0,
      currentQuery: searchParams.query || '',
      totalQueries: 1,
      completedQueries: 0,
      startedAt: Date.now()
    });

    // ensure authenticated
    const okSession = await ensureValidSession();
    if (!okSession) {
      const msg = 'Please sign in to use real API search';
      setSearchState(prev => ({ ...prev, isSearching: false, error: msg }));
      toast({ title: 'Auth required', description: msg, variant: 'destructive' });
      return;
    }

    // Persist state before potentially disruptive operations
    persistSearchState();

    // Abort any previous inflight
    if (inFlightAbort.current) {
      try { inFlightAbort.current.abort(); } catch (err) { /* ignore */ }
    }
    const controller = new AbortController();
    inFlightAbort.current = controller;

    try {
      // Start fetching
      setSearchProgress(prev => ({ ...prev, phase: 'fetching', progress: computePercent(1) }));

      const params = new URLSearchParams();
      params.set('q', searchParams.query || '');
      params.set('page', String(searchParams.page || 1));
      // Optionally include user id if available: get from supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) params.set('user_id', user.id);

      // call supabase function — note: path depends on your deployment; adjust if necessary
      const endpoint = `${SEARCH_FUNCTION_PATH}?${params.toString()}`;
      const resp = await fetch(endpoint, { method: 'GET', signal: controller.signal });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Search function failed: ${resp.status} ${text}`);
      }

      const json = await resp.json();

      // Phase: extracting/persisting
      setSearchProgress(prev => ({ ...prev, phase: 'extracting', progress: computePercent(2) }));

      // If the function provided rawResults/debug info, keep it
      const results = Array.isArray(json.results) ? json.results : [];
      const rawResults = Array.isArray(json.rawResults) ? json.rawResults : [];
      const filteredOutCount = typeof json.filteredOutCount === 'number' ? json.filteredOutCount : 0;

      // Update persisted progress
      setSearchProgress(prev => ({ ...prev, phase: 'persisting', progress: computePercent(3) }));

      // Finalize UI state
      setSearchState({
        isSearching: false,
        error: null,
        results,
        rawResults,
        filteredOutCount,
        sessionId: json.sessionId || null
      });

      setSearchProgress(prev => ({ ...prev, phase: 'complete', progress: 100, completedQueries: prev.totalQueries }));

      // Clear local persisted snapshot as it completed
      try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }

      // show helpful note if items were filtered
      if (filteredOutCount && filteredOutCount > 0) {
        toast({
          title: 'Results filtered',
          description: `${filteredOutCount} results were filtered out by heuristics. Try broadening your query or check advanced settings.`,
          variant: 'default'
        });
      }
    } catch (err: any) {
      // classify error message and set state
      const userMessage = classifyErrorMessage(err);
      setSearchState(prev => ({ ...prev, isSearching: false, error: userMessage }));
      setSearchProgress(prev => ({ ...prev, phase: 'complete', progress: prev.progress || 100 }));
      toast({ title: 'Search failed', description: userMessage, variant: 'destructive' });
    } finally {
      // cleanup abort controller
      inFlightAbort.current = null;
    }
  }

  // UI Functions - simple handlers
  function onQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchParams(prev => ({ ...prev, query: e.target.value }));
  }
  function onPageChange(nextPage: number) {
    setSearchParams(prev => ({ ...prev, page: nextPage }));
  }

  return (
    <div className="space-y-6">
      <ConsentWarning />
      <AuthComponent />
      <ApiKeyManager />
      <SearchHistory />
      
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
          <form onSubmit={doSearch} className="grid grid-cols-1 gap-2">
            <label className="text-sm font-medium">Search Query</label>
            <input
              value={searchParams.query}
              onChange={onQueryChange}
              placeholder="Search people, phone, email, etc."
              className="border rounded p-2"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={searchState.isSearching} className="px-4 py-2 rounded bg-slate-800 text-white">
                {searchState.isSearching ? 'Searching…' : 'Search'}
              </button>
              <button type="button" onClick={() => { 
                setSearchState({ isSearching: false, error: null, results: [] }); 
                setSearchProgress({ phase: 'idle', progress: 0, currentQuery: '', totalQueries: 1, completedQueries: 0 }); 
                localStorage.removeItem(STORAGE_KEY); 
              }} className="px-3 py-2 border rounded">Reset</button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {searchState.isSearching && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{searchProgress.phase}</span>
                <span>{searchProgress.progress}%</span>
              </div>
              <Progress value={searchProgress.progress} />
              {searchProgress.currentQuery && (
                <p className="text-xs text-muted-foreground">
                  Current: {searchProgress.currentQuery}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Completed: {searchProgress.completedQueries} / {searchProgress.totalQueries || 1}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm">
        <div>Phase: <strong>{searchProgress.phase}</strong> — Progress: {searchProgress.progress}%</div>
        {searchProgress.startedAt && <div className="text-xs text-muted">Started: {new Date(searchProgress.startedAt).toLocaleString()}</div>}
      </div>

      {searchState.error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {searchState.error}
        </div>
      )}

      {/* Results area — only show "No results" after complete and no results */}
      {(!searchState.isSearching && searchProgress.phase === 'complete' && (searchState.results?.length || 0) === 0) && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          No real results found. Try adjusting your search parameters.
        </div>
      )}

      {/* Progressive results (if any) */}
      {Array.isArray(searchState.results) && searchState.results.length > 0 && (
        <div className="space-y-3">
          {searchState.results.map((r: any, i: number) => (
            <div key={r.result_hash || r.url || i} className="p-3 border rounded bg-white">
              <a href={r.url} target="_blank" rel="noreferrer" className="text-lg font-semibold">{r.title || r.url}</a>
              <div className="text-sm mt-1">{r.snippet}</div>
              <div className="text-xs mt-2 text-muted">Source: {r.source} — Confidence: {typeof r.confidence === 'number' ? (Math.round(r.confidence * 100) + '%') : '—'}</div>
            </div>
          ))}
        </div>
      )}

      {/* Raw debug results (collapsible) */}
      {Array.isArray(searchState.rawResults) && searchState.rawResults.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer">Show raw results & debug info</summary>
          <pre className="max-h-64 overflow-auto text-xs bg-slate-50 p-2 rounded mt-2">{JSON.stringify(searchState.rawResults, null, 2)}</pre>
        </details>
      )}

      {/* Low Results Warning */}
      {searchState.results.length > 0 && searchState.results.length < 3 && (
        <LowResultsWarning />
      )}

      {/* Results */}
      {searchState.results.length > 0 && (
        <>
          <SearchResults 
            results={searchState.results} 
            searchQuery={searchParams.query}
            onNavigateToReport={onNavigateToReport}
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
