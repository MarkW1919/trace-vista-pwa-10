/**
 * Google Dorks and Advanced Search Query Generator
 * Industry-grade search patterns for comprehensive OSINT
 */

export interface SearchParams {
  name: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  dob?: string;
  address?: string;
}

export interface DorkQuery {
  query: string;
  category: 'basic' | 'social' | 'records' | 'business' | 'genealogy' | 'legal' | 'academic' | 'news';
  description: string;
  priority: number; // 1-5, higher is more important
}

/**
 * Generate comprehensive Google Dork queries for skip tracing
 */
export function generateGoogleDorks(params: SearchParams): DorkQuery[] {
  const { name, city, state, phone, email, dob, address } = params;
  const queries: DorkQuery[] = [];

  // Basic Identity Searches (High Priority)
  queries.push({
    query: `"${name}" "${city || ''}" "${state || ''}"`.replace(/\s+/g, ' ').trim(),
    category: 'basic',
    description: 'Basic name and location search',
    priority: 5
  });

  if (phone) {
    queries.push({
      query: `"${name}" "${phone}" OR "${phone.replace(/\D/g, '')}"`,
      category: 'basic',
      description: 'Name with phone number',
      priority: 5
    });
  }

  if (email) {
    queries.push({
      query: `"${name}" "${email}"`,
      category: 'basic',
      description: 'Name with email address',
      priority: 5
    });
  }

  // Public Records (High Priority)
  queries.push(
    {
      query: `"${name}" "${city || ''}" site:whitepages.com OR site:411.com OR site:spokeo.com`,
      category: 'records',
      description: 'Public directory searches',
      priority: 4
    },
    {
      query: `"${name}" "${state || ''}" voter registration OR voter rolls`,
      category: 'records',
      description: 'Voter registration records',
      priority: 4
    },
    {
      query: `"${name}" "${city || ''}" property deed OR property ownership`,
      category: 'records',
      description: 'Property ownership records',
      priority: 4
    },
    {
      query: `"${name}" "${state || ''}" court records OR case filetype:pdf`,
      category: 'legal',
      description: 'Court and legal records',
      priority: 3
    }
  );

  // Social Media (Medium Priority)
  queries.push(
    {
      query: `"${name}" "${city || ''}" site:facebook.com OR site:fb.com`,
      category: 'social',
      description: 'Facebook profiles',
      priority: 3
    },
    {
      query: `"${name}" "${city || ''}" site:linkedin.com`,
      category: 'social',
      description: 'LinkedIn professional profiles',
      priority: 3
    },
    {
      query: `"${name}" site:twitter.com OR site:x.com "${city || ''}"`,
      category: 'social',
      description: 'Twitter/X profiles',
      priority: 2
    },
    {
      query: `"${name}" site:instagram.com "${city || ''}"`,
      category: 'social',
      description: 'Instagram profiles',
      priority: 2
    }
  );

  // Business & Professional (Medium Priority)
  if (city && state) {
    queries.push(
      {
        query: `"${name}" "${city}" "${state}" business owner OR company OR LLC`,
        category: 'business',
        description: 'Business ownership records',
        priority: 3
      },
      {
        query: `"${name}" professional license "${state}" site:gov`,
        category: 'business',
        description: 'Professional licensing',
        priority: 3
      }
    );
  }

  // Genealogy & Family (Medium Priority)
  if (dob) {
    const birthYear = new Date(dob).getFullYear();
    queries.push(
      {
        query: `"${name}" born ${birthYear} OR birth ${birthYear}`,
        category: 'genealogy',
        description: 'Birth year genealogy search',
        priority: 3
      },
      {
        query: `site:familysearch.org "${name}" ${birthYear}`,
        category: 'genealogy',
        description: 'FamilySearch genealogy',
        priority: 2
      },
      {
        query: `site:ancestry.com "${name}" ${birthYear}`,
        category: 'genealogy',
        description: 'Ancestry.com records',
        priority: 2
      }
    );
  }

  queries.push(
    {
      query: `"${name}" relatives OR family OR spouse "${city || ''}"`,
      category: 'genealogy',
      description: 'Family and relative connections',
      priority: 3
    },
    {
      query: `"${name}" obituary OR memorial "${city || ''}"`,
      category: 'genealogy',
      description: 'Obituary and memorial records',
      priority: 2
    }
  );

  // Academic & Educational (Low Priority)
  queries.push(
    {
      query: `"${name}" "${city || ''}" site:edu alumni OR graduate OR student`,
      category: 'academic',
      description: 'Educational institution records',
      priority: 2
    },
    {
      query: `"${name}" yearbook OR graduation "${city || ''}"`,
      category: 'academic',
      description: 'School yearbook mentions',
      priority: 2
    }
  );

  // News & Media (Low Priority)
  queries.push(
    {
      query: `"${name}" "${city || ''}" site:newspapers.com OR site:news OR inurl:news`,
      category: 'news',
      description: 'News mentions and articles',
      priority: 2
    },
    {
      query: `"${name}" arrest OR charges OR conviction "${city || ''}"`,
      category: 'legal',
      description: 'Criminal records (public)',
      priority: 1
    }
  );

  // Address-specific searches
  if (address) {
    queries.push(
      {
        query: `"${name}" "${address}" OR "${address.split(' ').slice(0, 2).join(' ')}"`,
        category: 'records',
        description: 'Address-based search',
        priority: 4
      },
      {
        query: `"${address}" residents OR occupants OR directory`,
        category: 'records',
        description: 'Address resident directory',
        priority: 3
      }
    );
  }

  // Advanced pattern searches
  queries.push(
    {
      query: `"${name}" email OR contact OR phone "${city || ''}" -site:facebook.com -site:linkedin.com`,
      category: 'basic',
      description: 'Contact info (excluding social media)',
      priority: 3
    },
    {
      query: `"${name}" resume OR CV OR biography "${city || ''}" filetype:pdf`,
      category: 'business',
      description: 'Professional documents',
      priority: 2
    }
  );

  // Sort by priority and return
  return queries.sort((a, b) => b.priority - a.priority);
}

/**
 * Generate specialized dorks for specific search types
 */
export function generateSpecializedDorks(params: SearchParams, type: 'deep' | 'social' | 'business' | 'legal'): DorkQuery[] {
  const { name, city, state } = params;
  
  switch (type) {
    case 'deep':
      return [
        {
          query: `"${name}" (intext:"phone" OR intext:"email" OR intext:"address") "${city || ''}"`,
          category: 'basic',
          description: 'Deep contact information mining',
          priority: 5
        },
        {
          query: `"${name}" (filetype:pdf OR filetype:doc OR filetype:docx) "${city || ''}"`,
          category: 'basic',
          description: 'Document-based mentions',
          priority: 4
        }
      ];
      
    case 'social':
      return [
        {
          query: `"${name}" (site:facebook.com OR site:twitter.com OR site:instagram.com OR site:tiktok.com) "${city || ''}"`,
          category: 'social',
          description: 'Cross-platform social search',
          priority: 4
        },
        {
          query: `"${name}" profile OR account OR username "${city || ''}"`,
          category: 'social',
          description: 'Social profile mentions',
          priority: 3
        }
      ];
      
    case 'business':
      return [
        {
          query: `"${name}" (CEO OR founder OR owner OR president) "${city || ''}" "${state || ''}"`,
          category: 'business',
          description: 'Business leadership roles',
          priority: 4
        },
        {
          query: `"${name}" LLC OR corporation OR partnership "${state || ''}"`,
          category: 'business',
          description: 'Business entity registrations',
          priority: 4
        }
      ];
      
    case 'legal':
      return [
        {
          query: `"${name}" lawsuit OR litigation OR court "${city || ''}" "${state || ''}"`,
          category: 'legal',
          description: 'Civil litigation records',
          priority: 3
        },
        {
          query: `"${name}" bankruptcy OR foreclosure "${city || ''}"`,
          category: 'legal',
          description: 'Financial legal records',
          priority: 2
        }
      ];
      
    default:
      return [];
  }
}

/**
 * Generate queries for specific platforms
 */
export function generatePlatformQueries(params: SearchParams): Record<string, DorkQuery[]> {
  const { name, city } = params;
  
  return {
    github: [
      {
        query: `site:github.com "${name}" location:"${city || ''}"`,
        category: 'business',
        description: 'GitHub developer profiles',
        priority: 2
      }
    ],
    reddit: [
      {
        query: `site:reddit.com "${name}" OR "${name.replace(' ', '_')}"`,
        category: 'social',
        description: 'Reddit user profiles and posts',
        priority: 2
      }
    ],
    craigslist: [
      {
        query: `site:craigslist.org "${name}" contact`,
        category: 'basic',
        description: 'Craigslist contact information',
        priority: 2
      }
    ],
    trulia: [
      {
        query: `site:trulia.com OR site:zillow.com "${name}" owner`,
        category: 'records',
        description: 'Real estate ownership',
        priority: 3
      }
    ]
  };
}

/**
 * Generate reverse search queries (from known info to find more)
 */
export function generateReverseQueries(params: SearchParams): DorkQuery[] {
  const { phone, email, address } = params;
  const queries: DorkQuery[] = [];
  
  if (phone) {
    queries.push({
      query: `"${phone}" OR "${phone.replace(/\D/g, '')}" -site:whitepages.com`,
      category: 'basic',
      description: 'Reverse phone lookup',
      priority: 4
    });
  }
  
  if (email) {
    queries.push({
      query: `"${email}" -site:gravatar.com -site:about.me`,
      category: 'basic',
      description: 'Reverse email search',
      priority: 4
    });
  }
  
  if (address) {
    queries.push({
      query: `"${address}" residents OR directory OR neighbors`,
      category: 'records',
      description: 'Address resident lookup',
      priority: 3
    });
  }
  
  return queries;
}