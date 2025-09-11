/**
 * Calculate Levenshtein distance between two strings
 * Used for deduplication with 80% similarity threshold
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,    // deletion
          matrix[i][j - 1] + 1,    // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
export function similarityRatio(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}

/**
 * Check if two strings are similar based on threshold
 */
export function areSimilar(str1: string, str2: string, threshold = 0.8): boolean {
  return similarityRatio(str1, str2) >= threshold;
}

/**
 * Find fuzzy matches in an array of strings
 */
export function findFuzzyMatches(target: string, candidates: string[], threshold = 0.7): string[] {
  return candidates.filter(candidate => 
    similarityRatio(target, candidate) >= threshold
  );
}

/**
 * Normalize text for better comparison
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

/**
 * Calculate Jaccard similarity for sets of words
 */
export function jaccardSimilarity(str1: string, str2: string): number {
  const set1 = new Set(normalizeText(str1).split(' '));
  const set2 = new Set(normalizeText(str2).split(' '));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}