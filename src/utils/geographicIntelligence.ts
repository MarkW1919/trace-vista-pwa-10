/**
 * Geographic Intelligence for Skip Tracing
 * Advanced location analysis, proximity calculations, and movement patterns
 */

export interface LocationIntelligence {
  address: string;
  coordinates?: { lat: number; lng: number };
  confidence: number;
  addressType: 'residential' | 'commercial' | 'po_box' | 'apartment' | 'unknown';
  verification: {
    isValid: boolean;
    postalService: boolean;
    realEstate: boolean;
    businessDirectory: boolean;
  };
  demographics?: {
    medianIncome?: number;
    populationDensity?: number;
    crimeRate?: 'low' | 'medium' | 'high';
  };
  proximity: {
    nearbyAddresses: string[];
    schools: string[];
    businesses: string[];
    governmentFacilities: string[];
  };
  riskFactors: string[];
}

export interface GeographicPattern {
  addressHistory: AddressHistoryItem[];
  movementPattern: 'stable' | 'frequent_mover' | 'recent_relocation' | 'unknown';
  searchRadius: number; // miles
  primaryRegion: string;
  secondaryRegions: string[];
  proximityScore: number;
}

export interface AddressHistoryItem {
  address: string;
  dateRange: string;
  confidence: number;
  source: string;
  isCurrent: boolean;
}

// Comprehensive geographic database
const GEOGRAPHIC_DATABASE = {
  // US States with counties and major cities
  states: {
    'AL': {
      name: 'Alabama',
      timezone: 'Central',
      counties: {
        'Jefferson': { seat: 'Birmingham', majorCities: ['Birmingham', 'Hoover'] },
        'Mobile': { seat: 'Mobile', majorCities: ['Mobile', 'Prichard'] },
        'Madison': { seat: 'Huntsville', majorCities: ['Huntsville', 'Madison'] },
        'Montgomery': { seat: 'Montgomery', majorCities: ['Montgomery', 'Prattville'] },
        'Tuscaloosa': { seat: 'Tuscaloosa', majorCities: ['Tuscaloosa', 'Northport'] }
      }
    },
    'AK': {
      name: 'Alaska',
      timezone: 'Alaska',
      counties: {
        'Anchorage': { seat: 'Anchorage', majorCities: ['Anchorage'] },
        'Fairbanks North Star': { seat: 'Fairbanks', majorCities: ['Fairbanks'] },
        'Matanuska-Susitna': { seat: 'Palmer', majorCities: ['Wasilla', 'Palmer'] }
      }
    },
    'AZ': {
      name: 'Arizona',
      timezone: 'Mountain',
      counties: {
        'Maricopa': { seat: 'Phoenix', majorCities: ['Phoenix', 'Mesa', 'Glendale', 'Scottsdale', 'Chandler', 'Tempe'] },
        'Pima': { seat: 'Tucson', majorCities: ['Tucson'] },
        'Pinal': { seat: 'Florence', majorCities: ['Casa Grande', 'Maricopa'] }
      }
    },
    'AR': {
      name: 'Arkansas',
      timezone: 'Central',
      counties: {
        'Pulaski': { seat: 'Little Rock', majorCities: ['Little Rock', 'North Little Rock'] },
        'Washington': { seat: 'Fayetteville', majorCities: ['Fayetteville', 'Springdale'] },
        'Benton': { seat: 'Bentonville', majorCities: ['Bentonville', 'Rogers'] }
      }
    },
    'CA': {
      name: 'California',
      timezone: 'Pacific',
      counties: {
        'Los Angeles': { seat: 'Los Angeles', majorCities: ['Los Angeles', 'Long Beach', 'Glendale', 'Santa Clarita', 'Lakewood'] },
        'San Diego': { seat: 'San Diego', majorCities: ['San Diego', 'Chula Vista', 'Oceanside', 'Escondido'] },
        'Orange': { seat: 'Santa Ana', majorCities: ['Anaheim', 'Santa Ana', 'Irvine', 'Huntington Beach'] },
        'Riverside': { seat: 'Riverside', majorCities: ['Riverside', 'Corona', 'Moreno Valley'] },
        'San Bernardino': { seat: 'San Bernardino', majorCities: ['San Bernardino', 'Fontana', 'Rancho Cucamonga'] },
        'Alameda': { seat: 'Oakland', majorCities: ['Oakland', 'Fremont', 'Hayward'] },
        'Santa Clara': { seat: 'San Jose', majorCities: ['San Jose', 'Sunnyvale', 'Santa Clara'] },
        'Sacramento': { seat: 'Sacramento', majorCities: ['Sacramento', 'Elk Grove'] },
        'Contra Costa': { seat: 'Martinez', majorCities: ['Concord', 'Antioch', 'Richmond'] },
        'Fresno': { seat: 'Fresno', majorCities: ['Fresno', 'Clovis'] }
      }
    },
    'CO': {
      name: 'Colorado',
      timezone: 'Mountain',
      counties: {
        'Denver': { seat: 'Denver', majorCities: ['Denver'] },
        'Jefferson': { seat: 'Golden', majorCities: ['Lakewood', 'Westminster', 'Arvada'] },
        'Adams': { seat: 'Brighton', majorCities: ['Thornton', 'Westminster', 'Northglenn'] },
        'Arapahoe': { seat: 'Littleton', majorCities: ['Aurora', 'Centennial', 'Littleton'] },
        'El Paso': { seat: 'Colorado Springs', majorCities: ['Colorado Springs'] }
      }
    },
    'FL': {
      name: 'Florida',
      timezone: 'Eastern',
      counties: {
        'Miami-Dade': { seat: 'Miami', majorCities: ['Miami', 'Hialeah', 'Miami Gardens', 'Homestead'] },
        'Broward': { seat: 'Fort Lauderdale', majorCities: ['Fort Lauderdale', 'Hollywood', 'Pembroke Pines', 'Coral Springs'] },
        'Palm Beach': { seat: 'West Palm Beach', majorCities: ['West Palm Beach', 'Boca Raton', 'Delray Beach'] },
        'Hillsborough': { seat: 'Tampa', majorCities: ['Tampa', 'Plant City'] },
        'Orange': { seat: 'Orlando', majorCities: ['Orlando', 'Winter Park'] },
        'Pinellas': { seat: 'Clearwater', majorCities: ['St. Petersburg', 'Clearwater', 'Largo'] },
        'Duval': { seat: 'Jacksonville', majorCities: ['Jacksonville'] }
      }
    },
    'GA': {
      name: 'Georgia',
      timezone: 'Eastern',
      counties: {
        'Fulton': { seat: 'Atlanta', majorCities: ['Atlanta', 'Sandy Springs', 'Roswell'] },
        'Gwinnett': { seat: 'Lawrenceville', majorCities: ['Lawrenceville', 'Duluth', 'Norcross'] },
        'Cobb': { seat: 'Marietta', majorCities: ['Marietta', 'Kennesaw', 'Acworth'] },
        'DeKalb': { seat: 'Decatur', majorCities: ['Decatur', 'Dunwoody'] },
        'Clayton': { seat: 'Jonesboro', majorCities: ['Jonesboro', 'Forest Park'] }
      }
    },
    'IL': {
      name: 'Illinois',
      timezone: 'Central',
      counties: {
        'Cook': { seat: 'Chicago', majorCities: ['Chicago', 'Evanston', 'Cicero', 'Oak Park'] },
        'DuPage': { seat: 'Wheaton', majorCities: ['Aurora', 'Naperville', 'Wheaton', 'Downers Grove'] },
        'Lake': { seat: 'Waukegan', majorCities: ['Waukegan', 'Elgin', 'Highland Park'] },
        'Will': { seat: 'Joliet', majorCities: ['Joliet', 'Naperville', 'Bolingbrook'] },
        'Kane': { seat: 'Geneva', majorCities: ['Aurora', 'Elgin', 'Carpentersville'] }
      }
    },
    'IN': {
      name: 'Indiana',
      timezone: 'Eastern',
      counties: {
        'Marion': { seat: 'Indianapolis', majorCities: ['Indianapolis'] },
        'Lake': { seat: 'Crown Point', majorCities: ['Gary', 'Hammond', 'East Chicago'] },
        'Allen': { seat: 'Fort Wayne', majorCities: ['Fort Wayne', 'New Haven'] },
        'Hamilton': { seat: 'Noblesville', majorCities: ['Carmel', 'Fishers', 'Noblesville'] }
      }
    },
    'IA': {
      name: 'Iowa',
      timezone: 'Central',
      counties: {
        'Polk': { seat: 'Des Moines', majorCities: ['Des Moines', 'West Des Moines'] },
        'Linn': { seat: 'Cedar Rapids', majorCities: ['Cedar Rapids', 'Marion'] },
        'Scott': { seat: 'Davenport', majorCities: ['Davenport', 'Bettendorf'] }
      }
    },
    'KS': {
      name: 'Kansas',
      timezone: 'Central',
      counties: {
        'Johnson': { seat: 'Olathe', majorCities: ['Overland Park', 'Kansas City', 'Olathe'] },
        'Sedgwick': { seat: 'Wichita', majorCities: ['Wichita'] },
        'Shawnee': { seat: 'Topeka', majorCities: ['Topeka'] }
      }
    },
    'KY': {
      name: 'Kentucky',
      timezone: 'Eastern',
      counties: {
        'Jefferson': { seat: 'Louisville', majorCities: ['Louisville'] },
        'Fayette': { seat: 'Lexington', majorCities: ['Lexington'] },
        'Kenton': { seat: 'Covington', majorCities: ['Covington', 'Independence'] }
      }
    },
    'LA': {
      name: 'Louisiana',
      timezone: 'Central',
      counties: {
        'Orleans': { seat: 'New Orleans', majorCities: ['New Orleans'] },
        'Jefferson': { seat: 'Gretna', majorCities: ['Metairie', 'Kenner'] },
        'East Baton Rouge': { seat: 'Baton Rouge', majorCities: ['Baton Rouge'] }
      }
    },
    'ME': {
      name: 'Maine',
      timezone: 'Eastern',
      counties: {
        'Cumberland': { seat: 'Portland', majorCities: ['Portland', 'South Portland'] },
        'York': { seat: 'Alfred', majorCities: ['Biddeford', 'Sanford'] }
      }
    },
    'MD': {
      name: 'Maryland',
      timezone: 'Eastern',
      counties: {
        'Montgomery': { seat: 'Rockville', majorCities: ['Silver Spring', 'Bethesda', 'Gaithersburg'] },
        'Prince Georges': { seat: 'Upper Marlboro', majorCities: ['Bowie', 'College Park'] },
        'Baltimore': { seat: 'Towson', majorCities: ['Baltimore', 'Dundalk'] },
        'Anne Arundel': { seat: 'Annapolis', majorCities: ['Annapolis', 'Glen Burnie'] }
      }
    },
    'MA': {
      name: 'Massachusetts',
      timezone: 'Eastern',
      counties: {
        'Suffolk': { seat: 'Boston', majorCities: ['Boston', 'Chelsea', 'Revere'] },
        'Middlesex': { seat: 'Cambridge', majorCities: ['Cambridge', 'Lowell', 'Somerville'] },
        'Worcester': { seat: 'Worcester', majorCities: ['Worcester', 'Leominster'] },
        'Essex': { seat: 'Salem', majorCities: ['Lynn', 'Lawrence', 'Haverhill'] }
      }
    },
    'MI': {
      name: 'Michigan',
      timezone: 'Eastern',
      counties: {
        'Wayne': { seat: 'Detroit', majorCities: ['Detroit', 'Livonia', 'Westland'] },
        'Oakland': { seat: 'Pontiac', majorCities: ['Troy', 'Farmington Hills', 'Southfield'] },
        'Macomb': { seat: 'Mount Clemens', majorCities: ['Sterling Heights', 'Warren'] },
        'Kent': { seat: 'Grand Rapids', majorCities: ['Grand Rapids', 'Wyoming', 'Kentwood'] }
      }
    },
    'MN': {
      name: 'Minnesota',
      timezone: 'Central',
      counties: {
        'Hennepin': { seat: 'Minneapolis', majorCities: ['Minneapolis', 'Bloomington', 'Plymouth'] },
        'Ramsey': { seat: 'St. Paul', majorCities: ['St. Paul', 'Roseville'] },
        'Dakota': { seat: 'Hastings', majorCities: ['Eagan', 'Burnsville', 'Apple Valley'] }
      }
    },
    'MS': {
      name: 'Mississippi',
      timezone: 'Central',
      counties: {
        'Hinds': { seat: 'Jackson', majorCities: ['Jackson'] },
        'Harrison': { seat: 'Gulfport', majorCities: ['Gulfport', 'Biloxi'] },
        'DeSoto': { seat: 'Hernando', majorCities: ['Southaven', 'Horn Lake'] }
      }
    },
    'MO': {
      name: 'Missouri',
      timezone: 'Central',
      counties: {
        'Jackson': { seat: 'Kansas City', majorCities: ['Kansas City', 'Independence'] },
        'St. Louis': { seat: 'Clayton', majorCities: ['Florissant', 'Chesterfield'] },
        'St. Louis City': { seat: 'St. Louis', majorCities: ['St. Louis'] },
        'Greene': { seat: 'Springfield', majorCities: ['Springfield'] }
      }
    },
    'MT': {
      name: 'Montana',
      timezone: 'Mountain',
      counties: {
        'Yellowstone': { seat: 'Billings', majorCities: ['Billings'] },
        'Missoula': { seat: 'Missoula', majorCities: ['Missoula'] },
        'Cascade': { seat: 'Great Falls', majorCities: ['Great Falls'] }
      }
    },
    'NE': {
      name: 'Nebraska',
      timezone: 'Central',
      counties: {
        'Douglas': { seat: 'Omaha', majorCities: ['Omaha'] },
        'Lancaster': { seat: 'Lincoln', majorCities: ['Lincoln'] },
        'Sarpy': { seat: 'Papillion', majorCities: ['Bellevue', 'Papillion'] }
      }
    },
    'NV': {
      name: 'Nevada',
      timezone: 'Pacific',
      counties: {
        'Clark': { seat: 'Las Vegas', majorCities: ['Las Vegas', 'Henderson', 'North Las Vegas'] },
        'Washoe': { seat: 'Reno', majorCities: ['Reno', 'Sparks'] }
      }
    },
    'NH': {
      name: 'New Hampshire',
      timezone: 'Eastern',
      counties: {
        'Hillsborough': { seat: 'Nashua', majorCities: ['Manchester', 'Nashua'] },
        'Rockingham': { seat: 'Brentwood', majorCities: ['Derry', 'Salem'] }
      }
    },
    'NJ': {
      name: 'New Jersey',
      timezone: 'Eastern',
      counties: {
        'Bergen': { seat: 'Hackensack', majorCities: ['Hackensack', 'Paramus', 'Fort Lee'] },
        'Essex': { seat: 'Newark', majorCities: ['Newark', 'Jersey City', 'Elizabeth'] },
        'Hudson': { seat: 'Jersey City', majorCities: ['Jersey City', 'Bayonne', 'Hoboken'] },
        'Middlesex': { seat: 'New Brunswick', majorCities: ['Edison', 'Woodbridge', 'New Brunswick'] }
      }
    },
    'NM': {
      name: 'New Mexico',
      timezone: 'Mountain',
      counties: {
        'Bernalillo': { seat: 'Albuquerque', majorCities: ['Albuquerque'] },
        'Dona Ana': { seat: 'Las Cruces', majorCities: ['Las Cruces'] },
        'Santa Fe': { seat: 'Santa Fe', majorCities: ['Santa Fe'] }
      }
    },
    'NY': {
      name: 'New York',
      timezone: 'Eastern',
      counties: {
        'New York': { seat: 'New York', majorCities: ['Manhattan'] },
        'Kings': { seat: 'Brooklyn', majorCities: ['Brooklyn'] },
        'Queens': { seat: 'Jamaica', majorCities: ['Queens'] },
        'Bronx': { seat: 'Bronx', majorCities: ['Bronx'] },
        'Richmond': { seat: 'St. George', majorCities: ['Staten Island'] },
        'Nassau': { seat: 'Mineola', majorCities: ['Hempstead', 'Levittown'] },
        'Suffolk': { seat: 'Riverhead', majorCities: ['Huntington', 'Brookhaven'] },
        'Westchester': { seat: 'White Plains', majorCities: ['Yonkers', 'New Rochelle'] },
        'Erie': { seat: 'Buffalo', majorCities: ['Buffalo', 'Cheektowaga'] },
        'Monroe': { seat: 'Rochester', majorCities: ['Rochester', 'Greece'] }
      }
    },
    'NC': {
      name: 'North Carolina',
      timezone: 'Eastern',
      counties: {
        'Mecklenburg': { seat: 'Charlotte', majorCities: ['Charlotte'] },
        'Wake': { seat: 'Raleigh', majorCities: ['Raleigh', 'Cary'] },
        'Guilford': { seat: 'Greensboro', majorCities: ['Greensboro', 'High Point'] },
        'Forsyth': { seat: 'Winston-Salem', majorCities: ['Winston-Salem'] },
        'Durham': { seat: 'Durham', majorCities: ['Durham'] }
      }
    },
    'ND': {
      name: 'North Dakota',
      timezone: 'Central',
      counties: {
        'Cass': { seat: 'Fargo', majorCities: ['Fargo'] },
        'Burleigh': { seat: 'Bismarck', majorCities: ['Bismarck'] },
        'Grand Forks': { seat: 'Grand Forks', majorCities: ['Grand Forks'] }
      }
    },
    'OH': {
      name: 'Ohio',
      timezone: 'Eastern',
      counties: {
        'Cuyahoga': { seat: 'Cleveland', majorCities: ['Cleveland', 'Parma', 'Lakewood'] },
        'Franklin': { seat: 'Columbus', majorCities: ['Columbus', 'Dublin', 'Westerville'] },
        'Hamilton': { seat: 'Cincinnati', majorCities: ['Cincinnati'] },
        'Summit': { seat: 'Akron', majorCities: ['Akron'] },
        'Montgomery': { seat: 'Dayton', majorCities: ['Dayton', 'Kettering'] }
      }
    },
    'OK': {
      name: 'Oklahoma',
      timezone: 'Central',
      counties: {
        'Oklahoma': { seat: 'Oklahoma City', majorCities: ['Oklahoma City', 'Edmond'] },
        'Tulsa': { seat: 'Tulsa', majorCities: ['Tulsa', 'Broken Arrow'] },
        'Cleveland': { seat: 'Norman', majorCities: ['Norman', 'Moore'] },
        'Comanche': { seat: 'Lawton', majorCities: ['Lawton'] },
        'Canadian': { seat: 'El Reno', majorCities: ['Yukon', 'Mustang'] },
        'Bryan': { seat: 'Durant', majorCities: ['Durant', 'Calera', 'Caddo'] },
        'Atoka': { seat: 'Atoka', majorCities: ['Atoka', 'Stringtown'] },
        'Marshall': { seat: 'Madill', majorCities: ['Madill', 'Kingston'] },
        'Carter': { seat: 'Ardmore', majorCities: ['Ardmore'] },
        'Garvin': { seat: 'Pauls Valley', majorCities: ['Pauls Valley'] },
        'Love': { seat: 'Marietta', majorCities: ['Marietta'] },
        'Johnston': { seat: 'Tishomingo', majorCities: ['Tishomingo'] }
      }
    },
    'OR': {
      name: 'Oregon',
      timezone: 'Pacific',
      counties: {
        'Multnomah': { seat: 'Portland', majorCities: ['Portland', 'Gresham'] },
        'Washington': { seat: 'Hillsboro', majorCities: ['Hillsboro', 'Beaverton', 'Tigard'] },
        'Clackamas': { seat: 'Oregon City', majorCities: ['Milwaukie', 'Lake Oswego'] },
        'Lane': { seat: 'Eugene', majorCities: ['Eugene', 'Springfield'] }
      }
    },
    'PA': {
      name: 'Pennsylvania',
      timezone: 'Eastern',
      counties: {
        'Philadelphia': { seat: 'Philadelphia', majorCities: ['Philadelphia'] },
        'Allegheny': { seat: 'Pittsburgh', majorCities: ['Pittsburgh'] },
        'Montgomery': { seat: 'Norristown', majorCities: ['Norristown', 'Abington'] },
        'Bucks': { seat: 'Doylestown', majorCities: ['Levittown', 'Bensalem'] },
        'Delaware': { seat: 'Media', majorCities: ['Chester', 'Aston'] }
      }
    },
    'RI': {
      name: 'Rhode Island',
      timezone: 'Eastern',
      counties: {
        'Providence': { seat: 'Providence', majorCities: ['Providence', 'Warwick', 'Cranston'] },
        'Kent': { seat: 'East Greenwich', majorCities: ['Coventry', 'West Warwick'] },
        'Washington': { seat: 'South Kingstown', majorCities: ['South Kingstown', 'North Kingstown'] }
      }
    },
    'SC': {
      name: 'South Carolina',
      timezone: 'Eastern',
      counties: {
        'Greenville': { seat: 'Greenville', majorCities: ['Greenville', 'Greer'] },
        'Richland': { seat: 'Columbia', majorCities: ['Columbia'] },
        'Charleston': { seat: 'Charleston', majorCities: ['Charleston', 'North Charleston'] },
        'Horry': { seat: 'Conway', majorCities: ['Myrtle Beach', 'Conway'] }
      }
    },
    'SD': {
      name: 'South Dakota',
      timezone: 'Central',
      counties: {
        'Minnehaha': { seat: 'Sioux Falls', majorCities: ['Sioux Falls'] },
        'Pennington': { seat: 'Rapid City', majorCities: ['Rapid City'] },
        'Lincoln': { seat: 'Canton', majorCities: ['Tea', 'Harrisburg'] }
      }
    },
    'TN': {
      name: 'Tennessee',
      timezone: 'Central',
      counties: {
        'Shelby': { seat: 'Memphis', majorCities: ['Memphis'] },
        'Davidson': { seat: 'Nashville', majorCities: ['Nashville'] },
        'Knox': { seat: 'Knoxville', majorCities: ['Knoxville'] },
        'Hamilton': { seat: 'Chattanooga', majorCities: ['Chattanooga'] }
      }
    },
    'TX': {
      name: 'Texas',
      timezone: 'Central',
      counties: {
        'Harris': { seat: 'Houston', majorCities: ['Houston', 'Pasadena', 'Baytown'] },
        'Dallas': { seat: 'Dallas', majorCities: ['Dallas', 'Garland', 'Irving'] },
        'Tarrant': { seat: 'Fort Worth', majorCities: ['Fort Worth', 'Arlington', 'Grand Prairie'] },
        'Bexar': { seat: 'San Antonio', majorCities: ['San Antonio'] },
        'Travis': { seat: 'Austin', majorCities: ['Austin'] },
        'Collin': { seat: 'McKinney', majorCities: ['Plano', 'McKinney', 'Frisco'] },
        'El Paso': { seat: 'El Paso', majorCities: ['El Paso'] },
        'Denton': { seat: 'Denton', majorCities: ['Denton', 'Lewisville', 'Flower Mound'] }
      }
    },
    'UT': {
      name: 'Utah',
      timezone: 'Mountain',
      counties: {
        'Salt Lake': { seat: 'Salt Lake City', majorCities: ['Salt Lake City', 'West Valley City'] },
        'Utah': { seat: 'Provo', majorCities: ['Provo', 'Orem'] },
        'Davis': { seat: 'Farmington', majorCities: ['Layton', 'Bountiful'] },
        'Weber': { seat: 'Ogden', majorCities: ['Ogden', 'Roy'] }
      }
    },
    'VT': {
      name: 'Vermont',
      timezone: 'Eastern',
      counties: {
        'Chittenden': { seat: 'Burlington', majorCities: ['Burlington', 'South Burlington'] },
        'Rutland': { seat: 'Rutland', majorCities: ['Rutland'] },
        'Washington': { seat: 'Montpelier', majorCities: ['Montpelier', 'Barre'] }
      }
    },
    'VA': {
      name: 'Virginia',
      timezone: 'Eastern',
      counties: {
        'Fairfax': { seat: 'Fairfax', majorCities: ['Virginia Beach', 'Norfolk', 'Chesapeake'] },
        'Prince William': { seat: 'Manassas', majorCities: ['Woodbridge', 'Dale City'] },
        'Virginia Beach City': { seat: 'Virginia Beach', majorCities: ['Virginia Beach'] },
        'Henrico': { seat: 'Richmond', majorCities: ['Richmond'] }
      }
    },
    'WA': {
      name: 'Washington',
      timezone: 'Pacific',
      counties: {
        'King': { seat: 'Seattle', majorCities: ['Seattle', 'Bellevue', 'Kent'] },
        'Pierce': { seat: 'Tacoma', majorCities: ['Tacoma', 'Lakewood'] },
        'Snohomish': { seat: 'Everett', majorCities: ['Everett', 'Edmonds'] },
        'Spokane': { seat: 'Spokane', majorCities: ['Spokane'] }
      }
    },
    'WV': {
      name: 'West Virginia',
      timezone: 'Eastern',
      counties: {
        'Kanawha': { seat: 'Charleston', majorCities: ['Charleston'] },
        'Berkeley': { seat: 'Martinsburg', majorCities: ['Martinsburg'] },
        'Jefferson': { seat: 'Charles Town', majorCities: ['Charles Town'] }
      }
    },
    'WI': {
      name: 'Wisconsin',
      timezone: 'Central',
      counties: {
        'Milwaukee': { seat: 'Milwaukee', majorCities: ['Milwaukee'] },
        'Dane': { seat: 'Madison', majorCities: ['Madison'] },
        'Waukesha': { seat: 'Waukesha', majorCities: ['Waukesha', 'New Berlin'] },
        'Brown': { seat: 'Green Bay', majorCities: ['Green Bay'] }
      }
    },
    'WY': {
      name: 'Wyoming',
      timezone: 'Mountain',
      counties: {
        'Laramie': { seat: 'Cheyenne', majorCities: ['Cheyenne'] },
        'Natrona': { seat: 'Casper', majorCities: ['Casper'] },
        'Campbell': { seat: 'Gillette', majorCities: ['Gillette'] }
      }
    }
  },
  
  // Skip tracing proximity patterns for Oklahoma (example)
  proximityNetworks: {
    'OK': {
      'Bryan County': {
        primaryCities: ['Durant', 'Calera', 'Caddo'],
        neighboringCounties: ['Atoka', 'Marshall', 'Choctaw', 'McCurtain'],
        searchRadius: 25, // miles
        commonMigrationPatterns: ['Dallas-Fort Worth TX', 'Oklahoma City OK', 'Tulsa OK']
      },
      'Atoka County': {
        primaryCities: ['Atoka', 'Stringtown', 'Tushka'],
        neighboringCounties: ['Bryan', 'Coal', 'Pushmataha', 'Pittsburg'],
        searchRadius: 20,
        commonMigrationPatterns: ['Bryan County', 'Durant', 'McAlester']
      },
      'Marshall County': {
        primaryCities: ['Madill', 'Kingston', 'Lebanon'],
        neighboringCounties: ['Bryan', 'Johnston', 'Love', 'Carter'],
        searchRadius: 15,
        commonMigrationPatterns: ['Bryan County', 'Durant', 'Ardmore']
      }
    }
  }
};

/**
 * Analyze address for comprehensive location intelligence
 */
export function analyzeAddress(
  address: string, 
  context?: {
    searchName?: string;
    searchLocation?: string;
    knownAddresses?: string[];
  }
): LocationIntelligence {
  const parsedAddress = parseAddress(address);
  const addressType = determineAddressType(address);
  const confidence = calculateLocationConfidence(address, parsedAddress, context);
  const verification = performAddressVerification(address, parsedAddress);
  const proximity = analyzeProximity(parsedAddress);
  const riskFactors = identifyLocationRiskFactors(address, parsedAddress, addressType);
  
  return {
    address: address.trim(),
    confidence,
    addressType,
    verification,
    proximity,
    riskFactors
  };
}

function parseAddress(address: string) {
  const normalizedAddress = address.replace(/\s+/g, ' ').trim();
  
  // Extract components using regex patterns
  const patterns = {
    streetNumber: /^(\d+[A-Za-z]?)\s/,
    streetName: /^\d+[A-Za-z]?\s+(.+?)\s+(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?|Court|Ct\.?|Circle|Cir\.?|Way|Place|Pl\.?)/i,
    streetSuffix: /(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?|Court|Ct\.?|Circle|Cir\.?|Way|Place|Pl\.?)/i,
    unit: /(Apt\.?|Apartment|Unit|Ste\.?|Suite|#)\s*([A-Za-z0-9\-]+)/i,
    city: /,\s*([A-Za-z\s]+),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/,
    state: /\b([A-Z]{2})\s+\d{5}/,
    zipCode: /\b(\d{5}(?:-\d{4})?)\b/,
    poBox: /P\.?O\.?\s*Box\s+(\d+)/i
  };
  
  const streetNumberMatch = normalizedAddress.match(patterns.streetNumber);
  const streetNameMatch = normalizedAddress.match(patterns.streetName);
  const unitMatch = normalizedAddress.match(patterns.unit);
  const cityMatch = normalizedAddress.match(patterns.city);
  const stateMatch = normalizedAddress.match(patterns.state);
  const zipMatch = normalizedAddress.match(patterns.zipCode);
  const poBoxMatch = normalizedAddress.match(patterns.poBox);
  
  return {
    streetNumber: streetNumberMatch?.[1] || '',
    streetName: streetNameMatch?.[1] || '',
    streetSuffix: streetNameMatch?.[2] || '',
    unit: unitMatch?.[2] || '',
    city: cityMatch?.[1] || '',
    state: stateMatch?.[1] || '',
    zipCode: zipMatch?.[1] || '',
    poBox: poBoxMatch?.[1] || '',
    isComplete: !!(streetNumberMatch && streetNameMatch && cityMatch && stateMatch && zipMatch)
  };
}

function determineAddressType(address: string): LocationIntelligence['addressType'] {
  const lowerAddress = address.toLowerCase();
  
  if (/p\.?o\.?\s*box/i.test(address)) {
    return 'po_box';
  }
  
  if (/(apt\.?|apartment|unit|ste\.?|suite|#)/i.test(address)) {
    return 'apartment';
  }
  
  // Business indicators
  const businessIndicators = [
    'llc', 'inc', 'corp', 'company', 'co\.', 'ltd', 'office', 'building', 'plaza',
    'center', 'mall', 'store', 'shop', 'restaurant', 'hotel', 'motel'
  ];
  
  if (businessIndicators.some(indicator => new RegExp(`\\b${indicator}\\b`, 'i').test(lowerAddress))) {
    return 'commercial';
  }
  
  // If it has a street number and residential street suffix, likely residential
  if (/^\d+/.test(address) && /(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|way|place|pl)\b/i.test(address)) {
    return 'residential';
  }
  
  return 'unknown';
}

function calculateLocationConfidence(
  address: string, 
  parsedAddress: any, 
  context?: {
    searchName?: string;
    searchLocation?: string;
    knownAddresses?: string[];
  }
): number {
  let confidence = 20; // Base confidence
  
  // Complete address components
  if (parsedAddress.isComplete) {
    confidence += 30;
  } else {
    if (parsedAddress.streetNumber) confidence += 5;
    if (parsedAddress.streetName) confidence += 10;
    if (parsedAddress.city) confidence += 10;
    if (parsedAddress.state) confidence += 10;
    if (parsedAddress.zipCode) confidence += 15;
  }
  
  // Valid state code
  if (parsedAddress.state && GEOGRAPHIC_DATABASE.states[parsedAddress.state]) {
    confidence += 15;
  }
  
  // Context matching
  if (context?.searchLocation) {
    const searchLower = context.searchLocation.toLowerCase();
    const addressLower = address.toLowerCase();
    
    if (parsedAddress.city && searchLower.includes(parsedAddress.city.toLowerCase())) {
      confidence += 20;
    }
    
    if (parsedAddress.state && searchLower.includes(parsedAddress.state.toLowerCase())) {
      confidence += 10;
    }
  }
  
  // Known address correlation
  if (context?.knownAddresses) {
    const hasRelated = context.knownAddresses.some(known => {
      const knownParsed = parseAddress(known);
      return knownParsed.city === parsedAddress.city || 
             knownParsed.zipCode === parsedAddress.zipCode;
    });
    
    if (hasRelated) {
      confidence += 15;
    }
  }
  
  // Address format validation
  if (/^\d+\s+.+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct)\b/i.test(address)) {
    confidence += 10;
  }
  
  return Math.min(confidence, 100);
}

function performAddressVerification(address: string, parsedAddress: any) {
  // This would integrate with real address validation services in production
  
  const verification = {
    isValid: false,
    postalService: false,
    realEstate: false,
    businessDirectory: false
  };
  
  // Basic validation checks
  if (parsedAddress.isComplete) {
    verification.isValid = true;
    
    // Simulate postal service validation
    if (parsedAddress.zipCode && parsedAddress.state) {
      verification.postalService = true;
    }
    
    // Simulate real estate database check
    if (parsedAddress.streetNumber && parsedAddress.streetName && parsedAddress.city) {
      verification.realEstate = Math.random() > 0.3; // 70% chance of being in real estate DB
    }
    
    // Simulate business directory check
    if (address.toLowerCase().includes('po box') || 
        /(llc|inc|corp|company|office|building|plaza|center)/i.test(address)) {
      verification.businessDirectory = Math.random() > 0.5; // 50% chance for business addresses
    }
  }
  
  return verification;
}

function analyzeProximity(parsedAddress: any) {
  const proximity = {
    nearbyAddresses: [] as string[],
    schools: [] as string[],
    businesses: [] as string[],
    governmentFacilities: [] as string[]
  };
  
  // This would use real geocoding and proximity services in production
  if (parsedAddress.state && parsedAddress.city) {
    const stateData = GEOGRAPHIC_DATABASE.states[parsedAddress.state];
    if (stateData) {
      // Find county data
      const countyData = Object.values(stateData.counties).find(county => 
        county.majorCities.some(city => 
          city.toLowerCase() === parsedAddress.city.toLowerCase()
        )
      );
      
      if (countyData) {
        proximity.nearbyAddresses = countyData.majorCities.filter(city => 
          city.toLowerCase() !== parsedAddress.city.toLowerCase()
        ).slice(0, 3);
        
        // Generate mock nearby facilities
        proximity.schools = [`${parsedAddress.city} Elementary School`, `${parsedAddress.city} High School`];
        proximity.businesses = [`${parsedAddress.city} Shopping Center`, `${parsedAddress.city} Plaza`];
        proximity.governmentFacilities = [`${parsedAddress.city} City Hall`, `${countyData.seat} County Courthouse`];
      }
    }
  }
  
  return proximity;
}

function identifyLocationRiskFactors(address: string, parsedAddress: any, addressType: string): string[] {
  const riskFactors: string[] = [];
  
  // Incomplete address
  if (!parsedAddress.isComplete) {
    riskFactors.push('Incomplete address information');
  }
  
  // PO Box addresses
  if (addressType === 'po_box') {
    riskFactors.push('PO Box address - no physical location');
  }
  
  // Invalid state
  if (parsedAddress.state && !GEOGRAPHIC_DATABASE.states[parsedAddress.state]) {
    riskFactors.push('Invalid state code');
  }
  
  // Suspicious patterns
  if (/^\d{4,}\s/.test(address)) {
    riskFactors.push('Unusually high street number');
  }
  
  // Generic address components
  const genericStreets = ['main st', 'first st', '1st st', 'oak st', 'park ave'];
  if (genericStreets.some(generic => address.toLowerCase().includes(generic))) {
    riskFactors.push('Generic street name (verify authenticity)');
  }
  
  // Rural route patterns
  if (/rural route|rr\s*\d+|county road|cr\s*\d+/i.test(address)) {
    riskFactors.push('Rural address (may be difficult to verify)');
  }
  
  return riskFactors;
}

/**
 * Analyze geographic patterns across multiple addresses
 */
export function analyzeGeographicPattern(addresses: string[], context?: {
  searchName?: string;
  timeframe?: string;
}): GeographicPattern {
  const addressIntelligence = addresses.map(addr => analyzeAddress(addr, { knownAddresses: addresses }));
  
  // Build address history
  const addressHistory: AddressHistoryItem[] = addressIntelligence.map((intel, index) => ({
    address: intel.address,
    dateRange: context?.timeframe || 'Unknown',
    confidence: intel.confidence,
    source: 'analysis',
    isCurrent: index === 0 // Assume first address is current
  }));
  
  // Determine movement pattern
  const movementPattern = determineMovementPattern(addressIntelligence);
  
  // Calculate search radius
  const searchRadius = calculateOptimalSearchRadius(addressIntelligence);
  
  // Identify regions
  const regions = extractRegions(addressIntelligence);
  
  // Calculate proximity score
  const proximityScore = calculateProximityScore(addressIntelligence);
  
  return {
    addressHistory,
    movementPattern,
    searchRadius,
    primaryRegion: regions.primary,
    secondaryRegions: regions.secondary,
    proximityScore
  };
}

function determineMovementPattern(addressIntelligence: LocationIntelligence[]): GeographicPattern['movementPattern'] {
  if (addressIntelligence.length <= 1) {
    return 'stable';
  }
  
  const statesCount = new Set(
    addressIntelligence
      .map(addr => parseAddress(addr.address).state)
      .filter(state => state)
  ).size;
  
  const citiesCount = new Set(
    addressIntelligence
      .map(addr => parseAddress(addr.address).city)
      .filter(city => city)
  ).size;
  
  if (statesCount > 2 || citiesCount > 3) {
    return 'frequent_mover';
  } else if (addressIntelligence.length > 1 && citiesCount > 1) {
    return 'recent_relocation';
  } else {
    return 'stable';
  }
}

function calculateOptimalSearchRadius(addressIntelligence: LocationIntelligence[]): number {
  // Base radius
  let radius = 15; // miles
  
  // Adjust based on movement pattern
  const statesCount = new Set(
    addressIntelligence
      .map(addr => parseAddress(addr.address).state)
      .filter(state => state)
  ).size;
  
  if (statesCount > 1) {
    radius = 50; // Multi-state pattern
  } else if (addressIntelligence.length > 2) {
    radius = 25; // Multiple addresses in same state
  }
  
  // Special handling for Oklahoma skip tracing
  const hasOklahoma = addressIntelligence.some(addr => 
    parseAddress(addr.address).state === 'OK'
  );
  
  if (hasOklahoma) {
    // Oklahoma-specific proximity patterns
    radius = Math.max(radius, 30); // Bryan County area coverage
  }
  
  return radius;
}

function extractRegions(addressIntelligence: LocationIntelligence[]) {
  const regionCounts: { [region: string]: number } = {};
  
  addressIntelligence.forEach(addr => {
    const parsed = parseAddress(addr.address);
    if (parsed.state && parsed.city) {
      const region = `${parsed.city}, ${parsed.state}`;
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    }
  });
  
  const sortedRegions = Object.entries(regionCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([region]) => region);
  
  return {
    primary: sortedRegions[0] || 'Unknown',
    secondary: sortedRegions.slice(1, 3)
  };
}

function calculateProximityScore(addressIntelligence: LocationIntelligence[]): number {
  if (addressIntelligence.length <= 1) {
    return 100;
  }
  
  let score = 100;
  const states = new Set();
  const cities = new Set();
  
  addressIntelligence.forEach(addr => {
    const parsed = parseAddress(addr.address);
    if (parsed.state) states.add(parsed.state);
    if (parsed.city) cities.add(parsed.city);
  });
  
  // Penalty for multiple states
  if (states.size > 1) {
    score -= (states.size - 1) * 20;
  }
  
  // Penalty for multiple cities
  if (cities.size > 1) {
    score -= (cities.size - 1) * 10;
  }
  
  return Math.max(score, 0);
}

/**
 * Generate skip tracing geographic recommendations
 */
export function generateGeographicRecommendations(
  pattern: GeographicPattern,
  currentSearch: { city?: string; state?: string }
): string[] {
  const recommendations: string[] = [];
  
  // Primary search area recommendations
  if (pattern.primaryRegion !== 'Unknown') {
    recommendations.push(`Focus search on ${pattern.primaryRegion} (primary region)`);
  }
  
  // Secondary search areas
  if (pattern.secondaryRegions.length > 0) {
    recommendations.push(`Expand search to: ${pattern.secondaryRegions.join(', ')}`);
  }
  
  // Movement pattern insights
  switch (pattern.movementPattern) {
    case 'frequent_mover':
      recommendations.push('Subject shows frequent relocation pattern - check recent utility connections and mail forwarding');
      break;
    case 'recent_relocation':
      recommendations.push('Recent relocation detected - verify current address through employment and school records');
      break;
    case 'stable':
      recommendations.push('Stable residence pattern - focus on local community connections and long-term records');
      break;
  }
  
  // Search radius recommendations
  recommendations.push(`Optimal search radius: ${pattern.searchRadius} miles from known addresses`);
  
  // Proximity score insights
  if (pattern.proximityScore < 50) {
    recommendations.push('Low proximity score indicates wide geographic spread - consider professional skip tracing services');
  } else if (pattern.proximityScore > 80) {
    recommendations.push('High proximity score - concentrate search in local area and neighboring communities');
  }
  
  // Oklahoma-specific recommendations
  const hasOklahoma = pattern.addressHistory.some(addr => 
    parseAddress(addr.address).state === 'OK'
  );
  
  if (hasOklahoma) {
    recommendations.push('Oklahoma addresses detected - check Bryan County courthouse records and neighboring counties (Atoka, Marshall)');
    recommendations.push('Search Durant, Calera, and Caddo area networks - common migration pattern within this region');
  }
  
  return recommendations;
}