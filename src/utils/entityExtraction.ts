import { BaseEntity, EntityType } from '@/types/entities';

// Enhanced regex patterns for entity extraction
const PATTERNS = {
  phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  address: /\d{1,5}\s+([A-Za-z\s]{1,50})\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Circle|Cir|Way|Place|Pl)\b/gi,
  vin: /\b[A-HJ-NPR-Z0-9]{17}\b/g,
  ssnMasked: /\*{3}-\*{2}-\d{4}|\d{3}-\*{2}-\*{4}/g,
  name: /\b[A-Z][a-z]+ [A-Z][a-z]+(?: [A-Z][a-z]+)?\b/g,
  zipCode: /\b\d{5}(?:-\d{4})?\b/g,
  date: /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g,
};

// Geographic mapping for phone area codes
const AREA_CODE_MAP: Record<string, { region: string; timezone: string }> = {
  '212': { region: 'New York, NY', timezone: 'Eastern' },
  '213': { region: 'Los Angeles, CA', timezone: 'Pacific' },
  '312': { region: 'Chicago, IL', timezone: 'Central' },
  '404': { region: 'Atlanta, GA', timezone: 'Eastern' },
  '713': { region: 'Houston, TX', timezone: 'Central' },
  // Add more area codes as needed
};

/**
 * Extract all entities from text with confidence scoring
 */
export function extractEntities(text: string, context: { searchName?: string; searchLocation?: string } = {}): BaseEntity[] {
  const entities: BaseEntity[] = [];
  const timestamp = new Date();

  // Extract phones with geographic data
  const phoneMatches = text.matchAll(PATTERNS.phone);
  for (const match of phoneMatches) {
    const fullMatch = match[0];
    const areaCode = match[2];
    const phone = `(${match[2]}) ${match[3]}-${match[4]}`;
    
    const confidence = calculatePhoneConfidence(fullMatch, areaCode);
    const geoData = AREA_CODE_MAP[areaCode] || { region: 'Unknown', timezone: 'Unknown' };
    
    entities.push({
      id: `phone-${entities.length}`,
      type: 'phone',
      value: phone,
      confidence,
      source: 'extraction',
      timestamp,
      verified: confidence >= 80,
    });
  }

  // Extract emails with domain validation
  const emailMatches = text.matchAll(PATTERNS.email);
  for (const match of emailMatches) {
    const email = match[0];
    const domain = email.split('@')[1];
    const confidence = calculateEmailConfidence(email, domain);
    
    entities.push({
      id: `email-${entities.length}`,
      type: 'email',
      value: email,
      confidence,
      source: 'extraction',
      timestamp,
      verified: confidence >= 70,
    });
  }

  // Extract addresses with formatting
  const addressMatches = text.matchAll(PATTERNS.address);
  for (const match of addressMatches) {
    const address = match[0];
    const confidence = calculateAddressConfidence(address, context.searchLocation);
    
    entities.push({
      id: `address-${entities.length}`,
      type: 'address',
      value: address,
      confidence,
      source: 'extraction',
      timestamp,
      verified: confidence >= 60,
    });
  }

  // Extract VIN numbers
  const vinMatches = text.matchAll(PATTERNS.vin);
  for (const match of vinMatches) {
    entities.push({
      id: `vin-${entities.length}`,
      type: 'vin',
      value: match[0],
      confidence: 95, // VIN pattern is very specific
      source: 'extraction',
      timestamp,
      verified: true,
    });
  }

  // Extract masked SSNs (for educational purposes)
  const ssnMatches = text.matchAll(PATTERNS.ssnMasked);
  for (const match of ssnMatches) {
    entities.push({
      id: `ssn-${entities.length}`,
      type: 'ssn_masked',
      value: match[0],
      confidence: 90,
      source: 'extraction',
      timestamp,
      verified: true,
    });
  }

  // Extract names with context matching
  const nameMatches = text.matchAll(PATTERNS.name);
  for (const match of nameMatches) {
    const name = match[0];
    // Skip if it's the search name
    if (context.searchName && name.toLowerCase().includes(context.searchName.toLowerCase())) {
      continue;
    }
    
    const confidence = calculateNameConfidence(name, context.searchName);
    
    entities.push({
      id: `name-${entities.length}`,
      type: 'name',
      value: name,
      confidence,
      source: 'extraction',
      timestamp,
      verified: confidence >= 50,
    });
  }

  return entities;
}

/**
 * Calculate confidence score for phone numbers
 */
function calculatePhoneConfidence(phone: string, areaCode: string): number {
  let confidence = 50;
  
  // Valid area code format
  if (/^[2-9]\d{2}$/.test(areaCode)) confidence += 20;
  
  // Known area code
  if (AREA_CODE_MAP[areaCode]) confidence += 15;
  
  // Proper formatting
  if (/^\(\d{3}\)\s\d{3}-\d{4}$/.test(phone)) confidence += 10;
  
  // Not toll-free or special
  if (!['800', '888', '877', '866', '855', '844', '833'].includes(areaCode)) confidence += 5;
  
  return Math.min(confidence, 100);
}

/**
 * Calculate confidence score for email addresses
 */
function calculateEmailConfidence(email: string, domain: string): number {
  let confidence = 40;
  
  // Common domains get lower confidence (could be generic)
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  if (commonDomains.includes(domain.toLowerCase())) {
    confidence += 10;
  } else {
    confidence += 25; // Custom domains more likely to be real
  }
  
  // Proper format
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) confidence += 20;
  
  // Length and structure
  if (email.length > 5 && email.length < 50) confidence += 15;
  
  return Math.min(confidence, 100);
}

/**
 * Calculate confidence score for addresses
 */
function calculateAddressConfidence(address: string, searchLocation?: string): number {
  let confidence = 30;
  
  // Has numbers (street address)
  if (/\d/.test(address)) confidence += 20;
  
  // Has common street suffixes
  if (/\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|ct|court)\b/i.test(address)) {
    confidence += 25;
  }
  
  // Location match
  if (searchLocation && address.toLowerCase().includes(searchLocation.toLowerCase())) {
    confidence += 15;
  }
  
  // Length check
  if (address.length > 10 && address.length < 100) confidence += 10;
  
  return Math.min(confidence, 100);
}

/**
 * Calculate confidence score for names
 */
function calculateNameConfidence(name: string, searchName?: string): number {
  let confidence = 25;
  
  // Proper capitalization
  if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(name)) confidence += 20;
  
  // Not too common
  const commonNames = ['John Doe', 'Jane Doe', 'Test User'];
  if (!commonNames.includes(name)) confidence += 15;
  
  // Related to search name (could be relative)
  if (searchName) {
    const searchParts = searchName.toLowerCase().split(' ');
    const nameParts = name.toLowerCase().split(' ');
    const overlap = searchParts.some(part => nameParts.includes(part));
    if (overlap) confidence += 20;
  }
  
  // Length check
  if (name.length > 5 && name.length < 50) confidence += 20;
  
  return Math.min(confidence, 100);
}

/**
 * Validate and enhance extracted entities
 */
export function validateEntity(entity: BaseEntity): BaseEntity {
  let enhancedConfidence = entity.confidence;
  
  switch (entity.type) {
    case 'phone':
      // Additional phone validation
      const areaCode = entity.value.match(/\((\d{3})\)/)?.[1];
      if (areaCode && AREA_CODE_MAP[areaCode]) {
        enhancedConfidence += 5;
      }
      break;
      
    case 'email':
      // Check for suspicious patterns
      if (entity.value.includes('noreply') || entity.value.includes('donotreply')) {
        enhancedConfidence -= 20;
      }
      break;
      
    case 'address':
      // Validate address format
      if (!/\d/.test(entity.value)) {
        enhancedConfidence -= 15;
      }
      break;
  }
  
  return {
    ...entity,
    confidence: Math.max(0, Math.min(100, enhancedConfidence)),
  };
}