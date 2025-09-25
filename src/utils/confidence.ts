// src/utils/confidence.ts

export const SOFT_ENTITY_CONFIDENCE = 0.15;
export const MIN_ENTITY_CONFIDENCE = 0.05;
export const MAX_ENTITY_CONFIDENCE = 0.99;

/** conservative combination of original and recalculated confidence */
export function combineConfidence(original?: number | null, recalculated = 0.2) {
  const orig = typeof original === 'number' ? original : MIN_ENTITY_CONFIDENCE;
  const combined = Math.max(orig, (orig * 0.7) + (recalculated * 0.3));
  return Math.min(MAX_ENTITY_CONFIDENCE, Math.max(MIN_ENTITY_CONFIDENCE, combined));
}

/** placeholder intelligent recalculation — keep server-side richer */
export function calculateIntelligentConfidence(value = '', type = 'unknown', searchParams?: any) {
  let base = 0.2;
  if (type === 'email') base = 0.6;
  if (type === 'phone') base = 0.4;
  if (type === 'person') base = 0.25;
  if (searchParams && searchParams.query && value && value.length > 1) {
    // basic token overlap boost
    const q = String(searchParams.query).toLowerCase();
    if (q.includes(String(value).toLowerCase())) base += 0.2;
  }
  return Math.min(MAX_ENTITY_CONFIDENCE, base);
}