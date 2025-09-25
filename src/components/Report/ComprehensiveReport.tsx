// src/components/Report/ComprehensiveReport.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ReportProps = { sessionId: number | string };

export default function ComprehensiveReport({ sessionId }: ReportProps) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('search_sessions')
          .select(`
            id, search_params, status, created_at, total_cost,
            search_results (
              id, title, snippet, url, source, confidence_score, result_hash,
              extracted_entities ( id, entity_type, entity_value, confidence_score, verified, source_result_id)
            )
          `)
          .eq('id', String(sessionId))
          .single();

        if (error) throw error;
        setSession(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  if (!sessionId) return <div className="p-3">No session selected.</div>;
  if (loading) return <div className="p-3">Loading report…</div>;
  if (error) return <div className="p-3 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-4 p-3">
      <h3 className="text-xl font-semibold">Comprehensive Report — Session {session.id}</h3>
      <div className="text-sm text-muted">Created: {new Date(session.created_at).toLocaleString()}</div>
      <div className="text-sm">Status: {session.status}</div>
      <div className="text-sm">Estimated cost: {session.total_cost ?? 'Unknown'}</div>

      <section className="mt-3 space-y-2">
        {Array.isArray(session.search_results) && session.search_results.length > 0 ? (
          session.search_results.map((res: any) => (
            <div key={res.id} className="border rounded p-3 bg-white">
              <div className="flex justify-between">
                <div>
                  <a href={res.url} target="_blank" rel="noreferrer" className="text-lg font-semibold">{res.title || res.url}</a>
                  <div className="text-xs text-muted">{res.source}</div>
                </div>
                <div className="text-sm">Conf: {res.confidence_score ? `${Math.round(res.confidence_score*100)}%` : '—'}</div>
              </div>
              {res.snippet && <p className="mt-2 text-sm">{res.snippet}</p>}

              <div className="mt-3 text-sm">
                <strong>Extracted Entities</strong>
                {Array.isArray(res.extracted_entities) && res.extracted_entities.length > 0 ? (
                  <ul className="list-disc ml-5 mt-1 text-xs">
                    {res.extracted_entities.map((ent: any) => (
                      <li key={ent.id}>
                        <span className="font-medium">{ent.entity_type}</span>: {ent.entity_value} — {ent.confidence_score ? `${Math.round(ent.confidence_score*100)}%` : '—'}
                        {ent.verified && <span className="ml-2 text-green-600">[verified]</span>}
                      </li>
                    ))}
                  </ul>
                ) : <div className="text-xs mt-1">No entities extracted from this result.</div>}
              </div>
            </div>
          ))
        ) : (
          <div className="p-2 bg-yellow-50 border rounded text-sm">No results recorded in this session.</div>
        )}
      </section>
    </div>
  );
}