// src/hooks/useSearch.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SearchParams = { query: string; page?: number; user_id?: string | null };
export type SearchProgress = {
  phase: 'idle' | 'queued' | 'fetching' | 'extracting' | 'persisting' | 'complete';
  progress: number;
  currentQuery: string;
  totalQueries: number;
  completedQueries: number;
  startedAt?: number;
};

export function useSearch(initial?: Partial<SearchParams>) {
  const [params, setParams] = useState<SearchParams>({ query: initial?.query || '', page: initial?.page || 1, user_id: initial?.user_id ?? null });
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [rawResults, setRawResults] = useState<any[] | undefined>(undefined);
  const [filteredOutCount, setFilteredOutCount] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState<SearchProgress>({
    phase: 'idle',
    progress: 0,
    currentQuery: '',
    totalQueries: 1,
    completedQueries: 0,
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // restore any pending state from localStorage
    try {
      const saved = localStorage.getItem('tracevista_pending_search_state_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.params) setParams(parsed.params);
        if (parsed?.results) setResults(parsed.results);
        if (parsed?.progress) setProgress(parsed.progress);
        localStorage.removeItem('tracevista_pending_search_state_v1');
      }
    } catch (err) {
      // ignore
    }
  }, []);

  const ensureSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // attempt server refresh
        try {
          const resp = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
          if (resp.ok) {
            const json = await resp.json();
            if (json?.access_token && json?.refresh_token) {
              await supabase.auth.setSession({ access_token: json.access_token, refresh_token: json.refresh_token });
              return true;
            }
          }
        } catch (err) {
          // ignore
        }
        return false;
      }
      // optionally refresh if expiring soon (left out for brevity)
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  const performSearch = useCallback(async (overrideParams?: Partial<SearchParams>) => {
    const p = { ...params, ...(overrideParams || {}) };
    setParams(p);
    setError(null);
    setIsSearching(true);
    setResults([]);
    setRawResults(undefined);
    setFilteredOutCount(0);
    setSessionId(null);
    setProgress(prev => ({ ...prev, phase: 'queued', progress: 0, currentQuery: p.query, startedAt: Date.now() }));

    const ok = await ensureSession();
    if (!ok) {
      setError('Authentication required. Please sign in.');
      setIsSearching(false);
      return;
    }

    // persist state
    try {
      localStorage.setItem('tracevista_pending_search_state_v1', JSON.stringify({ params: p, progress }));
    } catch (err) {}

    // abort previous
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch (e) {}
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setProgress(prev => ({ ...prev, phase: 'fetching', progress: 10 }));
      
      const searchParams = {
        q: p.query,
        page: p.page || 1,
        ...(p.user_id ? { user_id: p.user_id } : {})
      };

      const { data: json, error: functionError } = await supabase.functions.invoke('search-proxy', {
        body: searchParams
      });

      if (functionError) {
        throw new Error(`Search error: ${functionError.message}`);
      }
      setProgress(prev => ({ ...prev, phase: 'extracting', progress: 60 }));

      setResults(Array.isArray(json.results) ? json.results : []);
      setRawResults(Array.isArray(json.rawResults) ? json.rawResults : undefined);
      setFilteredOutCount(typeof json.filteredOutCount === 'number' ? json.filteredOutCount : 0);
      setSessionId(json.sessionId ?? null);

      setProgress(prev => ({ ...prev, phase: 'persisting', progress: 90 }));
      setIsSearching(false);
      setProgress(prev => ({ ...prev, phase: 'complete', progress: 100, completedQueries: prev.totalQueries }));
      // clear saved snapshot
      try { localStorage.removeItem('tracevista_pending_search_state_v1'); } catch (e) {}
      return { success: true, json };
    } catch (err: any) {
      const msg = (() => {
        if (!err) return 'Unknown error';
        const s = String(err.message || err);
        if (/timeout|AbortError/i.test(s)) return 'Search timed out. Try again.';
        if (/auth|401|unauthorized/i.test(s)) return 'Authentication error. Please sign in.';
        if (/rate limit|429/i.test(s)) return 'Rate limit reached. Try later.';
        return s;
      })();
      setError(msg);
      setIsSearching(false);
      setProgress(prev => ({ ...prev, phase: 'complete' }));
      return { success: false, error: msg };
    } finally {
      abortRef.current = null;
    }
  }, [params, ensureSession]);

  return {
    params,
    setParams,
    isSearching,
    error,
    results,
    rawResults,
    filteredOutCount,
    sessionId,
    progress,
    performSearch,
  };
}