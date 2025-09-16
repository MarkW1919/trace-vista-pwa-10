import { SearchResult, BaseEntity } from '@/types/entities';
import { areSimilar, normalizeText } from './similarity';

/**
 * Calculate relevance score with enhanced skip tracing logic
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
  
  // Name matching with fuzzy logic (highest weight for skip tracing)
  const nameWords = normalizeText(searchParams.name).split(' ');
  nameWords.forEach(word => {
    if (word.length > 2) {
      if (normalizedSnippet.includes(word)) {
        score += 30; // Increased for skip tracing
      }
      // Fuzzy matching for slight variations
      if (normalizedSnippet.includes(word.substring(0, word.length - 1))) {
        score += 15;
      }
    }
  });
  
  // Geographic intelligence for skip tracing
  if (searchParams.city && normalizedSnippet.includes(normalizeText(searchParams.city))) {
    score += 20; // Increased weight for location matching
  }
  if (searchParams.state && normalizedSnippet.includes(normalizeText(searchParams.state))) {
    score += 15; // State matching
  }
  
  // Skip tracing proximity logic for Oklahoma
  if (searchParams.state === 'OK') {
    const okNeighbors = ['caddo', 'durant', 'achille', 'bryan county', 'calera'];
    if (okNeighbors.some(neighbor => normalizedSnippet.includes(neighbor))) {
      score += 18; // High boost for neighboring cities in skip tracing
    }
  }
  
  // Contact info matching (critical for skip tracing)
  if (searchParams.phone) {
    const phoneDigits = searchParams.phone.replace(/\D/g, '');
    if (normalizedSnippet.includes(phoneDigits) || normalizedSnippet.includes(searchParams.phone)) {
      score += 25; // High boost for phone matches
    }
    // Area code matching
    const areaCode = phoneDigits.substring(0, 3);
    if (normalizedSnippet.includes(areaCode)) {
      score += 10;
    }
  }
  
  if (searchParams.email && normalizedSnippet.includes(normalizeText(searchParams.email))) {
    score += 25; // High boost for email matches
  }
  
  // Skip tracing specific indicators
  const skipTracingIndicators = [
    'age', 'relatives', 'associates', 'previous address', 'current address',
    'phone number', 'email address', 'property records', 'court records',
    'voter registration', 'family members'
  ];
  
  skipTracingIndicators.forEach(indicator => {
    if (normalizedSnippet.includes(indicator)) {
      score += 8; // Boost for skip tracing relevant content
    }
  });
  
  // Address patterns detection
  if (normalizedSnippet.match(/\d+\s+[a-z\s]+(street|st|avenue|ave|road|rd|drive|dr|lane|ln)/)) {
    score += 12; // Address found
  }
  
  // Phone pattern detection
  if (normalizedSnippet.match(/\(\d{3}\)\s?\d{3}-\d{4}/) || normalizedSnippet.match(/\d{3}-\d{3}-\d{4}/)) {
    score += 15; // Phone number pattern found
  }
  
  // Age pattern detection (important for person identification)
  if (normalizedSnippet.match(/age\s+\d{2}/)) {
    score += 10;
  }
  
  // Source credibility weighting with skip tracing focus
  score += getSkipTracingSourceCredibilityBonus(snippet);
  
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
 * Get skip tracing specific source credibility bonus
 */
function getSkipTracingSourceCredibilityBonus(snippet: string): number {
  const lowerSnippet = snippet.toLowerCase();
  
  // Tier 1: Premium people search sites (highest credibility)
  const tier1Sources = [
    'truepeoplesearch', 'whitepages', 'spokeo', 'fastpeoplesearch',
    'peoplesearchnow', 'truthfinder', 'beenverified', 'intelius'
  ];
  
  // Tier 2: Social media and professional networks
  const tier2Sources = [
    'linkedin', 'facebook', 'twitter', 'instagram', 'myspace'
  ];
  
  // Tier 3: Government and official records
  const tier3Sources = [
    'gov', 'edu', 'courthouse', 'county', 'clerk', 'records',
    'property', 'voter', 'court', 'secretary of state'
  ];
  
  // Tier 4: Genealogy and family sites
  const tier4Sources = [
    'ancestry', 'familysearch', 'findagrave', 'familytree',
    'myheritage', 'geni'
  ];
  
  for (const source of tier1Sources) {
    if (lowerSnippet.includes(source)) return 15; // Highest boost
  }
  
  for (const source of tier2Sources) {
    if (lowerSnippet.includes(source)) return 12;
  }
  
  for (const source of tier3Sources) {
    if (lowerSnippet.includes(source)) return 10;
  }
  
  for (const source of tier4Sources) {
    if (lowerSnippet.includes(source)) return 8;
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
