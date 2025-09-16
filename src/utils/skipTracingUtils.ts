import { SearchResult, BaseEntity } from '@/types/entities';

// Geographic proximity data for skip tracing
export const GEOGRAPHIC_PROXIMITY = {
  'OK': {
    'Bryan County': ['Calera', 'Caddo', 'Durant', 'Achille', 'Cartwright', 'Colbert', 'Silo'],
    'Atoka County': ['Atoka', 'Stringtown', 'Tushka'],
    'Marshall County': ['Madill', 'Kingston', 'Lebanon'],
  }
};

export const AREA_CODE_REGIONS = {
  '580': { state: 'OK', region: 'Southern Oklahoma', counties: ['Bryan', 'Atoka', 'Marshall', 'Carter'] },
  '405': { state: 'OK', region: 'Central Oklahoma', counties: ['Canadian', 'Cleveland', 'Oklahoma'] },
  '918': { state: 'OK', region: 'Eastern Oklahoma', counties: ['Tulsa', 'Creek', 'Rogers'] },
};

/**
 * Calculate skip tracing confidence based on geographic proximity and data correlation
 */
export function calculateSkipTracingConfidence(
  result: SearchResult,
  searchParams: { name: string; city?: string; state?: string; phone?: string; email?: string }
): number {
  let confidence = result.confidence;
  const snippet = result.snippet.toLowerCase();
  const title = result.title.toLowerCase();
  
  // Geographic proximity boost
  if (searchParams.city && searchParams.state) {
    const targetCity = searchParams.city.toLowerCase();
    const targetState = searchParams.state.toLowerCase();
    
    // Exact location match
    if ((snippet.includes(targetCity) || title.includes(targetCity)) && 
        (snippet.includes(targetState) || title.includes(targetState))) {
      confidence += 20;
    }
    
    // Proximity match for Oklahoma skip tracing
    if (targetState === 'ok' && targetCity === 'calera') {
      const proximityKeywords = ['caddo', 'durant', 'achille', 'bryan county', 'bryan co'];
      if (proximityKeywords.some(keyword => snippet.includes(keyword) || title.includes(keyword))) {
        confidence += 15; // High boost for neighboring areas
      }
    }
  }
  
  // Phone area code correlation
  if (searchParams.phone) {
    const searchAreaCode = searchParams.phone.substring(0, 3);
    if (snippet.includes(searchAreaCode) || title.includes(searchAreaCode)) {
      confidence += 12;
    }
    
    // Extract any phone numbers from the result
    const phoneMatches = result.snippet.match(/\((\d{3})\)\s?\d{3}-\d{4}/g);
    if (phoneMatches) {
      phoneMatches.forEach(phone => {
        const resultAreaCode = phone.match(/\((\d{3})\)/)?.[1];
        if (resultAreaCode === searchAreaCode) {
          confidence += 18; // Strong correlation
        }
      });
    }
  }
  
  // Skip tracing site bonus
  const skipTracingSites = [
    'truepeoplesearch', 'whitepages', 'spokeo', 'fastpeoplesearch',
    'peoplesearchnow', 'truthfinder', 'beenverified'
  ];
  
  if (skipTracingSites.some(site => result.source.toLowerCase().includes(site))) {
    confidence += 10;
  }
  
  return Math.min(confidence, 100);
}

/**
 * Identify potential address moves and location chains
 */
export function analyzeLocationChain(results: SearchResult[]): {
  currentLocation?: string;
  previousLocations: string[];
  locationConfidence: number;
} {
  const locations: { location: string; confidence: number; recency: number }[] = [];
  
  results.forEach((result, index) => {
    const snippet = result.snippet.toLowerCase();
    
    // Extract location patterns
    const locationPatterns = [
      /(\w+),?\s+(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)/gi,
      /lives?\s+in\s+([A-Za-z\s]+,?\s+[A-Z]{2})/gi,
      /current\s+address[:\s]+([A-Za-z\s]+,?\s+[A-Z]{2})/gi
    ];
    
    locationPatterns.forEach(pattern => {
      const matches = snippet.matchAll(pattern);
      for (const match of matches) {
        const location = match[1] || match[0];
        const recency = results.length - index; // More recent results have higher recency
        
        locations.push({
          location: location.trim(),
          confidence: result.confidence,
          recency
        });
      }
    });
  });
  
  // Sort by recency and confidence
  locations.sort((a, b) => (b.recency + b.confidence) - (a.recency + a.confidence));
  
  // Remove duplicates and get unique locations
  const uniqueLocations = locations.filter((loc, index, arr) => 
    arr.findIndex(l => l.location.toLowerCase() === loc.location.toLowerCase()) === index
  );
  
  return {
    currentLocation: uniqueLocations[0]?.location,
    previousLocations: uniqueLocations.slice(1, 4).map(l => l.location),
    locationConfidence: uniqueLocations[0]?.confidence || 0
  };
}

/**
 * Correlate entities across multiple results for verification
 */
export function correlateEntities(results: SearchResult[]): {
  verifiedEntities: BaseEntity[];
  correlationScore: number;
} {
  const entityMap: { [key: string]: { entity: BaseEntity; count: number; sources: string[] } } = {};
  
  results.forEach(result => {
    if (result.extractedEntities) {
      result.extractedEntities.forEach((entity: any) => {
        const key = `${entity.type}-${entity.value.toLowerCase().replace(/\s+/g, '')}`;
        
        if (!entityMap[key]) {
          entityMap[key] = {
            entity: {
              id: `correlated-${Object.keys(entityMap).length}`,
              type: entity.type,
              value: entity.value,
              confidence: entity.confidence,
              source: 'correlation',
              timestamp: new Date(),
              verified: false
            },
            count: 0,
            sources: []
          };
        }
        
        entityMap[key].count++;
        entityMap[key].sources.push(result.source);
        
        // Boost confidence for multiple sources
        if (entityMap[key].count > 1) {
          entityMap[key].entity.confidence = Math.min(100, 
            entityMap[key].entity.confidence + (entityMap[key].count - 1) * 10
          );
          entityMap[key].entity.verified = entityMap[key].entity.confidence >= 70;
        }
      });
    }
  });
  
  const verifiedEntities = Object.values(entityMap)
    .filter(item => item.count >= 1) // At least 1 source
    .map(item => item.entity)
    .sort((a, b) => b.confidence - a.confidence);
  
  const correlationScore = Math.min(100, 
    (verifiedEntities.filter(e => e.verified).length / Math.max(1, verifiedEntities.length)) * 100
  );
  
  return {
    verifiedEntities,
    correlationScore
  };
}

/**
 * Generate skip tracing recommendations based on results
 */
export function generateSkipTracingRecommendations(
  results: SearchResult[],
  searchParams: { name: string; city?: string; state?: string; phone?: string; email?: string }
): string[] {
  const recommendations: string[] = [];
  const locationChain = analyzeLocationChain(results);
  const { verifiedEntities, correlationScore } = correlateEntities(results);
  
  // Location-based recommendations
  if (locationChain.currentLocation && 
      locationChain.currentLocation.toLowerCase() !== `${searchParams.city}, ${searchParams.state}`.toLowerCase()) {
    recommendations.push(
      `Subject may have moved to ${locationChain.currentLocation}. Check records in this new location.`
    );
  }
  
  if (locationChain.previousLocations.length > 0) {
    recommendations.push(
      `Previous locations found: ${locationChain.previousLocations.join(', ')}. Consider checking historical records.`
    );
  }
  
  // Entity correlation recommendations
  if (correlationScore < 50) {
    recommendations.push(
      'Low data correlation detected. Consider expanding search to include maiden names, nicknames, or middle initials.'
    );
  }
  
  // Phone number recommendations
  const phoneEntities = verifiedEntities.filter(e => e.type === 'phone');
  if (phoneEntities.length > 1) {
    recommendations.push(
      `Multiple phone numbers found: ${phoneEntities.map(e => e.value).join(', ')}. Cross-reference for current contact.`
    );
  }
  
  // Skip tracing source recommendations
  const hasGoodSources = results.some(r => 
    ['truepeoplesearch', 'whitepages', 'spokeo'].some(site => 
      r.source.toLowerCase().includes(site)
    )
  );
  
  if (!hasGoodSources) {
    recommendations.push(
      'Consider checking premium people search databases (TruePeopleSearch, Spokeo, WhitePages) for more comprehensive results.'
    );
  }
  
  return recommendations;
}