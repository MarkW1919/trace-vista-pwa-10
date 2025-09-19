import { BaseEntity } from '@/types/entities';

/**
 * Advanced Entity Extraction for Professional Skip Tracing
 * Handles complex patterns and cross-referencing
 */

// Comprehensive regex patterns for advanced extraction
const ADVANCED_PATTERNS = {
  // Enhanced phone patterns with various formats
  phone: {
    standard: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    international: /\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    formatted: /\(\d{3}\)\s?\d{3}-\d{4}/g,
    dotted: /\d{3}\.\d{3}\.\d{4}/g,
    plain: /\d{10}/g
  },
  
  // Advanced address patterns
  address: {
    full: /\d{1,6}\s+[A-Za-z0-9\s\.\-'#]+\s+(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?|Court|Ct\.?|Circle|Cir\.?|Way|Place|Pl\.?|Parkway|Pkwy\.?|Highway|Hwy\.?)\b[\s,]*[A-Za-z\s]*,?\s*[A-Za-z]{2}\s*\d{5}(-\d{4})?/gi,
    street: /\d{1,6}\s+[A-Za-z0-9\s\.\-'#]+\s+(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?|Court|Ct\.?|Circle|Cir\.?|Way|Place|Pl\.?)/gi,
    poBox: /P\.?O\.?\s*Box\s+\d+/gi,
    apt: /(Apt\.?|Apartment|Unit|Ste\.?|Suite)\s*[A-Za-z0-9#\-]+/gi
  },
  
  // Social Security patterns (partial/masked only)
  ssn: {
    masked: /\*{3}-\*{2}-\d{4}|\d{3}-\*{2}-\*{4}|XXX-XX-\d{4}/g,
    lastFour: /(?:SSN|Social).*?(\d{4})/gi
  },
  
  // Date patterns for DOB, events
  dates: {
    mdySlash: /\b(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g,
    mdyDash: /\b(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])-(19|20)\d{2}\b/g,
    written: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(19|20)\d{2}\b/g,
    age: /\b(?:age|aged)\s+(\d{1,3})\b/gi,
    born: /\b(?:born|birth|DOB)[:\s]+(.{4,20})/gi
  },
  
  // Vehicle identification
  vehicle: {
    vin: /\b[A-HJ-NPR-Z0-9]{17}\b/g,
    license: /\b[A-Z0-9]{2,8}\b(?=.*(?:license|plate|tag))/gi
  },
  
  // Financial identifiers
  financial: {
    account: /\b\d{4,20}\b(?=.*(?:account|acct))/gi,
    routing: /\b[0-9]{9}\b(?=.*routing)/gi
  },
  
  // Employment and business
  employment: {
    company: /(?:works?\s+(?:at|for)|employed\s+(?:at|by)|company)[:\s]+([A-Za-z0-9\s&\.\-,]+)/gi,
    title: /(?:title|position|job)[:\s]+([A-Za-z0-9\s&\.\-,]+)/gi,
    salary: /\$[\d,]+(?:\.\d{2})?(?:\s*(?:per|\/)\s*(?:year|yr|hour|hr|month|mo))?/g
  },
  
  // Education
  education: {
    school: /(?:graduated|attended|alumni|degree)[:\s]+([A-Za-z0-9\s&\.\-,]+(?:University|College|School|Institute))/gi,
    degree: /(?:degree|diploma|certification)[:\s]+([A-Za-z0-9\s&\.\-,]+)/gi
  },
  
  // Family and relationships
  relationships: {
    relatives: /(?:wife|husband|spouse|son|daughter|mother|father|brother|sister|parent|child|relative)[:\s]+([A-Za-z\s]+)/gi,
    associates: /(?:associate|friend|partner|colleague)[:\s]+([A-Za-z\s]+)/gi,
    emergency: /(?:emergency\s+contact|next\s+of\s+kin)[:\s]+([A-Za-z\s]+)/gi
  },
  
  // Legal and court
  legal: {
    case: /(?:case\s+(?:number|no\.?|#))[:\s]+([A-Za-z0-9\-]+)/gi,
    court: /([A-Za-z\s]+(?:Court|Courthouse))/gi,
    attorney: /(?:attorney|lawyer)[:\s]+([A-Za-z\s\.,]+)/gi
  }
};

// Geographic data for enhanced location intelligence
const GEOGRAPHIC_DATA = {
  areaCodeRegions: {
    '201': { state: 'NJ', region: 'Northern New Jersey', cities: ['Jersey City', 'Hackensack'] },
    '202': { state: 'DC', region: 'Washington DC', cities: ['Washington'] },
    '203': { state: 'CT', region: 'Southwest Connecticut', cities: ['Bridgeport', 'New Haven'] },
    '205': { state: 'AL', region: 'Central Alabama', cities: ['Birmingham', 'Tuscaloosa'] },
    '206': { state: 'WA', region: 'Seattle', cities: ['Seattle'] },
    '207': { state: 'ME', region: 'Maine', cities: ['Portland', 'Bangor'] },
    '208': { state: 'ID', region: 'Idaho', cities: ['Boise', 'Idaho Falls'] },
    '212': { state: 'NY', region: 'Manhattan', cities: ['New York'] },
    '213': { state: 'CA', region: 'Los Angeles', cities: ['Los Angeles'] },
    '214': { state: 'TX', region: 'Dallas', cities: ['Dallas'] },
    '215': { state: 'PA', region: 'Philadelphia', cities: ['Philadelphia'] },
    '301': { state: 'MD', region: 'Western Maryland', cities: ['Frederick', 'Hagerstown'] },
    '302': { state: 'DE', region: 'Delaware', cities: ['Wilmington', 'Dover'] },
    '303': { state: 'CO', region: 'Denver Metro', cities: ['Denver', 'Boulder'] },
    '304': { state: 'WV', region: 'West Virginia', cities: ['Charleston', 'Morgantown'] },
    '305': { state: 'FL', region: 'South Florida', cities: ['Miami', 'Key West'] },
    '312': { state: 'IL', region: 'Chicago', cities: ['Chicago'] },
    '313': { state: 'MI', region: 'Detroit', cities: ['Detroit'] },
    '314': { state: 'MO', region: 'St. Louis', cities: ['St. Louis'] },
    '315': { state: 'NY', region: 'Central New York', cities: ['Syracuse', 'Utica'] },
    '316': { state: 'KS', region: 'South Central Kansas', cities: ['Wichita'] },
    '317': { state: 'IN', region: 'Central Indiana', cities: ['Indianapolis'] },
    '318': { state: 'LA', region: 'Northern Louisiana', cities: ['Shreveport', 'Monroe'] },
    '319': { state: 'IA', region: 'Eastern Iowa', cities: ['Cedar Rapids', 'Dubuque'] },
    '320': { state: 'MN', region: 'Central Minnesota', cities: ['St. Cloud'] },
    '321': { state: 'FL', region: 'East Central Florida', cities: ['Orlando', 'Cocoa'] },
    '330': { state: 'OH', region: 'Northeast Ohio', cities: ['Akron', 'Youngstown'] },
    '331': { state: 'IL', region: 'Chicago Suburbs', cities: ['Aurora', 'Elgin'] },
    '334': { state: 'AL', region: 'Southeast Alabama', cities: ['Montgomery', 'Auburn'] },
    '336': { state: 'NC', region: 'North Central NC', cities: ['Greensboro', 'Winston-Salem'] },
    '337': { state: 'LA', region: 'Southwest Louisiana', cities: ['Lafayette', 'Lake Charles'] },
    '339': { state: 'MA', region: 'Eastern Massachusetts', cities: ['Boston', 'Cambridge'] },
    '401': { state: 'RI', region: 'Rhode Island', cities: ['Providence', 'Newport'] },
    '402': { state: 'NE', region: 'Eastern Nebraska', cities: ['Omaha', 'Lincoln'] },
    '404': { state: 'GA', region: 'Atlanta', cities: ['Atlanta'] },
    '405': { state: 'OK', region: 'Central Oklahoma', cities: ['Oklahoma City', 'Norman'] },
    '406': { state: 'MT', region: 'Montana', cities: ['Billings', 'Missoula'] },
    '407': { state: 'FL', region: 'Central Florida', cities: ['Orlando'] },
    '408': { state: 'CA', region: 'South Bay', cities: ['San Jose'] },
    '409': { state: 'TX', region: 'Southeast Texas', cities: ['Beaumont', 'Galveston'] },
    '410': { state: 'MD', region: 'Eastern Maryland', cities: ['Baltimore', 'Annapolis'] },
    '412': { state: 'PA', region: 'Pittsburgh', cities: ['Pittsburgh'] },
    '413': { state: 'MA', region: 'Western Massachusetts', cities: ['Springfield', 'Pittsfield'] },
    '414': { state: 'WI', region: 'Southeast Wisconsin', cities: ['Milwaukee'] },
    '415': { state: 'CA', region: 'San Francisco', cities: ['San Francisco'] },
    '417': { state: 'MO', region: 'Southwest Missouri', cities: ['Springfield', 'Joplin'] },
    '419': { state: 'OH', region: 'Northwest Ohio', cities: ['Toledo', 'Lima'] },
    '423': { state: 'TN', region: 'East Tennessee', cities: ['Chattanooga', 'Johnson City'] },
    '424': { state: 'CA', region: 'West Los Angeles', cities: ['Beverly Hills', 'Santa Monica'] },
    '425': { state: 'WA', region: 'Seattle Suburbs', cities: ['Bellevue', 'Redmond'] },
    '430': { state: 'TX', region: 'Northeast Texas', cities: ['Tyler', 'Longview'] },
    '432': { state: 'TX', region: 'West Texas', cities: ['Midland', 'Odessa'] },
    '434': { state: 'VA', region: 'South Central Virginia', cities: ['Lynchburg', 'Charlottesville'] },
    '435': { state: 'UT', region: 'Southern Utah', cities: ['St. George', 'Cedar City'] },
    '440': { state: 'OH', region: 'Cleveland Suburbs', cities: ['Lorain', 'Elyria'] },
    '443': { state: 'MD', region: 'Eastern Maryland', cities: ['Baltimore'] },
    '469': { state: 'TX', region: 'Dallas Metro', cities: ['Plano', 'McKinney'] },
    '470': { state: 'GA', region: 'Atlanta Metro', cities: ['Marietta', 'Roswell'] },
    '478': { state: 'GA', region: 'Central Georgia', cities: ['Macon', 'Warner Robins'] },
    '479': { state: 'AR', region: 'Northwest Arkansas', cities: ['Fort Smith', 'Fayetteville'] },
    '480': { state: 'AZ', region: 'East Phoenix', cities: ['Scottsdale', 'Tempe'] },
    '484': { state: 'PA', region: 'Southeast Pennsylvania', cities: ['Allentown', 'Reading'] },
    '501': { state: 'AR', region: 'Central Arkansas', cities: ['Little Rock', 'Conway'] },
    '502': { state: 'KY', region: 'North Central Kentucky', cities: ['Louisville'] },
    '503': { state: 'OR', region: 'Northwest Oregon', cities: ['Portland', 'Salem'] },
    '504': { state: 'LA', region: 'New Orleans', cities: ['New Orleans'] },
    '505': { state: 'NM', region: 'New Mexico', cities: ['Albuquerque', 'Santa Fe'] },
    '507': { state: 'MN', region: 'Southern Minnesota', cities: ['Rochester', 'Mankato'] },
    '508': { state: 'MA', region: 'Central Massachusetts', cities: ['Worcester', 'Framingham'] },
    '509': { state: 'WA', region: 'Eastern Washington', cities: ['Spokane', 'Yakima'] },
    '510': { state: 'CA', region: 'East Bay', cities: ['Oakland', 'Fremont'] },
    '512': { state: 'TX', region: 'Central Texas', cities: ['Austin'] },
    '513': { state: 'OH', region: 'Southwest Ohio', cities: ['Cincinnati', 'Dayton'] },
    '515': { state: 'IA', region: 'Central Iowa', cities: ['Des Moines', 'Ames'] },
    '516': { state: 'NY', region: 'Nassau County', cities: ['Hempstead', 'Levittown'] },
    '517': { state: 'MI', region: 'South Central Michigan', cities: ['Lansing', 'Jackson'] },
    '518': { state: 'NY', region: 'Northeast New York', cities: ['Albany', 'Schenectady'] },
    '540': { state: 'VA', region: 'Northwest Virginia', cities: ['Roanoke', 'Harrisonburg'] },
    '541': { state: 'OR', region: 'Central Oregon', cities: ['Eugene', 'Bend'] },
    '559': { state: 'CA', region: 'Central Valley', cities: ['Fresno', 'Visalia'] },
    '561': { state: 'FL', region: 'Palm Beach', cities: ['West Palm Beach', 'Boca Raton'] },
    '562': { state: 'CA', region: 'Southeast LA', cities: ['Long Beach', 'Whittier'] },
    '563': { state: 'IA', region: 'Eastern Iowa', cities: ['Davenport', 'Dubuque'] },
    '564': { state: 'WA', region: 'Western Washington', cities: ['Olympia', 'Centralia'] },
    '567': { state: 'OH', region: 'Northwest Ohio', cities: ['Toledo'] },
    '570': { state: 'PA', region: 'Northeast Pennsylvania', cities: ['Scranton', 'Wilkes-Barre'] },
    '571': { state: 'VA', region: 'Northern Virginia', cities: ['Arlington', 'Alexandria'] },
    '573': { state: 'MO', region: 'Southeast Missouri', cities: ['Columbia', 'Cape Girardeau'] },
    '574': { state: 'IN', region: 'North Central Indiana', cities: ['South Bend', 'Elkhart'] },
    '575': { state: 'NM', region: 'Southern New Mexico', cities: ['Las Cruces', 'Roswell'] },
    '580': { state: 'OK', region: 'Southern Oklahoma', cities: ['Lawton', 'Durant', 'Calera', 'Caddo'] },
    '585': { state: 'NY', region: 'Western New York', cities: ['Rochester'] },
    '586': { state: 'MI', region: 'East Detroit', cities: ['Warren', 'Sterling Heights'] },
    '601': { state: 'MS', region: 'Central Mississippi', cities: ['Jackson', 'Hattiesburg'] },
    '602': { state: 'AZ', region: 'Central Phoenix', cities: ['Phoenix'] },
    '603': { state: 'NH', region: 'New Hampshire', cities: ['Manchester', 'Nashua'] },
    '605': { state: 'SD', region: 'South Dakota', cities: ['Sioux Falls', 'Rapid City'] },
    '606': { state: 'KY', region: 'Southeast Kentucky', cities: ['Ashland', 'Middlesboro'] },
    '607': { state: 'NY', region: 'South Central New York', cities: ['Binghamton', 'Ithaca'] },
    '608': { state: 'WI', region: 'Southwest Wisconsin', cities: ['Madison', 'La Crosse'] },
    '609': { state: 'NJ', region: 'Central New Jersey', cities: ['Trenton', 'Atlantic City'] },
    '610': { state: 'PA', region: 'Southeast Pennsylvania', cities: ['Allentown', 'Reading'] },
    '612': { state: 'MN', region: 'Minneapolis', cities: ['Minneapolis'] },
    '614': { state: 'OH', region: 'Central Ohio', cities: ['Columbus'] },
    '615': { state: 'TN', region: 'Nashville', cities: ['Nashville'] },
    '616': { state: 'MI', region: 'West Michigan', cities: ['Grand Rapids', 'Kalamazoo'] },
    '617': { state: 'MA', region: 'Boston', cities: ['Boston'] },
    '618': { state: 'IL', region: 'Southern Illinois', cities: ['East St. Louis', 'Carbondale'] },
    '619': { state: 'CA', region: 'San Diego', cities: ['San Diego'] },
    '620': { state: 'KS', region: 'Southeast Kansas', cities: ['Dodge City', 'Garden City'] },
    '623': { state: 'AZ', region: 'West Phoenix', cities: ['Glendale', 'Peoria'] },
    '626': { state: 'CA', region: 'San Gabriel Valley', cities: ['Pasadena', 'Pomona'] },
    '630': { state: 'IL', region: 'West Chicago', cities: ['Aurora', 'Naperville'] },
    '631': { state: 'NY', region: 'Suffolk County', cities: ['Huntington', 'Brookhaven'] },
    '636': { state: 'MO', region: 'East Missouri', cities: ['O\'Fallon', 'St. Charles'] },
    '641': { state: 'IA', region: 'Central Iowa', cities: ['Mason City', 'Ottumwa'] },
    '646': { state: 'NY', region: 'Manhattan', cities: ['New York'] },
    '650': { state: 'CA', region: 'Peninsula', cities: ['San Mateo', 'Palo Alto'] },
    '651': { state: 'MN', region: 'St. Paul', cities: ['St. Paul'] },
    '660': { state: 'MO', region: 'North Central Missouri', cities: ['Sedalia', 'Kirksville'] },
    '661': { state: 'CA', region: 'North LA County', cities: ['Palmdale', 'Lancaster'] },
    '662': { state: 'MS', region: 'North Mississippi', cities: ['Tupelo', 'Columbus'] },
    '678': { state: 'GA', region: 'North Atlanta', cities: ['Marietta', 'Alpharetta'] },
    '682': { state: 'TX', region: 'Fort Worth', cities: ['Fort Worth', 'Arlington'] },
    '701': { state: 'ND', region: 'North Dakota', cities: ['Fargo', 'Bismarck'] },
    '702': { state: 'NV', region: 'Las Vegas', cities: ['Las Vegas', 'Henderson'] },
    '703': { state: 'VA', region: 'Northern Virginia', cities: ['Arlington', 'Alexandria'] },
    '704': { state: 'NC', region: 'South Central NC', cities: ['Charlotte', 'Gastonia'] },
    '706': { state: 'GA', region: 'North Georgia', cities: ['Augusta', 'Columbus'] },
    '707': { state: 'CA', region: 'North Bay', cities: ['Santa Rosa', 'Napa'] },
    '708': { state: 'IL', region: 'South Chicago', cities: ['Oak Lawn', 'Cicero'] },
    '712': { state: 'IA', region: 'Western Iowa', cities: ['Sioux City', 'Council Bluffs'] },
    '713': { state: 'TX', region: 'Houston', cities: ['Houston'] },
    '714': { state: 'CA', region: 'North Orange County', cities: ['Anaheim', 'Huntington Beach'] },
    '715': { state: 'WI', region: 'North Central Wisconsin', cities: ['Eau Claire', 'Wausau'] },
    '716': { state: 'NY', region: 'Western New York', cities: ['Buffalo', 'Niagara Falls'] },
    '717': { state: 'PA', region: 'South Central Pennsylvania', cities: ['Harrisburg', 'Lancaster'] },
    '718': { state: 'NY', region: 'NYC Boroughs', cities: ['Brooklyn', 'Queens', 'Bronx'] },
    '719': { state: 'CO', region: 'South Central Colorado', cities: ['Colorado Springs', 'Pueblo'] },
    '720': { state: 'CO', region: 'Denver Metro', cities: ['Denver', 'Thornton'] },
    '724': { state: 'PA', region: 'Southwest Pennsylvania', cities: ['Washington', 'Uniontown'] },
    '727': { state: 'FL', region: 'Pinellas County', cities: ['St. Petersburg', 'Clearwater'] },
    '731': { state: 'TN', region: 'West Tennessee', cities: ['Jackson', 'Martin'] },
    '732': { state: 'NJ', region: 'Central New Jersey', cities: ['New Brunswick', 'Toms River'] },
    '734': { state: 'MI', region: 'Southeast Michigan', cities: ['Ann Arbor', 'Livonia'] },
    '737': { state: 'TX', region: 'Central Texas', cities: ['Austin', 'Round Rock'] },
    '740': { state: 'OH', region: 'Southeast Ohio', cities: ['Zanesville', 'Athens'] },
    '747': { state: 'CA', region: 'San Fernando Valley', cities: ['Burbank', 'Glendale'] },
    '754': { state: 'FL', region: 'Broward County', cities: ['Fort Lauderdale', 'Hollywood'] },
    '757': { state: 'VA', region: 'Hampton Roads', cities: ['Virginia Beach', 'Norfolk'] },
    '760': { state: 'CA', region: 'North San Diego', cities: ['Oceanside', 'Palm Springs'] },
    '762': { state: 'GA', region: 'North Georgia', cities: ['Augusta', 'Rome'] },
    '763': { state: 'MN', region: 'Minneapolis Suburbs', cities: ['Brooklyn Park', 'Plymouth'] },
    '765': { state: 'IN', region: 'East Central Indiana', cities: ['Muncie', 'Anderson'] },
    '770': { state: 'GA', region: 'Atlanta Suburbs', cities: ['Marietta', 'Roswell'] },
    '772': { state: 'FL', region: 'Treasure Coast', cities: ['Port St. Lucie', 'Vero Beach'] },
    '773': { state: 'IL', region: 'Chicago', cities: ['Chicago'] },
    '774': { state: 'MA', region: 'Central Massachusetts', cities: ['Worcester', 'Marlborough'] },
    '775': { state: 'NV', region: 'Northern Nevada', cities: ['Reno', 'Carson City'] },
    '779': { state: 'IL', region: 'North Illinois', cities: ['Rockford', 'Elgin'] },
    '781': { state: 'MA', region: 'Boston Suburbs', cities: ['Waltham', 'Lexington'] },
    '785': { state: 'KS', region: 'North Central Kansas', cities: ['Topeka', 'Lawrence'] },
    '786': { state: 'FL', region: 'Miami-Dade', cities: ['Miami', 'Hialeah'] },
    '787': { state: 'PR', region: 'Puerto Rico', cities: ['San Juan', 'Bayamón'] },
    '801': { state: 'UT', region: 'Northern Utah', cities: ['Salt Lake City', 'West Valley City'] },
    '802': { state: 'VT', region: 'Vermont', cities: ['Burlington', 'Rutland'] },
    '803': { state: 'SC', region: 'Central South Carolina', cities: ['Columbia', 'Rock Hill'] },
    '804': { state: 'VA', region: 'East Central Virginia', cities: ['Richmond', 'Petersburg'] },
    '805': { state: 'CA', region: 'Central Coast', cities: ['Oxnard', 'Santa Barbara'] },
    '806': { state: 'TX', region: 'Panhandle', cities: ['Lubbock', 'Amarillo'] },
    '808': { state: 'HI', region: 'Hawaii', cities: ['Honolulu', 'Hilo'] },
    '810': { state: 'MI', region: 'East Central Michigan', cities: ['Flint', 'Port Huron'] },
    '812': { state: 'IN', region: 'South Central Indiana', cities: ['Evansville', 'Bloomington'] },
    '813': { state: 'FL', region: 'Tampa', cities: ['Tampa'] },
    '814': { state: 'PA', region: 'Central Pennsylvania', cities: ['Erie', 'Altoona'] },
    '815': { state: 'IL', region: 'North Central Illinois', cities: ['Rockford', 'Joliet'] },
    '816': { state: 'MO', region: 'Northwest Missouri', cities: ['Kansas City', 'Independence'] },
    '817': { state: 'TX', region: 'North Central Texas', cities: ['Fort Worth', 'Arlington'] },
    '818': { state: 'CA', region: 'San Fernando Valley', cities: ['Glendale', 'Burbank'] },
    '828': { state: 'NC', region: 'Western North Carolina', cities: ['Asheville', 'Hickory'] },
    '830': { state: 'TX', region: 'South Central Texas', cities: ['New Braunfels', 'Fredericksburg'] },
    '831': { state: 'CA', region: 'Central Coast', cities: ['Salinas', 'Santa Cruz'] },
    '832': { state: 'TX', region: 'Houston Metro', cities: ['Houston', 'The Woodlands'] },
    '843': { state: 'SC', region: 'Coastal South Carolina', cities: ['Charleston', 'Myrtle Beach'] },
    '845': { state: 'NY', region: 'Hudson Valley', cities: ['Poughkeepsie', 'Newburgh'] },
    '847': { state: 'IL', region: 'North Chicago', cities: ['Schaumburg', 'Evanston'] },
    '848': { state: 'NJ', region: 'Central New Jersey', cities: ['New Brunswick', 'Edison'] },
    '850': { state: 'FL', region: 'Northwest Florida', cities: ['Tallahassee', 'Pensacola'] },
    '856': { state: 'NJ', region: 'South Jersey', cities: ['Camden', 'Cherry Hill'] },
    '857': { state: 'MA', region: 'Boston Metro', cities: ['Boston', 'Cambridge'] },
    '858': { state: 'CA', region: 'North San Diego', cities: ['San Diego'] },
    '859': { state: 'KY', region: 'North Central Kentucky', cities: ['Lexington', 'Covington'] },
    '860': { state: 'CT', region: 'Connecticut', cities: ['Hartford', 'New Britain'] },
    '862': { state: 'NJ', region: 'Northern New Jersey', cities: ['Newark', 'Paterson'] },
    '863': { state: 'FL', region: 'Central Florida', cities: ['Lakeland', 'Sebring'] },
    '864': { state: 'SC', region: 'Upstate South Carolina', cities: ['Greenville', 'Spartanburg'] },
    '865': { state: 'TN', region: 'East Tennessee', cities: ['Knoxville', 'Oak Ridge'] },
    '870': { state: 'AR', region: 'Northeast Arkansas', cities: ['Jonesboro', 'Pine Bluff'] },
    '872': { state: 'IL', region: 'Chicago', cities: ['Chicago'] },
    '878': { state: 'PA', region: 'Pittsburgh Metro', cities: ['Pittsburgh'] },
    '901': { state: 'TN', region: 'Southwest Tennessee', cities: ['Memphis'] },
    '903': { state: 'TX', region: 'Northeast Texas', cities: ['Tyler', 'Marshall'] },
    '904': { state: 'FL', region: 'Northeast Florida', cities: ['Jacksonville'] },
    '906': { state: 'MI', region: 'Upper Peninsula', cities: ['Marquette', 'Sault Ste. Marie'] },
    '907': { state: 'AK', region: 'Alaska', cities: ['Anchorage', 'Fairbanks'] },
    '908': { state: 'NJ', region: 'Central New Jersey', cities: ['Elizabeth', 'Plainfield'] },
    '909': { state: 'CA', region: 'Inland Empire', cities: ['San Bernardino', 'Riverside'] },
    '910': { state: 'NC', region: 'Southeast North Carolina', cities: ['Fayetteville', 'Wilmington'] },
    '912': { state: 'GA', region: 'Southeast Georgia', cities: ['Savannah', 'Brunswick'] },
    '913': { state: 'KS', region: 'Northeast Kansas', cities: ['Overland Park', 'Kansas City'] },
    '914': { state: 'NY', region: 'Westchester County', cities: ['Yonkers', 'New Rochelle'] },
    '915': { state: 'TX', region: 'West Texas', cities: ['El Paso'] },
    '916': { state: 'CA', region: 'Sacramento', cities: ['Sacramento'] },
    '917': { state: 'NY', region: 'New York City', cities: ['New York'] },
    '918': { state: 'OK', region: 'Eastern Oklahoma', cities: ['Tulsa', 'Muskogee'] },
    '919': { state: 'NC', region: 'East Central NC', cities: ['Raleigh', 'Durham'] },
    '920': { state: 'WI', region: 'Northeast Wisconsin', cities: ['Green Bay', 'Appleton'] },
    '925': { state: 'CA', region: 'East Bay', cities: ['Concord', 'Antioch'] },
    '928': { state: 'AZ', region: 'Northern Arizona', cities: ['Flagstaff', 'Yuma'] },
    '929': { state: 'NY', region: 'New York City', cities: ['Queens', 'Brooklyn'] },
    '931': { state: 'TN', region: 'South Central Tennessee', cities: ['Clarksville', 'Cookeville'] },
    '936': { state: 'TX', region: 'East Texas', cities: ['Huntsville', 'Conroe'] },
    '937': { state: 'OH', region: 'Southwest Ohio', cities: ['Dayton', 'Springfield'] },
    '940': { state: 'TX', region: 'North Central Texas', cities: ['Wichita Falls', 'Denton'] },
    '941': { state: 'FL', region: 'Southwest Florida', cities: ['Sarasota', 'Bradenton'] },
    '947': { state: 'MI', region: 'Oakland County', cities: ['Troy', 'Pontiac'] },
    '949': { state: 'CA', region: 'South Orange County', cities: ['Irvine', 'Mission Viejo'] },
    '951': { state: 'CA', region: 'Riverside County', cities: ['Riverside', 'Corona'] },
    '952': { state: 'MN', region: 'Minneapolis Suburbs', cities: ['Bloomington', 'Eden Prairie'] },
    '954': { state: 'FL', region: 'Broward County', cities: ['Fort Lauderdale', 'Hollywood'] },
    '956': { state: 'TX', region: 'South Texas', cities: ['Laredo', 'McAllen'] },
    '959': { state: 'CT', region: 'Connecticut', cities: ['Hartford', 'Waterbury'] },
    '970': { state: 'CO', region: 'Northern Colorado', cities: ['Fort Collins', 'Grand Junction'] },
    '971': { state: 'OR', region: 'Portland Metro', cities: ['Portland', 'Beaverton'] },
    '972': { state: 'TX', region: 'Dallas Suburbs', cities: ['Plano', 'Irving'] },
    '973': { state: 'NJ', region: 'North Central New Jersey', cities: ['Newark', 'Paterson'] },
    '978': { state: 'MA', region: 'North Central Massachusetts', cities: ['Lowell', 'Lawrence'] },
    '979': { state: 'TX', region: 'East Central Texas', cities: ['College Station', 'Bay City'] },
    '980': { state: 'NC', region: 'South Central NC', cities: ['Charlotte'] },
    '984': { state: 'NC', region: 'East Central NC', cities: ['Raleigh', 'Cary'] },
    '985': { state: 'LA', region: 'Southeast Louisiana', cities: ['Houma', 'Hammond'] },
    '989': { state: 'MI', region: 'Central Michigan', cities: ['Saginaw', 'Bay City'] }
  },
  
  stateAbbreviations: {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
  }
};

/**
 * Extract entities with advanced patterns and confidence scoring
 */
export function extractAdvancedEntities(
  text: string,
  context: {
    searchName?: string;
    searchLocation?: string;
    searchPhone?: string;
    searchEmail?: string;
  } = {}
): BaseEntity[] {
  const entities: BaseEntity[] = [];
  const timestamp = new Date();
  const lowerText = text.toLowerCase();
  
  // Extract phone numbers with enhanced patterns
  extractPhoneEntities(text, entities, timestamp, context);
  
  // Extract addresses with full parsing
  extractAddressEntities(text, entities, timestamp, context);
  
  // Extract dates and ages
  extractDateEntities(text, entities, timestamp);
  
  // Extract employment information
  extractEmploymentEntities(text, entities, timestamp);
  
  // Extract education information
  extractEducationEntities(text, entities, timestamp);
  
  // Extract relationships
  extractRelationshipEntities(text, entities, timestamp);
  
  // Extract legal information
  extractLegalEntities(text, entities, timestamp);
  
  // Extract vehicle information
  extractVehicleEntities(text, entities, timestamp);
  
  // Extract financial information (limited)
  extractFinancialEntities(text, entities, timestamp);
  
  return entities.sort((a, b) => b.confidence - a.confidence);
}

function extractPhoneEntities(text: string, entities: BaseEntity[], timestamp: Date, context: any) {
  // Try all phone patterns
  Object.entries(ADVANCED_PATTERNS.phone).forEach(([patternName, pattern]) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      let phone = match[0];
      let areaCode = '';
      
      // Normalize phone format
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 10) {
        areaCode = digits.substring(0, 3);
        phone = `(${areaCode}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
      } else if (digits.length === 11 && digits.startsWith('1')) {
        areaCode = digits.substring(1, 4);
        phone = `(${areaCode}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
      }
      
      if (areaCode && GEOGRAPHIC_DATA.areaCodeRegions[areaCode]) {
        const geoData = GEOGRAPHIC_DATA.areaCodeRegions[areaCode];
        const confidence = calculateAdvancedPhoneConfidence(phone, areaCode, context, geoData);
        
        entities.push({
          id: `phone-${entities.length}`,
          type: 'phone',
          value: phone,
          confidence,
          source: 'advanced_extraction',
          timestamp,
          verified: confidence >= 75,
          metadata: {
            areaCode,
            region: geoData.region,
            state: geoData.state,
            patternType: patternName
          }
        });
      }
    }
  });
}

function extractAddressEntities(text: string, entities: BaseEntity[], timestamp: Date, context: any) {
  Object.entries(ADVANCED_PATTERNS.address).forEach(([patternName, pattern]) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const address = match[0];
      const confidence = calculateAdvancedAddressConfidence(address, context);
      
      entities.push({
        id: `address-${entities.length}`,
        type: 'address',
        value: address,
        confidence,
        source: 'advanced_extraction',
        timestamp,
        verified: confidence >= 70,
        metadata: {
          patternType: patternName,
          hasZip: /\d{5}(-\d{4})?/.test(address),
          hasState: /\b[A-Z]{2}\b/.test(address)
        }
      });
    }
  });
}

function extractDateEntities(text: string, entities: BaseEntity[], timestamp: Date) {
  // Age extraction
  const ageMatches = text.matchAll(ADVANCED_PATTERNS.dates.age);
  for (const match of ageMatches) {
    const age = parseInt(match[1]);
    if (age >= 1 && age <= 120) {
      entities.push({
        id: `age-${entities.length}`,
        type: 'age',
        value: age.toString(),
        confidence: 85,
        source: 'advanced_extraction',
        timestamp,
        verified: true,
        metadata: {
          estimatedBirthYear: new Date().getFullYear() - age,
          ageRange: getAgeRange(age)
        }
      });
    }
  }
  
  // Date of birth patterns
  Object.entries(ADVANCED_PATTERNS.dates).forEach(([patternName, pattern]) => {
    if (patternName === 'age') return; // Already handled
    
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const dateStr = match[0];
      const confidence = 70;
      
      entities.push({
        id: `date-${entities.length}`,
        type: 'date',
        value: dateStr,
        confidence,
        source: 'advanced_extraction',
        timestamp,
        verified: confidence >= 70,
        metadata: {
          patternType: patternName,
          parsedDate: parseDate(dateStr)
        }
      });
    }
  });
}

function extractEmploymentEntities(text: string, entities: BaseEntity[], timestamp: Date) {
  Object.entries(ADVANCED_PATTERNS.employment).forEach(([type, pattern]) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = match[1].trim();
      if (value.length > 2 && value.length < 100) {
        entities.push({
          id: `employment-${entities.length}`,
          type: type as any,
          value,
          confidence: 65,
          source: 'advanced_extraction',
          timestamp,
          verified: false,
          metadata: {
            category: 'employment'
          }
        });
      }
    }
  });
}

function extractEducationEntities(text: string, entities: BaseEntity[], timestamp: Date) {
  Object.entries(ADVANCED_PATTERNS.education).forEach(([type, pattern]) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = match[1].trim();
      if (value.length > 2 && value.length < 100) {
        entities.push({
          id: `education-${entities.length}`,
          type: type as any,
          value,
          confidence: 60,
          source: 'advanced_extraction',
          timestamp,
          verified: false,
          metadata: {
            category: 'education'
          }
        });
      }
    }
  });
}

function extractRelationshipEntities(text: string, entities: BaseEntity[], timestamp: Date) {
  Object.entries(ADVANCED_PATTERNS.relationships).forEach(([type, pattern]) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = match[1].trim();
      if (value.length > 2 && value.length < 50) {
        entities.push({
          id: `relationship-${entities.length}`,
          type: 'name',
          value,
          confidence: 55,
          source: 'advanced_extraction',
          timestamp,
          verified: false,
          metadata: {
            category: 'relationship',
            relationshipType: type
          }
        });
      }
    }
  });
}

function extractLegalEntities(text: string, entities: BaseEntity[], timestamp: Date) {
  Object.entries(ADVANCED_PATTERNS.legal).forEach(([type, pattern]) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = match[1].trim();
      if (value.length > 2 && value.length < 100) {
        entities.push({
          id: `legal-${entities.length}`,
          type: type as any,
          value,
          confidence: 75,
          source: 'advanced_extraction',
          timestamp,
          verified: false,
          metadata: {
            category: 'legal'
          }
        });
      }
    }
  });
}

function extractVehicleEntities(text: string, entities: BaseEntity[], timestamp: Date) {
  Object.entries(ADVANCED_PATTERNS.vehicle).forEach(([type, pattern]) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = match[0];
      const confidence = type === 'vin' ? 95 : 70;
      
      entities.push({
        id: `vehicle-${entities.length}`,
        type: type as any,
        value,
        confidence,
        source: 'advanced_extraction',
        timestamp,
        verified: confidence >= 80,
        metadata: {
          category: 'vehicle'
        }
      });
    }
  });
}

function extractFinancialEntities(text: string, entities: BaseEntity[], timestamp: Date) {
  // Only extract non-sensitive financial patterns
  Object.entries(ADVANCED_PATTERNS.employment).forEach(([type, pattern]) => {
    if (type === 'salary') {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const value = match[0];
        entities.push({
          id: `financial-${entities.length}`,
          type: 'salary',
          value,
          confidence: 70,
          source: 'advanced_extraction',
          timestamp,
          verified: false,
          metadata: {
            category: 'financial'
          }
        });
      }
    }
  });
}

function calculateAdvancedPhoneConfidence(phone: string, areaCode: string, context: any, geoData: any): number {
  let confidence = 50;
  
  // Format validation
  if (/^\(\d{3}\)\s\d{3}-\d{4}$/.test(phone)) confidence += 15;
  
  // Area code validation
  if (GEOGRAPHIC_DATA.areaCodeRegions[areaCode]) confidence += 15;
  
  // Context matching
  if (context.searchPhone) {
    const searchDigits = context.searchPhone.replace(/\D/g, '');
    const phoneDigits = phone.replace(/\D/g, '');
    if (searchDigits === phoneDigits) {
      confidence += 30; // Exact match
    } else if (searchDigits.substring(0, 3) === phoneDigits.substring(0, 3)) {
      confidence += 15; // Same area code
    }
  }
  
  // Geographic correlation
  if (context.searchLocation && geoData) {
    const searchLower = context.searchLocation.toLowerCase();
    if (geoData.cities.some((city: string) => searchLower.includes(city.toLowerCase()))) {
      confidence += 20;
    }
    if (geoData.state && searchLower.includes(geoData.state.toLowerCase())) {
      confidence += 10;
    }
  }
  
  // Not toll-free or special
  if (!['800', '888', '877', '866', '855', '844', '833'].includes(areaCode)) {
    confidence += 5;
  }
  
  return Math.min(confidence, 100);
}

function calculateAdvancedAddressConfidence(address: string, context: any): number {
  let confidence = 40;
  
  // Has street number
  if (/^\d+/.test(address)) confidence += 20;
  
  // Has common street suffixes
  if (/\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|ct|court|way|pl|place)\b/i.test(address)) {
    confidence += 20;
  }
  
  // Has state abbreviation
  if (/\b[A-Z]{2}\b/.test(address)) confidence += 15;
  
  // Has ZIP code
  if (/\b\d{5}(-\d{4})?\b/.test(address)) confidence += 15;
  
  // Context matching
  if (context.searchLocation) {
    const searchLower = context.searchLocation.toLowerCase();
    const addressLower = address.toLowerCase();
    if (addressLower.includes(searchLower)) {
      confidence += 20;
    }
  }
  
  return Math.min(confidence, 100);
}

function getAgeRange(age: number): string {
  if (age < 18) return 'Minor';
  if (age < 25) return 'Young Adult';
  if (age < 35) return 'Adult';
  if (age < 50) return 'Middle Age';
  if (age < 65) return 'Mature Adult';
  return 'Senior';
}

function parseDate(dateStr: string): string | null {
  try {
    // Simple date parsing - could be enhanced
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Cross-reference entities against known databases/patterns
 */
export function crossReferenceEntities(entities: BaseEntity[]): BaseEntity[] {
  return entities.map(entity => {
    let enhancedConfidence = entity.confidence;
    const metadata = { ...(entity.metadata || {}) };
    
    // Phone number cross-referencing
    if (entity.type === 'phone' && metadata?.areaCode) {
      const areaCode = metadata.areaCode;
      const geoData = GEOGRAPHIC_DATA.areaCodeRegions[areaCode];
      if (geoData) {
        metadata.geographicRegion = geoData.region;
        metadata.stateCode = geoData.state;
        metadata.majorCities = geoData.cities;
        enhancedConfidence = Math.min(100, enhancedConfidence + 5);
      }
    }
    
    // Address validation against state abbreviations
    if (entity.type === 'address') {
      const stateMatch = entity.value.match(/\b([A-Z]{2})\b/);
      if (stateMatch) {
        const stateCode = stateMatch[1];
        const stateAbbrevs = GEOGRAPHIC_DATA.stateAbbreviations as Record<string, string>;
        const stateName = Object.keys(stateAbbrevs).find(
          key => stateAbbrevs[key] === stateCode
        );
        if (stateName) {
          metadata.stateName = stateName;
          metadata.stateCode = stateCode;
          enhancedConfidence = Math.min(100, enhancedConfidence + 5);
        }
      }
    }
    
    return {
      ...entity,
      confidence: enhancedConfidence,
      metadata,
      verified: enhancedConfidence >= 75
    };
  });
}