export interface BaseEntity {
  id: string;
  type: EntityType;
  value: string;
  confidence: number; // 0-100
  source: string;
  timestamp: Date;
  verified?: boolean;
  metadata?: Record<string, any>;
}

export type EntityType = 
  | 'name'
  | 'phone'
  | 'email' 
  | 'address'
  | 'social'
  | 'vin'
  | 'ssn_masked'
  | 'business'
  | 'relative'
  | 'associate'
  | 'property'
  | 'court_record'
  | 'voter_record'
  | 'voter'
  | 'court'
  | 'marriage'
  | 'divorce'
  | 'age'
  | 'date'
  | 'salary';

export interface SearchResult extends BaseEntity {
  title: string;
  snippet: string;
  url: string;
  relevanceScore: number;
  query: string;
  extractedEntities?: BaseEntity[];
}

export interface PhoneDetails extends BaseEntity {
  formatted: string;
  country: string;
  region: string;
  carrier: string;
  lineType: 'mobile' | 'landline' | 'voip' | 'unknown';
  timezone: string;
  isValid: boolean;
  portabilityHistory?: string[];
}

export interface EmailFootprint extends BaseEntity {
  platforms: string[];
  breachCount: number;
  domainInfo?: {
    registrar: string;
    createdDate: string;
    expiresDate: string;
  };
}

export interface PublicRecord extends BaseEntity {
  recordType: 'voter' | 'court' | 'property' | 'marriage' | 'divorce' | 'business';
  jurisdiction: string;
  date: string;
  status: string;
  details: Record<string, any>;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: EntityType;
  confidence: number;
  connections: NetworkEdge[];
}

export interface NetworkEdge {
  source: string;
  target: string;
  relationship: string;
  strength: number;
  verified: boolean;
}

export interface CompiledReport {
  subject: {
    name: string;
    lastKnownLocation: string;
    searchDate: Date;
  };
  summary: {
    totalResults: number;
    highConfidenceResults: number;
    sourcesCount: number;
    entitiesExtracted: number;
  };
  results: SearchResult[];
  entities: BaseEntity[];
  timeline: TimelineEvent[];
  network: NetworkNode[];
  accuracy: {
    overallConfidence: number;
    crossVerified: number;
    flaggedInconsistencies: string[];
  };
}

export interface TimelineEvent {
  date: string;
  event: string;
  source: string;
  confidence: number;
}