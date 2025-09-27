import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface SkipTracingQuery {
  type: 'name' | 'phone' | 'email' | 'address' | 'license_plate' | 'ssn_partial';
  value: string;
  additional_info?: {
    age_range?: string;
    state?: string;
    city?: string;
    known_aliases?: string[];
  };
}

interface SkipTracingResult {
  query: SkipTracingQuery;
  personal_info: {
    names: string[];
    addresses: string[];
    phones: string[];
    emails: string[];
    associates: string[];
    relatives: string[];
  };
  public_records: {
    voter_registration?: any;
    property_records?: any[];
    business_records?: any[];
    court_records?: any[];
    bankruptcy?: any;
  };
  digital_footprint: {
    social_media: string[];
    websites: string[];
    online_profiles: string[];
  };
  assets: {
    vehicles?: any[];
    properties?: any[];
    businesses?: any[];
  };
  confidence_score: number;
  search_time: number;
  session_id: string;
}

// Public record sources (simulated for legal/ethical skip tracing)
const PUBLIC_RECORD_SOURCES = [
  'Voter Registration Database',
  'Property Tax Records',
  'Business License Database',
  'Professional License Database',
  'Court Records Database',
  'Bankruptcy Court Records',
  'Secretary of State Business Registry',
  'Motor Vehicle Department',
  'Marriage/Divorce Records',
  'Death Index',
  'Census Records (Historical)',
  'Military Records (Public)',
  'Patent Database',
  'Trademark Database'
];

async function searchPersonByName(name: string, additionalInfo?: any): Promise<any> {
  const results = {
    names: [name],
    addresses: [],
    phones: [],
    emails: [],
    associates: [],
    relatives: []
  };

  // Simulate public records search
  // Real implementation would query actual public record databases
  
  if (Math.random() < 0.3) {
    // Add some realistic addresses
    const cities = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'];
    const streets = ['Main St', 'Oak Ave', 'First St', 'Park Rd', 'Elm Dr'];
    const address = `${Math.floor(Math.random() * 9999) + 1} ${streets[Math.floor(Math.random() * streets.length)]}, ${cities[Math.floor(Math.random() * cities.length)]}`;
    results.addresses.push(address);
  }

  if (Math.random() < 0.25) {
    // Add phone numbers
    const areaCode = Math.floor(Math.random() * 800) + 200;
    const phone = `(${areaCode}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    results.phones.push(phone);
  }

  if (Math.random() < 0.2) {
    // Add email addresses
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'aol.com'];
    const username = name.toLowerCase().replace(/\s+/g, '.') + Math.floor(Math.random() * 999);
    results.emails.push(`${username}@${domains[Math.floor(Math.random() * domains.length)]}`);
  }

  // Add potential relatives/associates
  const commonNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  if (Math.random() < 0.4) {
    const lastName = name.split(' ').pop() || name;
    const firstName = ['John', 'Mary', 'James', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda'][Math.floor(Math.random() * 8)];
    results.relatives.push(`${firstName} ${lastName}`);
  }

  return results;
}

async function searchByPhone(phone: string): Promise<any> {
  const results = {
    names: [],
    addresses: [],
    phones: [phone],
    emails: [],
    associates: [],
    relatives: []
  };

  // Reverse phone lookup simulation
  if (Math.random() < 0.4) {
    const firstNames = ['John', 'Mary', 'James', 'Patricia', 'Robert', 'Jennifer'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    results.names.push(name);
  }

  return results;
}

async function searchByEmail(email: string): Promise<any> {
  const results = {
    names: [],
    addresses: [],
    phones: [],
    emails: [email],
    associates: [],
    relatives: []
  };

  // Email reverse lookup simulation
  const username = email.split('@')[0];
  if (username.includes('.')) {
    const parts = username.split('.');
    const name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    results.names.push(name);
  }

  return results;
}

async function searchPublicRecords(personalInfo: any): Promise<any> {
  const records = {
    voter_registration: null,
    property_records: [],
    business_records: [],
    court_records: [],
    bankruptcy: null
  };

  // Simulate public records search
  if (personalInfo.names.length > 0 && Math.random() < 0.3) {
    records.voter_registration = {
      name: personalInfo.names[0],
      party: ['Democrat', 'Republican', 'Independent', 'Unaffiliated'][Math.floor(Math.random() * 4)],
      registration_date: getRandomDate(1990, 2023),
      status: 'Active'
    };
  }

  if (personalInfo.addresses.length > 0 && Math.random() < 0.25) {
    records.property_records.push({
      address: personalInfo.addresses[0],
      owner: personalInfo.names[0] || 'Unknown',
      assessed_value: Math.floor(Math.random() * 500000) + 100000,
      property_type: 'Residential',
      year_built: Math.floor(Math.random() * 50) + 1970
    });
  }

  return records;
}

async function searchDigitalFootprint(personalInfo: any): Promise<any> {
  const footprint = {
    social_media: [],
    websites: [],
    online_profiles: []
  };

  // Check various platforms based on names/emails
  const platforms = ['Facebook', 'LinkedIn', 'Twitter', 'Instagram', 'YouTube'];
  platforms.forEach(platform => {
    if (Math.random() < 0.15) { // Low probability for privacy
      footprint.social_media.push(`${platform} profile found`);
    }
  });

  return footprint;
}

async function searchAssets(personalInfo: any): Promise<any> {
  const assets = {
    vehicles: [],
    properties: [],
    businesses: []
  };

  // Vehicle records (DMV data simulation)
  if (Math.random() < 0.2) {
    const makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz'];
    const models = ['Camry', 'Accord', 'F-150', 'Silverado', '3 Series', 'C-Class'];
    assets.vehicles.push({
      make: makes[Math.floor(Math.random() * makes.length)],
      model: models[Math.floor(Math.random() * models.length)],
      year: Math.floor(Math.random() * 10) + 2015,
      vin: 'VIN redacted for privacy',
      registration_state: ['CA', 'TX', 'FL', 'NY', 'PA'][Math.floor(Math.random() * 5)]
    });
  }

  return assets;
}

function getRandomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

async function saveResults(sessionId: string, query: SkipTracingQuery, results: SkipTracingResult) {
  try {
    // Save main search session
    const { error: sessionError } = await supabase
      .from('search_sessions')
      .insert({
        id: sessionId,
        query: `skiptracing:${query.type}:${query.value}`,
        status: 'completed',
        total_results: calculateTotalResults(results),
        completed_at: new Date().toISOString(),
        search_mode: 'advanced_skiptracing'
      });

    if (sessionError) {
      console.error('Error saving session:', sessionError);
    }

    // Save individual findings
    const findings = [];

    // Add personal info findings
    results.personal_info.names.forEach(name => {
      findings.push({
        session_id: sessionId,
        title: `Name: ${name}`,
        snippet: `Associated name found in public records`,
        url: `skiptracing://personal/name/${encodeURIComponent(name)}`,
        source: 'Skip Tracing - Personal Info',
        confidence: 0.8
      });
    });

    results.personal_info.addresses.forEach(address => {
      findings.push({
        session_id: sessionId,
        title: `Address: ${address}`,
        snippet: `Residential address from public records`,
        url: `skiptracing://personal/address/${encodeURIComponent(address)}`,
        source: 'Skip Tracing - Address Records',
        confidence: 0.85
      });
    });

    // Add public records findings
    if (results.public_records.voter_registration) {
      findings.push({
        session_id: sessionId,
        title: 'Voter Registration Record',
        snippet: `Registered voter: ${results.public_records.voter_registration.party}`,
        url: 'skiptracing://public/voter_registration',
        source: 'Skip Tracing - Voter Database',
        confidence: 0.95
      });
    }

    const insertData = findings.map(finding => ({
      ...finding,
      result_hash: `${sessionId}-${finding.source}-${finding.title}`.toLowerCase().replace(/\s+/g, '-')
    }));

    if (insertData.length > 0) {
      const { error: resultsError } = await supabase
        .from('search_results')
        .insert(insertData);

      if (resultsError) {
        console.error('Error saving results:', resultsError);
      }
    }

  } catch (error) {
    console.error('Error in saveResults:', error);
  }
}

function calculateTotalResults(results: SkipTracingResult): number {
  return results.personal_info.names.length +
         results.personal_info.addresses.length +
         results.personal_info.phones.length +
         results.personal_info.emails.length +
         results.digital_footprint.social_media.length +
         (results.public_records.voter_registration ? 1 : 0) +
         results.public_records.property_records.length;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, userId } = await req.json();

    if (!query || !query.type || !query.value) {
      throw new Error('Query with type and value is required');
    }

    const sessionId = crypto.randomUUID();
    const startTime = Date.now();

    console.log(`Starting advanced skip tracing: ${query.type} = ${query.value}`);

    let personalInfo;

    // Different search strategies based on input type
    switch (query.type) {
      case 'name':
        personalInfo = await searchPersonByName(query.value, query.additional_info);
        break;
      case 'phone':
        personalInfo = await searchByPhone(query.value);
        break;
      case 'email':
        personalInfo = await searchByEmail(query.value);
        break;
      case 'address':
        personalInfo = {
          names: [],
          addresses: [query.value],
          phones: [],
          emails: [],
          associates: [],
          relatives: []
        };
        break;
      default:
        throw new Error(`Unsupported query type: ${query.type}`);
    }

    // Run additional searches based on found information
    const [publicRecords, digitalFootprint, assets] = await Promise.all([
      searchPublicRecords(personalInfo),
      searchDigitalFootprint(personalInfo),
      searchAssets(personalInfo)
    ]);

    const searchTime = Date.now() - startTime;

    // Calculate confidence score based on amount of data found
    const totalFindings = personalInfo.names.length + personalInfo.addresses.length + 
                         personalInfo.phones.length + personalInfo.emails.length +
                         digitalFootprint.social_media.length;
    const confidenceScore = Math.min(95, Math.max(10, totalFindings * 15));

    const results: SkipTracingResult = {
      query,
      personal_info: personalInfo,
      public_records: publicRecords,
      digital_footprint: digitalFootprint,
      assets,
      confidence_score: confidenceScore,
      search_time: searchTime,
      session_id: sessionId
    };

    // Save to database
    await saveResults(sessionId, query, results);

    console.log(`Advanced skip tracing completed: confidence ${confidenceScore}% in ${searchTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Skip tracing completed with ${confidenceScore}% confidence`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in advanced-skiptracer function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        results: null
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});