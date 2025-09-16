/**
 * Professional Skip Tracing Methodologies
 * Industry-standard techniques and comprehensive analysis tools
 */

export interface SkipTracingProfile {
  subject: SubjectProfile;
  searchStrategy: SearchStrategy;
  dataPoints: DataPoint[];
  riskAssessment: RiskAssessment;
  investigativeActions: InvestigativeAction[];
  recommendations: string[];
  confidenceLevel: 'low' | 'medium' | 'high' | 'very_high';
  lastUpdated: Date;
}

export interface SubjectProfile {
  primaryName: string;
  aliases: string[];
  demographics: {
    estimatedAge?: number;
    ageRange?: string;
    gender?: 'M' | 'F' | 'Unknown';
    ethnicity?: string;
  };
  lastKnownLocation: {
    address?: string;
    city?: string;
    state?: string;
    county?: string;
    zipCode?: string;
  };
  contactInformation: {
    phones: PhoneData[];
    emails: EmailData[];
  };
  relationships: RelationshipData[];
  financialProfile: FinancialIndicators;
  employmentHistory: EmploymentData[];
}

export interface PhoneData {
  number: string;
  type: 'mobile' | 'landline' | 'voip' | 'unknown';
  carrier?: string;
  confidence: number;
  lastVerified?: Date;
  isActive: boolean;
}

export interface EmailData {
  address: string;
  domain: string;
  confidence: number;
  breachHistory: boolean;
  isActive: boolean;
}

export interface RelationshipData {
  name: string;
  relationship: string;
  location?: string;
  confidence: number;
  contactInfo?: string;
}

export interface FinancialIndicators {
  creditScore?: number;
  bankruptcies: BankruptcyRecord[];
  propertyOwnership: PropertyRecord[];
  businessAffiliations: BusinessRecord[];
  estimatedIncome?: number;
}

export interface BankruptcyRecord {
  filingDate: string;
  type: 'Chapter 7' | 'Chapter 11' | 'Chapter 13';
  court: string;
  caseNumber: string;
}

export interface PropertyRecord {
  address: string;
  ownershipType: 'sole' | 'joint' | 'trust' | 'corporate';
  purchaseDate?: string;
  currentValue?: number;
  mortgageStatus: 'paid' | 'active' | 'foreclosure';
}

export interface BusinessRecord {
  businessName: string;
  role: string;
  industry: string;
  address?: string;
  isActive: boolean;
}

export interface EmploymentData {
  employer: string;
  position?: string;
  industry: string;
  location?: string;
  dateRange: string;
  confidence: number;
}

export interface SearchStrategy {
  phase: 'initial' | 'intensive' | 'comprehensive' | 'exhaustive';
  searchRadius: number;
  timeframe: string;
  prioritySources: string[];
  nextActions: string[];
  estimatedCompletion: string;
}

export interface DataPoint {
  id: string;
  category: 'identity' | 'location' | 'contact' | 'financial' | 'legal' | 'social' | 'employment';
  value: string;
  source: string;
  confidence: number;
  dateFound: Date;
  isVerified: boolean;
  correlatedPoints: string[];
}

export interface RiskAssessment {
  skipRisk: 'low' | 'medium' | 'high' | 'extreme';
  factors: RiskFactor[];
  predictiveProbability: number;
  volatilityScore: number;
  recommendations: string[];
}

export interface RiskFactor {
  type: 'geographic' | 'financial' | 'legal' | 'behavioral' | 'digital';
  description: string;
  severity: 'low' | 'medium' | 'high';
  impact: number;
}

export interface InvestigativeAction {
  id: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCost: number;
  timeRequired: string;
  expectedResult: string;
  isCompleted: boolean;
  results?: string;
}

// Professional databases and sources
const PROFESSIONAL_SOURCES = {
  // Tier 1: Premium people search databases
  tier1: [
    'TLOxp', 'Accurint', 'IRBSearch', 'TransUnion TLO', 'LexisNexis',
    'Clear by Thomson Reuters', 'Pallorium', 'IDICORE'
  ],
  
  // Tier 2: Public record aggregators
  tier2: [
    'TruePeopleSearch', 'FastPeopleSearch', 'Spokeo', 'WhitePages Premium',
    'BeenVerified', 'TruthFinder', 'Intelius', 'PeopleFinders'
  ],
  
  // Tier 3: Social media and digital footprint
  tier3: [
    'LinkedIn', 'Facebook', 'Twitter', 'Instagram', 'TikTok',
    'Snapchat', 'Dating Apps', 'Professional Networks'
  ],
  
  // Tier 4: Government and official records
  tier4: [
    'County Records', 'State Databases', 'Federal Court Records',
    'Property Records', 'Voter Registration', 'Professional Licenses',
    'SEC Filings', 'UCC Filings'
  ],
  
  // Tier 5: Specialized databases
  tier5: [
    'Motor Vehicle Records', 'Utility Records', 'School Records',
    'Medical Records', 'Insurance Claims', 'Employment Records'
  ]
};

// Skip tracing methodologies by difficulty level
const SKIP_TRACING_METHODOLOGIES = {
  basic: {
    timeFrame: '1-3 days',
    techniques: [
      'Basic internet search',
      'Social media reconnaissance',
      'Public directory search',
      'Reverse phone/email lookup',
      'Address verification'
    ],
    expectedSuccess: 40
  },
  
  intermediate: {
    timeFrame: '3-7 days',
    techniques: [
      'Cross-reference multiple databases',
      'Employment verification',
      'Utility company outreach',
      'Neighbor interviews',
      'Mail forwarding traces',
      'Credit header analysis'
    ],
    expectedSuccess: 65
  },
  
  advanced: {
    timeFrame: '1-2 weeks',
    techniques: [
      'Professional database searches (TLO, Accurint)',
      'Court record analysis',
      'Property ownership traces',
      'Business affiliation research',
      'Asset searches',
      'Network analysis'
    ],
    expectedSuccess: 80
  },
  
  comprehensive: {
    timeFrame: '2-4 weeks',
    techniques: [
      'Multi-state record searches',
      'Genealogy research',
      'Social engineering (ethical)',
      'Surveillance coordination',
      'International database queries',
      'Deep web investigation'
    ],
    expectedSuccess: 90
  }
};

/**
 * Create comprehensive skip tracing profile
 */
export function createSkipTracingProfile(
  searchParams: {
    name: string;
    city?: string;
    state?: string;
    phone?: string;
    email?: string;
    dob?: string;
    address?: string;
  },
  existingData?: any[]
): SkipTracingProfile {
  
  const subject = buildSubjectProfile(searchParams, existingData);
  const searchStrategy = determineSearchStrategy(subject);
  const dataPoints = extractDataPoints(existingData || []);
  const riskAssessment = assessSkipRisk(subject, dataPoints);
  const investigativeActions = generateInvestigativeActions(subject, riskAssessment);
  const recommendations = generateProfessionalRecommendations(subject, riskAssessment, searchStrategy);
  const confidenceLevel = calculateOverallConfidence(subject, dataPoints, riskAssessment);
  
  return {
    subject,
    searchStrategy,
    dataPoints,
    riskAssessment,
    investigativeActions,
    recommendations,
    confidenceLevel,
    lastUpdated: new Date()
  };
}

function buildSubjectProfile(searchParams: any, existingData?: any[]): SubjectProfile {
  // Extract demographic information
  const demographics = {
    estimatedAge: extractAge(existingData),
    ageRange: calculateAgeRange(extractAge(existingData)),
    gender: 'Unknown' as const,
    ethnicity: undefined
  };
  
  // Build contact information
  const phones: PhoneData[] = [];
  const emails: EmailData[] = [];
  
  if (searchParams.phone) {
    phones.push({
      number: searchParams.phone,
      type: 'unknown',
      confidence: 80,
      isActive: true
    });
  }
  
  if (searchParams.email) {
    emails.push({
      address: searchParams.email,
      domain: searchParams.email.split('@')[1],
      confidence: 80,
      breachHistory: false,
      isActive: true
    });
  }
  
  // Extract additional data from existing results
  if (existingData) {
    existingData.forEach(data => {
      if (data.extractedEntities) {
        data.extractedEntities.forEach((entity: any) => {
          if (entity.type === 'phone' && !phones.find(p => p.number === entity.value)) {
            phones.push({
              number: entity.value,
              type: 'unknown',
              confidence: entity.confidence,
              isActive: true
            });
          }
          
          if (entity.type === 'email' && !emails.find(e => e.address === entity.value)) {
            emails.push({
              address: entity.value,
              domain: entity.value.split('@')[1],
              confidence: entity.confidence,
              breachHistory: false,
              isActive: true
            });
          }
        });
      }
    });
  }
  
  return {
    primaryName: searchParams.name,
    aliases: extractAliases(existingData),
    demographics,
    lastKnownLocation: {
      address: searchParams.address,
      city: searchParams.city,
      state: searchParams.state,
      county: undefined,
      zipCode: undefined
    },
    contactInformation: {
      phones,
      emails
    },
    relationships: extractRelationships(existingData),
    financialProfile: {
      bankruptcies: [],
      propertyOwnership: [],
      businessAffiliations: [],
    },
    employmentHistory: extractEmploymentHistory(existingData)
  };
}

function determineSearchStrategy(subject: SubjectProfile): SearchStrategy {
  let phase: SearchStrategy['phase'] = 'initial';
  let searchRadius = 25;
  
  // Determine search intensity based on available data
  const dataQuality = calculateDataQuality(subject);
  
  if (dataQuality < 30) {
    phase = 'comprehensive';
    searchRadius = 50;
  } else if (dataQuality < 60) {
    phase = 'intensive';
    searchRadius = 35;
  } else {
    phase = 'initial';
    searchRadius = 25;
  }
  
  const prioritySources = determinePrioritySources(subject, phase);
  const nextActions = generateNextActions(subject, phase);
  
  return {
    phase,
    searchRadius,
    timeframe: SKIP_TRACING_METHODOLOGIES[phase === 'comprehensive' ? 'comprehensive' : 'basic'].timeFrame,
    prioritySources,
    nextActions,
    estimatedCompletion: calculateEstimatedCompletion(phase)
  };
}

function extractDataPoints(existingData: any[]): DataPoint[] {
  const dataPoints: DataPoint[] = [];
  
  existingData.forEach((data, index) => {
    // Extract basic information
    dataPoints.push({
      id: `search-result-${index}`,
      category: 'identity',
      value: data.title || 'Search Result',
      source: data.source || 'Unknown',
      confidence: data.confidence || 0,
      dateFound: new Date(),
      isVerified: false,
      correlatedPoints: []
    });
    
    // Extract entities
    if (data.extractedEntities) {
      data.extractedEntities.forEach((entity: any, entityIndex: number) => {
        dataPoints.push({
          id: `entity-${index}-${entityIndex}`,
          category: mapEntityToCategory(entity.type),
          value: entity.value,
          source: data.source || 'Entity Extraction',
          confidence: entity.confidence || 0,
          dateFound: new Date(),
          isVerified: entity.verified || false,
          correlatedPoints: []
        });
      });
    }
  });
  
  return dataPoints;
}

function assessSkipRisk(subject: SubjectProfile, dataPoints: DataPoint[]): RiskAssessment {
  const factors: RiskFactor[] = [];
  let riskScore = 0;
  
  // Geographic risk factors
  if (!subject.lastKnownLocation.address) {
    factors.push({
      type: 'geographic',
      description: 'No known current address',
      severity: 'high',
      impact: 25
    });
    riskScore += 25;
  }
  
  // Contact information risk
  if (subject.contactInformation.phones.length === 0) {
    factors.push({
      type: 'behavioral',
      description: 'No known phone numbers',
      severity: 'high',
      impact: 20
    });
    riskScore += 20;
  }
  
  // Digital footprint risk
  if (subject.contactInformation.emails.length === 0) {
    factors.push({
      type: 'digital',
      description: 'No known email addresses',
      severity: 'medium',
      impact: 15
    });
    riskScore += 15;
  }
  
  // Data quality risk
  const dataQuality = calculateDataQuality(subject);
  if (dataQuality < 40) {
    factors.push({
      type: 'behavioral',
      description: 'Low data quality - subject may be intentionally evasive',
      severity: 'high',
      impact: 20
    });
    riskScore += 20;
  }
  
  // Employment risk
  if (subject.employmentHistory.length === 0) {
    factors.push({
      type: 'financial',
      description: 'No known employment history',
      severity: 'medium',
      impact: 10
    });
    riskScore += 10;
  }
  
  let skipRisk: RiskAssessment['skipRisk'] = 'low';
  if (riskScore > 60) skipRisk = 'extreme';
  else if (riskScore > 40) skipRisk = 'high';
  else if (riskScore > 20) skipRisk = 'medium';
  
  return {
    skipRisk,
    factors,
    predictiveProbability: Math.max(0, 100 - riskScore),
    volatilityScore: riskScore,
    recommendations: generateRiskRecommendations(factors)
  };
}

function generateInvestigativeActions(subject: SubjectProfile, riskAssessment: RiskAssessment): InvestigativeAction[] {
  const actions: InvestigativeAction[] = [];
  
  // Always start with basic actions
  actions.push({
    id: 'basic-search',
    action: 'Comprehensive database search using known identifiers',
    priority: 'high',
    estimatedCost: 50,
    timeRequired: '2-4 hours',
    expectedResult: 'Updated contact information and address history',
    isCompleted: false
  });
  
  // Location-specific actions
  if (!subject.lastKnownLocation.address) {
    actions.push({
      id: 'address-investigation',
      action: 'Conduct neighborhood canvassing and property record search',
      priority: 'high',
      estimatedCost: 200,
      timeRequired: '4-8 hours',
      expectedResult: 'Current or recent address information',
      isCompleted: false
    });
  }
  
  // Employment verification
  if (subject.employmentHistory.length > 0) {
    actions.push({
      id: 'employment-verification',
      action: 'Contact known employers for current employment status',
      priority: 'medium',
      estimatedCost: 100,
      timeRequired: '2-3 hours',
      expectedResult: 'Current employment and contact information',
      isCompleted: false
    });
  }
  
  // Social network analysis
  if (subject.relationships.length > 0) {
    actions.push({
      id: 'network-analysis',
      action: 'Interview known associates and family members',
      priority: 'medium',
      estimatedCost: 300,
      timeRequired: '6-10 hours',
      expectedResult: 'Current location and contact information through network',
      isCompleted: false
    });
  }
  
  // High-risk actions
  if (riskAssessment.skipRisk === 'high' || riskAssessment.skipRisk === 'extreme') {
    actions.push({
      id: 'professional-investigation',
      action: 'Engage professional investigator with specialized databases',
      priority: 'urgent',
      estimatedCost: 1000,
      timeRequired: '1-2 weeks',
      expectedResult: 'Comprehensive location and asset information',
      isCompleted: false
    });
  }
  
  return actions.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function generateProfessionalRecommendations(
  subject: SubjectProfile, 
  riskAssessment: RiskAssessment, 
  searchStrategy: SearchStrategy
): string[] {
  const recommendations: string[] = [];
  
  // Strategy recommendations
  recommendations.push(`Implement ${searchStrategy.phase} search strategy with ${searchStrategy.searchRadius}-mile radius`);
  
  // Source recommendations
  if (searchStrategy.phase === 'comprehensive') {
    recommendations.push('Utilize Tier 1 professional databases (TLO, Accurint, Clear) for maximum data coverage');
  }
  
  // Risk-based recommendations
  if (riskAssessment.skipRisk === 'high' || riskAssessment.skipRisk === 'extreme') {
    recommendations.push('Consider hiring licensed private investigator due to high skip risk profile');
    recommendations.push('Implement multi-state search strategy - subject may have relocated significantly');
  }
  
  // Location-specific recommendations
  if (subject.lastKnownLocation.state === 'OK') {
    recommendations.push('Focus on Oklahoma tribal records and rural county courthouse searches');
    recommendations.push('Check neighboring states (TX, AR, KS) for migration patterns');
  }
  
  // Contact strategy recommendations
  if (subject.contactInformation.phones.length > 0) {
    recommendations.push('Perform carrier analysis and phone ping investigations through proper legal channels');
  }
  
  // Digital footprint recommendations
  if (subject.contactInformation.emails.length > 0) {
    recommendations.push('Conduct social media archaeology and digital footprint analysis');
  }
  
  // Timeline recommendations
  recommendations.push(`Expected completion: ${searchStrategy.estimatedCompletion}`);
  recommendations.push('Document all investigative steps for potential legal proceedings');
  
  return recommendations;
}

// Helper functions
function extractAge(existingData?: any[]): number | undefined {
  if (!existingData) return undefined;
  
  for (const data of existingData) {
    if (data.extractedEntities) {
      const ageEntity = data.extractedEntities.find((e: any) => e.type === 'age');
      if (ageEntity) {
        return parseInt(ageEntity.value);
      }
    }
  }
  
  return undefined;
}

function calculateAgeRange(age?: number): string {
  if (!age) return 'Unknown';
  if (age < 18) return 'Minor (Under 18)';
  if (age < 25) return 'Young Adult (18-24)';
  if (age < 35) return 'Adult (25-34)';
  if (age < 50) return 'Middle Age (35-49)';
  if (age < 65) return 'Mature Adult (50-64)';
  return 'Senior (65+)';
}

function extractAliases(existingData?: any[]): string[] {
  // Implementation would extract name variations from data
  return [];
}

function extractRelationships(existingData?: any[]): RelationshipData[] {
  // Implementation would extract family/associate names from data
  return [];
}

function extractEmploymentHistory(existingData?: any[]): EmploymentData[] {
  // Implementation would extract employment information from data
  return [];
}

function calculateDataQuality(subject: SubjectProfile): number {
  let score = 0;
  
  if (subject.primaryName) score += 20;
  if (subject.lastKnownLocation.address) score += 20;
  if (subject.contactInformation.phones.length > 0) score += 20;
  if (subject.contactInformation.emails.length > 0) score += 15;
  if (subject.demographics.estimatedAge) score += 10;
  if (subject.employmentHistory.length > 0) score += 10;
  if (subject.relationships.length > 0) score += 5;
  
  return score;
}

function determinePrioritySources(subject: SubjectProfile, phase: SearchStrategy['phase']): string[] {
  const sources: string[] = [];
  
  switch (phase) {
    case 'initial':
      sources.push(...PROFESSIONAL_SOURCES.tier2.slice(0, 3));
      sources.push(...PROFESSIONAL_SOURCES.tier3.slice(0, 2));
      break;
    case 'intensive':
      sources.push(...PROFESSIONAL_SOURCES.tier1.slice(0, 2));
      sources.push(...PROFESSIONAL_SOURCES.tier2.slice(0, 5));
      sources.push(...PROFESSIONAL_SOURCES.tier4.slice(0, 3));
      break;
    case 'comprehensive':
      sources.push(...PROFESSIONAL_SOURCES.tier1);
      sources.push(...PROFESSIONAL_SOURCES.tier2);
      sources.push(...PROFESSIONAL_SOURCES.tier4);
      break;
    case 'exhaustive':
      sources.push(...Object.values(PROFESSIONAL_SOURCES).flat());
      break;
  }
  
  return sources;
}

function generateNextActions(subject: SubjectProfile, phase: SearchStrategy['phase']): string[] {
  const actions: string[] = [];
  
  // Phase-specific actions
  const methodology = SKIP_TRACING_METHODOLOGIES[phase === 'comprehensive' ? 'comprehensive' : 'basic'];
  actions.push(...methodology.techniques.slice(0, 3));
  
  // Subject-specific actions
  if (!subject.lastKnownLocation.address) {
    actions.push('Address verification and property record search');
  }
  
  if (subject.contactInformation.phones.length === 0) {
    actions.push('Reverse directory search and carrier lookup');
  }
  
  return actions;
}

function calculateEstimatedCompletion(phase: SearchStrategy['phase']): string {
  const baseTime = SKIP_TRACING_METHODOLOGIES[phase === 'comprehensive' ? 'comprehensive' : 'basic'].timeFrame;
  const today = new Date();
  const completion = new Date(today);
  
  // Add estimated days based on phase
  switch (phase) {
    case 'initial':
      completion.setDate(today.getDate() + 3);
      break;
    case 'intensive':
      completion.setDate(today.getDate() + 7);
      break;
    case 'comprehensive':
      completion.setDate(today.getDate() + 14);
      break;
    case 'exhaustive':
      completion.setDate(today.getDate() + 28);
      break;
  }
  
  return completion.toLocaleDateString();
}

function mapEntityToCategory(entityType: string): DataPoint['category'] {
  const mapping: { [key: string]: DataPoint['category'] } = {
    'name': 'identity',
    'phone': 'contact',
    'email': 'contact',
    'address': 'location',
    'age': 'identity',
    'ssn_masked': 'identity',
    'vin': 'financial',
    'company': 'employment',
    'title': 'employment',
    'salary': 'financial',
    'school': 'identity',
    'degree': 'identity',
    'case': 'legal',
    'court': 'legal',
    'attorney': 'legal'
  };
  
  return mapping[entityType] || 'identity';
}

function generateRiskRecommendations(factors: RiskFactor[]): string[] {
  const recommendations: string[] = [];
  
  factors.forEach(factor => {
    switch (factor.type) {
      case 'geographic':
        recommendations.push('Expand geographic search radius and check neighboring jurisdictions');
        break;
      case 'financial':
        recommendations.push('Investigate financial records and asset searches');
        break;
      case 'legal':
        recommendations.push('Review court records and legal proceedings for location clues');
        break;
      case 'behavioral':
        recommendations.push('Consider subject may be intentionally avoiding detection - use advanced techniques');
        break;
      case 'digital':
        recommendations.push('Enhance digital footprint analysis and social media investigation');
        break;
    }
  });
  
  return [...new Set(recommendations)]; // Remove duplicates
}

function calculateOverallConfidence(
  subject: SubjectProfile, 
  dataPoints: DataPoint[], 
  riskAssessment: RiskAssessment
): SkipTracingProfile['confidenceLevel'] {
  const dataQuality = calculateDataQuality(subject);
  const avgDataPointConfidence = dataPoints.length > 0 
    ? dataPoints.reduce((sum, dp) => sum + dp.confidence, 0) / dataPoints.length 
    : 0;
  const riskPenalty = riskAssessment.volatilityScore;
  
  const overallScore = (dataQuality + avgDataPointConfidence - riskPenalty) / 2;
  
  if (overallScore >= 80) return 'very_high';
  if (overallScore >= 60) return 'high';
  if (overallScore >= 40) return 'medium';
  return 'low';
}

/**
 * Generate professional skip tracing report
 */
export function generateSkipTracingReport(profile: SkipTracingProfile): string {
  const sections = [
    '# PROFESSIONAL SKIP TRACING REPORT',
    `**Subject:** ${profile.subject.primaryName}`,
    `**Report Date:** ${profile.lastUpdated.toLocaleDateString()}`,
    `**Confidence Level:** ${profile.confidenceLevel.toUpperCase()}`,
    '',
    '## SUBJECT PROFILE',
    `**Primary Name:** ${profile.subject.primaryName}`,
    `**Estimated Age:** ${profile.subject.demographics.estimatedAge || 'Unknown'}`,
    `**Last Known Location:** ${formatLocation(profile.subject.lastKnownLocation)}`,
    `**Phone Numbers:** ${profile.subject.contactInformation.phones.map(p => p.number).join(', ') || 'None'}`,
    `**Email Addresses:** ${profile.subject.contactInformation.emails.map(e => e.address).join(', ') || 'None'}`,
    '',
    '## RISK ASSESSMENT',
    `**Skip Risk Level:** ${profile.riskAssessment.skipRisk.toUpperCase()}`,
    `**Predictive Probability:** ${profile.riskAssessment.predictiveProbability}%`,
    '**Risk Factors:**',
    ...profile.riskAssessment.factors.map(f => `- ${f.description} (${f.severity} severity)`),
    '',
    '## SEARCH STRATEGY',
    `**Phase:** ${profile.searchStrategy.phase.toUpperCase()}`,
    `**Search Radius:** ${profile.searchStrategy.searchRadius} miles`,
    `**Estimated Completion:** ${profile.searchStrategy.estimatedCompletion}`,
    '**Priority Sources:**',
    ...profile.searchStrategy.prioritySources.map(s => `- ${s}`),
    '',
    '## INVESTIGATIVE ACTIONS',
    ...profile.investigativeActions.map(action => 
      `**${action.action}** (${action.priority} priority) - Cost: $${action.estimatedCost}, Time: ${action.timeRequired}`
    ),
    '',
    '## RECOMMENDATIONS',
    ...profile.recommendations.map(rec => `- ${rec}`),
    '',
    '## DATA POINTS SUMMARY',
    `**Total Data Points:** ${profile.dataPoints.length}`,
    `**Verified Data Points:** ${profile.dataPoints.filter(dp => dp.isVerified).length}`,
    `**Average Confidence:** ${profile.dataPoints.length > 0 ? Math.round(profile.dataPoints.reduce((sum, dp) => sum + dp.confidence, 0) / profile.dataPoints.length) : 0}%`,
    '',
    '_Report generated by Professional Skip Tracing System_'
  ];
  
  return sections.join('\n');
}

function formatLocation(location: SubjectProfile['lastKnownLocation']): string {
  const parts = [location.address, location.city, location.state, location.zipCode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Unknown';
}