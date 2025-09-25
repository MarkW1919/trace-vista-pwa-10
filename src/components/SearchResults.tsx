// src/components/SearchResults.tsx
import React from 'react';

type Props = {
  results: any[];
  rawResults?: any[];
  filteredOutCount?: number;
  loading?: boolean;
};

export default function SearchResults({ results, rawResults, filteredOutCount, loading }: Props) {
  return (
    <div className="space-y-3">
      {loading && (
        <div className="p-3 bg-slate-50 border rounded text-sm">Searching… results will appear as they are found.</div>
      )}

      {filteredOutCount && filteredOutCount > 0 && (
        <div className="p-2 bg-yellow-50 border rounded text-xs">Note: {filteredOutCount} results were filtered out by heuristics. Try broadening your query.</div>
      )}

      {Array.isArray(results) && results.length > 0 ? (
        results.map((r: any, idx: number) => (
          <article key={r.result_hash || r.url || idx} className="p-3 border rounded bg-white">
            <a href={r.url} target="_blank" rel="noreferrer" className="text-lg font-semibold">{r.title || r.url}</a>
            {r.snippet && <p className="text-sm mt-1">{r.snippet}</p>}
            <div className="text-xs mt-2 text-muted">Source: {r.source} • Confidence: {typeof r.confidence === 'number' ? `${Math.round(r.confidence*100)}%` : '—'}</div>
          </article>
        ))
      ) : (!loading && (
        <div className="p-3 bg-yellow-50 border rounded text-sm">No real results found. Try adjusting your search parameters.</div>
      ))}

      {Array.isArray(rawResults) && rawResults.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm">Show raw results</summary>
          <pre className="mt-2 max-h-64 overflow-auto bg-slate-50 p-2 text-xs rounded">{JSON.stringify(rawResults, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}