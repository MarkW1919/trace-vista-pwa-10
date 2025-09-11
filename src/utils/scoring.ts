import { SearchResult, BaseEntity } from '@/types/entities';
import { areSimilar, normalizeText } from './similarity';

/**
 * Calculate relevance score based on keyword matches and context
 */
export function calculateRelevanceScore(
  snippet: string, 
  searchParams: {
    name: string;
    city?: string;
    state?: string;
    phone?: string;
    email?: string;
  }
): number {
  let score = 0;
  const normalizedSnippet = normalizeText(snippet);
  
  // Name matching (highest weight)
  const nameWords = normalizeText(searchParams.name).split(' ');
  nameWords.forEach(word => {
    if (word.length > 2 && normalizedSnippet.includes(word)) {
      score += 25;
    }
  });
  
  // Location matching
  if (searchParams.city && normalizedSnippet.includes(normalizeText(searchParams.city))) {
    score += 15;
  }
  if (searchParams.state && normalizedSnippet.includes(normalizeText(searchParams.state))) {
    score += 10;
  }
  
  // Contact info matching
  if (searchParams.phone && normalizedSnippet.includes(searchParams.phone.replace(/\D/g, ''))) {
    score += 20;
  }
  if (searchParams.email && normalizedSnippet.includes(normalizeText(searchParams.email))) {
    score += 20;
  }
  
  // Keyword density bonus
  const keywordDensity = calculateKeywordDensity(snippet, [
    searchParams.name,
    searchParams.city || '',
    searchParams.state || ''
  ].filter(Boolean));
  
  score += Math.min(keywordDensity * 2, 10);
  
  // Source credibility weighting
  score += getSourceCredibilityBonus(snippet);
  
  return Math.min(score, 100);
}

/**
 * Calculate keyword density in text
 */
function calculateKeywordDensity(text: string, keywords: string[]): number {
  const words = normalizeText(text).split(' ');
  const totalWords = words.length;
  
  if (totalWords === 0) return 0;
  
  let keywordCount = 0;
  keywords.forEach(keyword => {
    const keywordWords = normalizeText(keyword).split(' ');
    keywordWords.forEach(word => {
      keywordCount += words.filter(w => w === word).length;
    });
  });
  
  return (keywordCount / totalWords) * 100;
}

/**
 * Get source credibility bonus based on URL patterns
 */
function getSourceCredibilityBonus(snippet: string): number {
  const credibleSources = [
    'whitepages', 'spokeo', 'fastpeoplesearch', 'truepeoplesearch',
    'familysearch', 'ancestry', 'findagrave', 'linkedin',
    'facebook', 'twitter', 'instagram', 'gov', 'edu'
  ];
  
  const lowerSnippet = snippet.toLowerCase();
  
  for (const source of credibleSources) {
    if (lowerSnippet.includes(source)) {
      return 5;
    }
  }
  
  return 0;
}

/**
 * Deduplicate search results based on similarity threshold
 */
export function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const unique: SearchResult[] = [];
  
  for (const result of results) {
    const isDuplicate = unique.some(existing => 
      areSimilar(existing.snippet, result.snippet, 0.8) ||
      areSimilar(existing.title, result.title, 0.9)
    );
    
    if (!isDuplicate) {
      unique.push(result);
    } else {
      // If it's a duplicate, keep the one with higher confidence
      const existingIndex = unique.findIndex(existing => 
        areSimilar(existing.snippet, result.snippet, 0.8)
      );
      
      if (existingIndex !== -1 && result.confidence > unique[existingIndex].confidence) {
        unique[existingIndex] = result;
      }
    }
  }
  
  return unique;
}

/**
 * Cross-verify entities across different results
 */
export function crossVerifyEntities(entities: BaseEntity[]): BaseEntity[] {
  const verified: BaseEntity[] = [];
  const entityGroups: { [key: string]: BaseEntity[] } = {};
  
  // Group similar entities
  entities.forEach(entity => {
    const key = `${entity.type}-${normalizeText(entity.value)}`;
    if (!entityGroups[key]) {
      entityGroups[key] = [];
    }
    entityGroups[key].push(entity);
  });
  
  // Process each group
  Object.values(entityGroups).forEach(group => {
    if (group.length === 1) {
      verified.push(group[0]);
    } else {
      // Multiple sources for same entity - boost confidence
      const bestEntity = group.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      const boostedEntity: BaseEntity = {
        ...bestEntity,
        confidence: Math.min(100, bestEntity.confidence + (group.length - 1) * 5),
        verified: true,
      };
      
      verified.push(boostedEntity);
    }
  });
  
  return verified;
}

/**
 * Calculate overall accuracy metrics for a report
 */
export function calculateAccuracyMetrics(results: SearchResult[], entities: BaseEntity[]) {
  const totalResults = results.length;
  const highConfidenceResults = results.filter(r => r.confidence >= 70).length;
  const verifiedEntities = entities.filter(e => e.verified).length;
  
  const overallConfidence = totalResults > 0 
    ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / totalResults)
    : 0;
  
  const dataQualityScore = totalResults > 0
    ? Math.round((highConfidenceResults / totalResults) * 100)
    : 0;
  
  return {
    overallConfidence,
    dataQualityScore,
    totalResults,
    highConfidenceResults,
    verifiedEntities,
    completeness: Math.min(100, (totalResults / 10) * 100), // Expect ~10 good results
  };
}

/**
 * Generate confidence intervals for statistical reporting
 */
export function calculateConfidenceInterval(scores: number[], confidence = 0.95): {
  mean: number;
  lower: number;
  upper: number;
} {
  if (scores.length === 0) {
    return { mean: 0, lower: 0, upper: 0 };
  }
  
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const standardError = Math.sqrt(variance / scores.length);
  
  // Simple approximation using normal distribution (z-score for 95% confidence ≈ 1.96)
  const zScore = confidence === 0.95 ? 1.96 : 2.58; // 99% confidence
  const margin = zScore * standardError;
  
  return {
    mean: Math.round(mean * 100) / 100,
    lower: Math.round((mean - margin) * 100) / 100,
    upper: Math.round((mean + margin) * 100) / 100,
  };
}
