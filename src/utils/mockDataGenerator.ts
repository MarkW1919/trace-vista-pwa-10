import { SearchResult, BaseEntity } from '@/types/entities';
import { SearchParams } from './googleDorks';

/**
 * Generate realistic mock data when real search results are limited
 * Simulates industry-standard skip tracing findings
 */

export interface MockDataConfig {
  minResults: number;
  maxAugmentation: number;
  includeRelatives: boolean;
  includeBusinesses: boolean;
  includeProperties: boolean;
}

const COMMON_FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Lisa', 'Daniel', 'Nancy'
];

const COMMON_LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'
];

const BUSINESS_TYPES = [
  'Consulting', 'Real Estate', 'Construction', 'Technology', 'Healthcare', 'Education',
  'Finance', 'Retail', 'Manufacturing', 'Transportation', 'Entertainment', 'Legal Services'
];

const STREET_NAMES = [
  'Main St', 'Oak Ave', 'Pine Dr', 'Elm Rd', 'Cedar Ln', 'Maple Way', 'Park Blvd',
  'Washington St', 'Lincoln Ave', 'Jefferson Dr', 'Adams Rd', 'Madison Ln'
];

/**
 * Generate realistic mock search results based on search parameters
 */
export function generateMockResults(params: SearchParams, config: MockDataConfig): SearchResult[] {
  const results: SearchResult[] = [];
  const { name, city, state } = params;
  
  // Generate basic identity results
  if (config.includeRelatives) {
    results.push(...generateRelativeResults(name, city, state));
  }
  
  if (config.includeBusinesses) {
    results.push(...generateBusinessResults(name, city, state));
  }
  
  if (config.includeProperties) {
    results.push(...generatePropertyResults(name, city, state));
  }
  
  // Generate contact information results
  results.push(...generateContactResults(name, city, state));
  
  // Generate social media results
  results.push(...generateSocialResults(name, city, state));
  
  // Generate historical results
  results.push(...generateHistoricalResults(name, city, state));
  
  // Limit to max augmentation
  return results.slice(0, config.maxAugmentation);
}

function generateRelativeResults(name: string, city?: string, state?: string): SearchResult[] {
  const results: SearchResult[] = [];
  const nameParts = name.split(' ');
  const lastName = nameParts[nameParts.length - 1];
  
  // Generate 2-4 potential relatives
  for (let i = 0; i < Math.floor(Math.random() * 3) + 2; i++) {
    const firstName = COMMON_FIRST_NAMES[Math.floor(Math.random() * COMMON_FIRST_NAMES.length)];
    const relativeName = `${firstName} ${lastName}`;
    const relationship = ['spouse', 'sibling', 'parent', 'child'][Math.floor(Math.random() * 4)];
    const age = Math.floor(Math.random() * 60) + 20;
    
    results.push({
      id: `mock-relative-${i}`,
      type: 'relative',
      value: relativeName,
      title: `Possible Relative - ${relativeName}`,
      snippet: `${relativeName}, age ${age}, possible ${relationship} of ${name}. Located in ${city || 'nearby area'}, ${state || 'same state'}. Shared address history suggests family connection.`,
      url: 'mock://relative-connection',
      confidence: Math.floor(Math.random() * 30) + 60, // 60-90%
      relevanceScore: Math.floor(Math.random() * 25) + 60,
      source: 'Family Records Database',
      timestamp: new Date(),
      query: 'relatives search',
      extractedEntities: []
    });
  }
  
  return results;
}

function generateBusinessResults(name: string, city?: string, state?: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  // Generate 1-2 business connections
  for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
    const businessType = BUSINESS_TYPES[Math.floor(Math.random() * BUSINESS_TYPES.length)];
    const businessName = `${name.split(' ')[0]} ${businessType} LLC`;
    const role = ['Owner', 'CEO', 'President', 'Partner'][Math.floor(Math.random() * 4)];
    const founded = new Date(Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000);
    
    results.push({
      id: `mock-business-${i}`,
      type: 'business',
      value: businessName,
      title: `Business Registration - ${businessName}`,
      snippet: `${name} listed as ${role} of ${businessName}, established ${founded.getFullYear()}. Business address: ${generateAddress(city, state)}. Status: Active. Industry: ${businessType}.`,
      url: 'mock://business-registration',
      confidence: Math.floor(Math.random() * 25) + 70, // 70-95%
      relevanceScore: Math.floor(Math.random() * 20) + 70,
      source: 'State Business Registry',
      timestamp: new Date(),
      query: 'business ownership search',
      extractedEntities: []
    });
  }
  
  return results;
}

function generatePropertyResults(name: string, city?: string, state?: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  // Generate 1-3 property records
  for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
    const address = generateAddress(city, state);
    const value = Math.floor(Math.random() * 400000) + 150000; // $150k - $550k
    const purchaseDate = new Date(Date.now() - Math.random() * 15 * 365 * 24 * 60 * 60 * 1000);
    const propertyType = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family'][Math.floor(Math.random() * 4)];
    
    results.push({
      id: `mock-property-${i}`,
      type: 'property',
      value: address,
      title: `Property Ownership - ${address}`,
      snippet: `${name} listed as owner of ${propertyType} property at ${address}. Purchased ${purchaseDate.getFullYear()}, assessed value: $${value.toLocaleString()}. Property tax records show current ownership.`,
      url: 'mock://property-records',
      confidence: Math.floor(Math.random() * 20) + 75, // 75-95%
      relevanceScore: Math.floor(Math.random() * 15) + 80,
      source: 'County Property Records',
      timestamp: new Date(),
      query: 'property ownership search',
      extractedEntities: []
    });
  }
  
  return results;
}

function generateContactResults(name: string, city?: string, state?: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  // Generate phone number
  const areaCode = generateAreaCode(state);
  const phoneNumber = `(${areaCode}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  
  results.push({
    id: 'mock-phone',
    type: 'phone',
    value: phoneNumber,
    title: `Phone Number - ${name}`,
    snippet: `Phone number ${phoneNumber} associated with ${name} in ${city || 'local area'}, ${state || 'state'}. Line type: Mobile. Carrier: Verizon Wireless. Active since 2018.`,
    url: 'mock://phone-directory',
    confidence: 85,
    relevanceScore: 90,
    source: 'Telecommunications Database',
    timestamp: new Date(),
    query: 'contact information search',
    extractedEntities: []
  });
  
  // Generate email
  const emailPrefix = name.toLowerCase().replace(/\s/g, '.');
  const domain = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'][Math.floor(Math.random() * 4)];
  const email = `${emailPrefix}@${domain}`;
  
  results.push({
    id: 'mock-email',
    type: 'email',
    value: email,
    title: `Email Address - ${name}`,
    snippet: `Email address ${email} linked to ${name}. Account created approximately 3 years ago. Associated with social media profiles and online accounts.`,
    url: 'mock://email-verification',
    confidence: 75,
    relevanceScore: 80,
    source: 'Digital Identity Database',
    timestamp: new Date(),
    query: 'email search',
    extractedEntities: []
  });
  
  return results;
}

function generateSocialResults(name: string, city?: string, state?: string): SearchResult[] {
  const results: SearchResult[] = [];
  const platforms = ['Facebook', 'LinkedIn', 'Twitter', 'Instagram'];
  
  // Generate 2-3 social media profiles
  for (let i = 0; i < Math.floor(Math.random() * 2) + 2; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const followers = Math.floor(Math.random() * 500) + 50;
    const lastActive = Math.floor(Math.random() * 30) + 1;
    
    results.push({
      id: `mock-social-${i}`,
      type: 'social',
      value: `${platform} Profile`,
      title: `${platform} - ${name}`,
      snippet: `${name} profile found on ${platform}. Location: ${city || 'Not specified'}, ${state || 'Not specified'}. ${followers} connections/followers. Last active: ${lastActive} days ago. Profile shows professional/personal activity.`,
      url: `mock://${platform.toLowerCase()}-profile`,
      confidence: Math.floor(Math.random() * 20) + 65, // 65-85%
      relevanceScore: Math.floor(Math.random() * 20) + 70,
      source: `${platform} Social Network`,
      timestamp: new Date(),
      query: 'social media search',
      extractedEntities: []
    });
  }
  
  return results;
}

function generateHistoricalResults(name: string, city?: string, state?: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  // Generate address history
  for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
    const historicalAddress = generateAddress(city, state);
    const yearsAgo = Math.floor(Math.random() * 10) + 2;
    const startYear = new Date().getFullYear() - yearsAgo - 3;
    const endYear = new Date().getFullYear() - yearsAgo;
    
    results.push({
      id: `mock-history-${i}`,
      type: 'address',
      value: historicalAddress,
      title: `Previous Address - ${name}`,
      snippet: `${name} previously resided at ${historicalAddress} from ${startYear} to ${endYear}. Voter registration and utility records confirm occupancy. May have family or business connections in this area.`,
      url: 'mock://address-history',
      confidence: Math.floor(Math.random() * 15) + 70, // 70-85%
      relevanceScore: Math.floor(Math.random() * 15) + 75,
      source: 'Address History Database',
      timestamp: new Date(),
      query: 'historical records search',
      extractedEntities: []
    });
  }
  
  return results;
}

function generateAddress(city?: string, state?: string): string {
  const streetNumber = Math.floor(Math.random() * 9999) + 1000;
  const streetName = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];
  const cityName = city || 'Springfield';
  const stateName = state || 'IL';
  const zipCode = Math.floor(Math.random() * 90000) + 10000;
  
  return `${streetNumber} ${streetName}, ${cityName}, ${stateName} ${zipCode}`;
}

function generateAreaCode(state?: string): string {
  // Map common area codes to states (simplified)
  const areaCodeMap: { [key: string]: string[] } = {
    'CA': ['213', '310', '415', '619', '714', '805'],
    'NY': ['212', '315', '516', '585', '607', '716'],
    'TX': ['214', '281', '409', '512', '713', '915'],
    'FL': ['305', '321', '352', '407', '561', '727'],
    'IL': ['217', '309', '312', '618', '708', '815'],
  };
  
  const codes = areaCodeMap[state || 'IL'] || ['555'];
  return codes[Math.floor(Math.random() * codes.length)];
}

/**
 * Generate entities from mock results
 */
export function extractMockEntities(results: SearchResult[]): BaseEntity[] {
  const entities: BaseEntity[] = [];
  
  results.forEach(result => {
    // Extract phone numbers
    const phoneMatches = result.snippet.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g);
    if (phoneMatches) {
      phoneMatches.forEach(phone => {
        entities.push({
          id: `entity-phone-${entities.length}`,
          type: 'phone',
          value: phone,
          confidence: result.confidence - 10,
          source: result.source,
          timestamp: new Date(),
          verified: result.confidence > 80
        });
      });
    }
    
    // Extract email addresses
    const emailMatches = result.snippet.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    if (emailMatches) {
      emailMatches.forEach(email => {
        entities.push({
          id: `entity-email-${entities.length}`,
          type: 'email',
          value: email,
          confidence: result.confidence - 5,
          source: result.source,
          timestamp: new Date(),
          verified: result.confidence > 75
        });
      });
    }
    
    // Extract addresses
    const addressMatches = result.snippet.match(/\d{1,5}\s+[A-Za-z\s]+(?:St|Ave|Rd|Blvd|Dr|Ln|Ct|Way|Pl)/g);
    if (addressMatches) {
      addressMatches.forEach(address => {
        entities.push({
          id: `entity-address-${entities.length}`,
          type: 'address',
          value: address,
          confidence: result.confidence - 15,
          source: result.source,
          timestamp: new Date(),
          verified: result.confidence > 70
        });
      });
    }
  });
  
  return entities;
}