// supabase/functions/search-proxy/index.ts
// Supabase Edge Function (TypeScript)
// Handles /search-proxy requests, calls SerpAPI primarily, falls back to other providers,
// uses configurable timeout + retry/backoff, adaptive filtering, inserts results then entities
// linking via result_hash -> id mapping.
//
// ENV (set in Supabase Function secrets):
//   SERPAPI_API_KEY
//   SCRAPERAPI_API_KEY
//   FIRECRAWL_KEY (if used)
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SEARCH_TIMEOUT_MS (optional, default 60000ms)
//   MAX_RETRIES (optional, default 2)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SERPAPI_KEY = Deno.env.get('SERPAPI_API_KEY') || '';
const SCRAPERAPI_KEY = Deno.env.get('SCRAPERAPI_API_KEY') || '';
const FIRECRAWL_KEY = Deno.env.get('FIRECRAWL_KEY') || '';

const DEFAULT_SEARCH_TIMEOUT_MS = Number(Deno.env.get('SEARCH_TIMEOUT_MS') || 60000);
const MAX_RETRIES = Number(Deno.env.get('MAX_RETRIES') ?? 2);

function sha1Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  return crypto.subtle.digest('SHA-1', data).then(hash => {
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

function normalizeText(s?: string) {
  return (s || '').trim();
}

function textSimilarity(a = '', b = '') {
  const tokenize = (s: string) => s.toLowerCase().split(/\W+/).filter(Boolean);
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));
  if (!A.size || !B.size) return 0;
  const inter = [...A].filter(x => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return inter / union;
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = DEFAULT_SEARCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(input, { ...init, signal: controller.signal });
    clearTimeout(tid);
    return resp;
  } catch (err) {
    clearTimeout(tid);
    throw err;
  }
}

/** Retry with exponential backoff for transient errors */
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = MAX_RETRIES, initialMs = 500): Promise<T> {
  let attempt = 0;
  let lastErr: any = null;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (err?.name === 'AbortError') throw err;
      const wait = initialMs * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * Math.min(1000, wait));
      await new Promise(res => setTimeout(res, wait + jitter));
      attempt++;
    }
  }
  throw lastErr;
}

/** Primary provider: SerpAPI (Google results) */
async function serpApiSearch(q: string, page = 1) {
  if (!SERPAPI_KEY) throw new Error('SerpAPI not configured');
  const start = (page - 1) * 10;
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&start=${start}&api_key=${encodeURIComponent(SERPAPI_KEY)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SerpAPI error ${res.status}: ${text}`);
  }
  const json = await res.json();
  const items = json.organic_results || json.organic || [];
  const mapped = items.map((it: any) => ({
    title: it.title || it.position_title || '',
    snippet: it.snippet || it.rich_snippet?.top?.entries?.map((e:any)=>e?.snippet).join(' ') || '',
    url: it.link || it.url || it.canonical,
    source: 'serpapi',
    confidence: it.position ? Math.max(0.2, 1 - (it.position / 50)) : 0.5,
    raw: it,
    entities: extractEntitiesFromSnippet(it.snippet || ''),
    costEstimate: 0.01
  }));
  return { provider: 'serpapi', items: mapped, raw: json };
}

/** Fallback provider: ScraperAPI for specific site scraping */
async function scraperApiSearch(q: string) {
  if (!SCRAPERAPI_KEY) throw new Error('ScraperAPI not configured');
  const url = `http://api.scraperapi.com?api_key=${encodeURIComponent(SCRAPERAPI_KEY)}&q=${encodeURIComponent(q)}&autoparse=true`;
  const res = await fetchWithTimeout(url, {}, DEFAULT_SEARCH_TIMEOUT_MS / 1.5);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`ScraperAPI error ${res.status}: ${txt}`);
  }
  const json = await res.json();
  const candidates: any[] = [];
  if (Array.isArray(json.articles)) {
    json.articles.forEach((a:any) => {
      candidates.push({
        title: a.title || '',
        snippet: a.description || a.excerpt || '',
        url: a.url || a.link,
        source: 'scraperapi',
        confidence: 0.4,
        raw: a,
        entities: extractEntitiesFromSnippet(a.description || a.excerpt || '')
      });
    });
  }
  return { provider: 'scraperapi', items: candidates, raw: json };
}

/** (Optional) Firecrawl usage - placeholder for advanced crawling */
async function firecrawlSearch(q: string) {
  if (!FIRECRAWL_KEY) throw new Error('Firecrawl not configured');
  return { provider: 'firecrawl', items: [], raw: null };
}

/** Lightweight heuristic entity extraction */
function extractEntitiesFromSnippet(snippet: string) {
  if (!snippet) return [];
  const entities: any[] = [];
  
  const phoneMatch = snippet.match(/(\+?\d{1,2}[-.\s]?)?(\(?\d{3}\)?)[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    entities.push({ type: 'phone', value: phoneMatch[0], confidence: 0.4 });
  }
  
  const emailMatch = snippet.match(/[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  if (emailMatch) {
    entities.push({ type: 'email', value: emailMatch[0], confidence: 0.6 });
  }
  
  const nameMatches = snippet.match(/\b([A-Z][a-z]{2,}\s[A-Z][a-z]{2,})\b/g);
  if (nameMatches) {
    nameMatches.slice(0,3).forEach((nm: string) => entities.push({ type: 'person', value: nm, confidence: 0.18 }));
  }
  return entities;
}

/** Adaptive filtering */
function filterResults(allResults: any[], searchQuery: string) {
  const SOFT_ENTITY_CONFIDENCE = 0.15;
  const MIN_ENTITIES_ACCEPT = 2;

  return allResults.filter(result => {
    if (Array.isArray(result.entities) && result.entities.some((e:any) => (e.confidence ?? 0) >= SOFT_ENTITY_CONFIDENCE)) return true;
    if (Array.isArray(result.entities) && result.entities.length >= MIN_ENTITIES_ACCEPT) return true;
    if (result.url && result.title && textSimilarity(result.title, searchQuery) > 0.35) return true;
    if (typeof result.confidence === 'number' && result.confidence >= 0.3) return true;
    return false;
  });
}

function combineConfidence(original: number | undefined, recalculated: number) {
  const MIN = 0.05, MAX = 0.99;
  const orig = typeof original === 'number' ? original : MIN;
  const combined = Math.max(orig, (orig * 0.7) + (recalculated * 0.3));
  return Math.min(MAX, Math.max(MIN, combined));
}

function calculateIntelligentConfidence(value: string, type: string, searchParams: any) {
  let base = 0.2;
  if (type === 'email') base = 0.6;
  if (type === 'phone') base = 0.4;
  if (type === 'person') base = 0.25;
  
  if (searchParams && searchParams.query && value && textSimilarity(String(searchParams.query), String(value)) > 0.2) {
    base += 0.2;
  }
  return Math.min(0.95, base);
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || url.searchParams.get('query') || '').trim();
    const page = Number(url.searchParams.get('page') || '1');
    if (!q) return new Response(JSON.stringify({ error: 'missing query q param' }), { status: 400 });

    const normalizedParams = JSON.stringify({ q: q.toLowerCase().trim(), page });
    const search_hash = await sha1Hex(normalizedParams);

    const sessionPayload = {
      user_id: url.searchParams.get('user_id') || null,
      search_params: { query: q, page, search_hash },
      status: 'running',
      created_at: new Date().toISOString()
    };

    const { data: sessionInsert, error: sessionErr } = await supabase
      .from('search_sessions')
      .insert(sessionPayload)
      .select('id')
      .single();

    if (sessionErr || !sessionInsert?.id) {
      console.error('failed creating search session', sessionErr);
      return new Response(JSON.stringify({ error: 'failed creating session', details: sessionErr }), { status: 500 });
    }
    const sessionId = sessionInsert.id;

    const providers: Array<() => Promise<any>> = [
      () => retryWithBackoff(() => serpApiSearch(q, page), MAX_RETRIES),
      () => retryWithBackoff(() => scraperApiSearch(q), MAX_RETRIES),
      () => retryWithBackoff(() => firecrawlSearch(q), MAX_RETRIES).catch(() => ({ provider: 'firecrawl', items: [], raw: null }))
    ];

    const providerResults: any[] = [];
    for (const p of providers) {
      try {
        const res = await p();
        if (res && Array.isArray(res.items) && res.items.length > 0) providerResults.push(res);
        await new Promise(r => setTimeout(r, 120));
      } catch (err) {
        console.warn('provider failed', err);
      }
    }

    let allResults: any[] = [];
    let totalCost = 0;
    for (const pr of providerResults) {
      const items = pr.items || [];
      allResults = allResults.concat(items);
      totalCost += items.reduce((s:any, it:any) => s + (it.costEstimate || 0), 0);
    }

    if (!allResults.length) {
      await supabase
        .from('search_sessions')
        .update({ status: 'no_results', finished_at: new Date().toISOString(), total_cost: totalCost })
        .eq('id', sessionId);
      return new Response(JSON.stringify({ success: true, results: [], rawResults: [], filteredOutCount: 0, sessionId, totalCost }), { status: 200 });
    }

    const enhancedResults = allResults.map((result) => {
      if (Array.isArray(result.entities) && result.entities.length > 0) {
        result.entities = result.entities.map((entity:any) => {
          const recalculated = calculateIntelligentConfidence(entity.value, entity.type, { query: q, page });
          const combined = combineConfidence(entity.confidence, recalculated);
          return { ...entity, confidence: combined };
        });
      }
      return result;
    });

    const filtered = filterResults(enhancedResults, q);
    const filteredOutCount = enhancedResults.length - filtered.length;

    const resultsPayload = await Promise.all(enhancedResults.map(async (r, idx) => {
      const title = normalizeText(r.title) || null;
      const urlVal = normalizeText(r.url) || null;
      const hash = await sha1Hex(`${title || ''}|${urlVal || ''}`);
      return {
        session_id: sessionId,
        title,
        snippet: r.snippet || null,
        url: urlVal,
        source: r.source || null,
        confidence_score: typeof r.confidence === 'number' ? r.confidence : null,
        raw: r.raw ? JSON.stringify(r.raw) : null,
        result_hash: hash,
        cost_estimate: r.costEstimate ?? 0
      };
    }));

    const { data: insertedResults, error: insertResErr } = await supabase
      .from('search_results')
      .insert(resultsPayload)
      .select('id, result_hash');

    if (insertResErr) {
      console.error('failed inserting results', insertResErr);
      await supabase.from('search_sessions').update({ status: 'results_insert_failed', finished_at: new Date().toISOString() }).eq('id', sessionId);
      return new Response(JSON.stringify({ error: 'failed inserting results', details: insertResErr }), { status: 500 });
    }

    const resultIdByHash: Record<string, number> = {};
    for (const row of insertedResults as any[]) {
      if (row.result_hash && row.id) resultIdByHash[row.result_hash] = row.id;
    }

    const extractedEntitiesPayload: any[] = [];
    for (let idx = 0; idx < enhancedResults.length; idx++) {
      const r = enhancedResults[idx];
      const title = normalizeText(r.title) || '';
      const urlVal = normalizeText(r.url) || '';
      const hash = await sha1Hex(`${title}|${urlVal}`);
      const sourceId = resultIdByHash[hash] ?? null;
      if (!Array.isArray(r.entities) || r.entities.length === 0) continue;
      r.entities.forEach((ent:any) => {
        extractedEntitiesPayload.push({
          session_id: sessionId,
          source_result_id: sourceId,
          entity_type: ent.type,
          entity_value: ent.value,
          confidence_score: ent.confidence ?? null,
          raw: ent.raw ? JSON.stringify(ent.raw) : null
        });
      });
    }

    if (extractedEntitiesPayload.length > 0) {
      const { error: entitiesErr } = await supabase.from('extracted_entities').insert(extractedEntitiesPayload);
      if (entitiesErr) {
        console.error('failed inserting entities', entitiesErr);
        await supabase.from('search_sessions').update({ status: 'entities_insert_partial', finished_at: new Date().toISOString() }).eq('id', sessionId);
      }
    }

    await supabase
      .from('search_sessions')
      .update({ status: 'complete', finished_at: new Date().toISOString(), total_cost: totalCost })
      .eq('id', sessionId);

    const finalResults = await Promise.all(filtered.map(async (r:any) => ({
      title: r.title,
      snippet: r.snippet,
      url: r.url,
      source: r.source,
      confidence: r.confidence,
      raw: r.raw,
      result_hash: await sha1Hex(`${normalizeText(r.title)}|${normalizeText(r.url)}`)
    })));

    return new Response(JSON.stringify({
      success: true,
      results: finalResults,
      rawResults: enhancedResults,
      filteredOutCount,
      sessionId,
      totalCost
    }), { status: 200 });
  } catch (err: any) {
    console.error('search-proxy error', err);
    return new Response(JSON.stringify({
      success: false,
      error: err?.message || String(err),
      details: err
    }), { status: 500 });
  }
});