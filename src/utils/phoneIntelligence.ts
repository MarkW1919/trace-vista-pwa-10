/**
 * Advanced Phone Intelligence for Skip Tracing
 * Comprehensive phone analysis, carrier detection, and geographic correlation
 */

export interface PhoneIntelligence {
  number: string;
  areaCode: string;
  exchange: string;
  lineNumber: string;
  region: GeographicRegion;
  carrier?: CarrierInfo;
  lineType: 'landline' | 'mobile' | 'voip' | 'toll-free' | 'premium' | 'unknown';
  confidence: number;
  riskFactors: string[];
  relatedNumbers?: string[];
}

export interface GeographicRegion {
  state: string;
  stateName: string;
  region: string;
  primaryCities: string[];
  counties: string[];
  timezone: string;
  coordinates?: { lat: number; lng: number };
}

export interface CarrierInfo {
  name: string;
  type: 'wireless' | 'landline' | 'voip';
  coverage: string[];
}

// Comprehensive area code to geographic mapping
const AREA_CODE_DATABASE = {
  '201': { state: 'NJ', stateName: 'New Jersey', region: 'Northern New Jersey', primaryCities: ['Jersey City', 'Hackensack', 'Union City'], counties: ['Hudson', 'Bergen'], timezone: 'Eastern' },
  '202': { state: 'DC', stateName: 'District of Columbia', region: 'Washington DC', primaryCities: ['Washington'], counties: ['District of Columbia'], timezone: 'Eastern' },
  '203': { state: 'CT', stateName: 'Connecticut', region: 'Southwest Connecticut', primaryCities: ['Bridgeport', 'New Haven', 'Stamford'], counties: ['Fairfield', 'New Haven'], timezone: 'Eastern' },
  '205': { state: 'AL', stateName: 'Alabama', region: 'Central Alabama', primaryCities: ['Birmingham', 'Tuscaloosa'], counties: ['Jefferson', 'Tuscaloosa'], timezone: 'Central' },
  '206': { state: 'WA', stateName: 'Washington', region: 'Seattle', primaryCities: ['Seattle'], counties: ['King'], timezone: 'Pacific' },
  '207': { state: 'ME', stateName: 'Maine', region: 'Maine', primaryCities: ['Portland', 'Bangor'], counties: ['Cumberland', 'Penobscot'], timezone: 'Eastern' },
  '208': { state: 'ID', stateName: 'Idaho', region: 'Idaho', primaryCities: ['Boise', 'Idaho Falls'], counties: ['Ada', 'Bonneville'], timezone: 'Mountain' },
  '209': { state: 'CA', stateName: 'California', region: 'Central Valley', primaryCities: ['Stockton', 'Modesto'], counties: ['San Joaquin', 'Stanislaus'], timezone: 'Pacific' },
  '210': { state: 'TX', stateName: 'Texas', region: 'South Central Texas', primaryCities: ['San Antonio'], counties: ['Bexar'], timezone: 'Central' },
  '212': { state: 'NY', stateName: 'New York', region: 'Manhattan', primaryCities: ['New York'], counties: ['New York'], timezone: 'Eastern' },
  '213': { state: 'CA', stateName: 'California', region: 'Los Angeles', primaryCities: ['Los Angeles'], counties: ['Los Angeles'], timezone: 'Pacific' },
  '214': { state: 'TX', stateName: 'Texas', region: 'Dallas', primaryCities: ['Dallas'], counties: ['Dallas'], timezone: 'Central' },
  '215': { state: 'PA', stateName: 'Pennsylvania', region: 'Philadelphia', primaryCities: ['Philadelphia'], counties: ['Philadelphia'], timezone: 'Eastern' },
  '216': { state: 'OH', stateName: 'Ohio', region: 'Cleveland', primaryCities: ['Cleveland'], counties: ['Cuyahoga'], timezone: 'Eastern' },
  '217': { state: 'IL', stateName: 'Illinois', region: 'Central Illinois', primaryCities: ['Springfield', 'Champaign'], counties: ['Sangamon', 'Champaign'], timezone: 'Central' },
  '218': { state: 'MN', stateName: 'Minnesota', region: 'Northern Minnesota', primaryCities: ['Duluth'], counties: ['St. Louis'], timezone: 'Central' },
  '219': { state: 'IN', stateName: 'Indiana', region: 'Northwest Indiana', primaryCities: ['Gary', 'Hammond'], counties: ['Lake', 'Porter'], timezone: 'Central' },
  '224': { state: 'IL', stateName: 'Illinois', region: 'Northern Illinois', primaryCities: ['Evanston', 'Des Plaines'], counties: ['Cook', 'Lake'], timezone: 'Central' },
  '225': { state: 'LA', stateName: 'Louisiana', region: 'South Central Louisiana', primaryCities: ['Baton Rouge'], counties: ['East Baton Rouge'], timezone: 'Central' },
  '228': { state: 'MS', stateName: 'Mississippi', region: 'Southern Mississippi', primaryCities: ['Gulfport', 'Biloxi'], counties: ['Harrison', 'Jackson'], timezone: 'Central' },
  '229': { state: 'GA', stateName: 'Georgia', region: 'Southwest Georgia', primaryCities: ['Albany'], counties: ['Dougherty'], timezone: 'Eastern' },
  '231': { state: 'MI', stateName: 'Michigan', region: 'Western Michigan', primaryCities: ['Muskegon', 'Traverse City'], counties: ['Muskegon', 'Grand Traverse'], timezone: 'Eastern' },
  '234': { state: 'OH', stateName: 'Ohio', region: 'Northeast Ohio', primaryCities: ['Akron', 'Youngstown'], counties: ['Summit', 'Mahoning'], timezone: 'Eastern' },
  '239': { state: 'FL', stateName: 'Florida', region: 'Southwest Florida', primaryCities: ['Fort Myers', 'Naples'], counties: ['Lee', 'Collier'], timezone: 'Eastern' },
  '240': { state: 'MD', stateName: 'Maryland', region: 'Western Maryland', primaryCities: ['Frederick', 'Hagerstown'], counties: ['Frederick', 'Washington'], timezone: 'Eastern' },
  '248': { state: 'MI', stateName: 'Michigan', region: 'Southeast Michigan', primaryCities: ['Pontiac', 'Troy'], counties: ['Oakland'], timezone: 'Eastern' },
  '251': { state: 'AL', stateName: 'Alabama', region: 'Southwest Alabama', primaryCities: ['Mobile'], counties: ['Mobile'], timezone: 'Central' },
  '252': { state: 'NC', stateName: 'North Carolina', region: 'Eastern North Carolina', primaryCities: ['Greenville', 'Rocky Mount'], counties: ['Pitt', 'Nash'], timezone: 'Eastern' },
  '253': { state: 'WA', stateName: 'Washington', region: 'South Puget Sound', primaryCities: ['Tacoma'], counties: ['Pierce'], timezone: 'Pacific' },
  '254': { state: 'TX', stateName: 'Texas', region: 'Central Texas', primaryCities: ['Killeen', 'Waco'], counties: ['Bell', 'McLennan'], timezone: 'Central' },
  '256': { state: 'AL', stateName: 'Alabama', region: 'Northern Alabama', primaryCities: ['Huntsville'], counties: ['Madison'], timezone: 'Central' },
  '260': { state: 'IN', stateName: 'Indiana', region: 'Northeast Indiana', primaryCities: ['Fort Wayne'], counties: ['Allen'], timezone: 'Eastern' },
  '262': { state: 'WI', stateName: 'Wisconsin', region: 'Southeast Wisconsin', primaryCities: ['Kenosha', 'Racine'], counties: ['Kenosha', 'Racine'], timezone: 'Central' },
  '267': { state: 'PA', stateName: 'Pennsylvania', region: 'Philadelphia Metro', primaryCities: ['Philadelphia'], counties: ['Philadelphia'], timezone: 'Eastern' },
  '269': { state: 'MI', stateName: 'Michigan', region: 'Southwest Michigan', primaryCities: ['Kalamazoo', 'Battle Creek'], counties: ['Kalamazoo', 'Calhoun'], timezone: 'Eastern' },
  '270': { state: 'KY', stateName: 'Kentucky', region: 'Western Kentucky', primaryCities: ['Bowling Green', 'Paducah'], counties: ['Warren', 'McCracken'], timezone: 'Central' },
  '276': { state: 'VA', stateName: 'Virginia', region: 'Southwest Virginia', primaryCities: ['Bristol'], counties: ['Washington'], timezone: 'Eastern' },
  '281': { state: 'TX', stateName: 'Texas', region: 'Houston Metro', primaryCities: ['Houston'], counties: ['Harris', 'Fort Bend'], timezone: 'Central' },
  '301': { state: 'MD', stateName: 'Maryland', region: 'Western Maryland & DC Metro', primaryCities: ['Frederick', 'Rockville'], counties: ['Montgomery', 'Frederick'], timezone: 'Eastern' },
  '302': { state: 'DE', stateName: 'Delaware', region: 'Delaware', primaryCities: ['Wilmington', 'Dover'], counties: ['New Castle', 'Kent'], timezone: 'Eastern' },
  '303': { state: 'CO', stateName: 'Colorado', region: 'Denver Metro', primaryCities: ['Denver', 'Boulder'], counties: ['Denver', 'Boulder'], timezone: 'Mountain' },
  '304': { state: 'WV', stateName: 'West Virginia', region: 'West Virginia', primaryCities: ['Charleston', 'Morgantown'], counties: ['Kanawha', 'Monongalia'], timezone: 'Eastern' },
  '305': { state: 'FL', stateName: 'Florida', region: 'South Florida', primaryCities: ['Miami', 'Key West'], counties: ['Miami-Dade', 'Monroe'], timezone: 'Eastern' },
  '307': { state: 'WY', stateName: 'Wyoming', region: 'Wyoming', primaryCities: ['Cheyenne', 'Casper'], counties: ['Laramie', 'Natrona'], timezone: 'Mountain' },
  '308': { state: 'NE', stateName: 'Nebraska', region: 'Western Nebraska', primaryCities: ['North Platte'], counties: ['Lincoln'], timezone: 'Central' },
  '309': { state: 'IL', stateName: 'Illinois', region: 'West Central Illinois', primaryCities: ['Peoria'], counties: ['Peoria'], timezone: 'Central' },
  '310': { state: 'CA', stateName: 'California', region: 'West Los Angeles', primaryCities: ['Beverly Hills', 'Santa Monica'], counties: ['Los Angeles'], timezone: 'Pacific' },
  '312': { state: 'IL', stateName: 'Illinois', region: 'Chicago', primaryCities: ['Chicago'], counties: ['Cook'], timezone: 'Central' },
  '313': { state: 'MI', stateName: 'Michigan', region: 'Detroit', primaryCities: ['Detroit'], counties: ['Wayne'], timezone: 'Eastern' },
  '314': { state: 'MO', stateName: 'Missouri', region: 'East Missouri', primaryCities: ['St. Louis'], counties: ['St. Louis', 'St. Louis City'], timezone: 'Central' },
  '315': { state: 'NY', stateName: 'New York', region: 'Central New York', primaryCities: ['Syracuse', 'Utica'], counties: ['Onondaga', 'Oneida'], timezone: 'Eastern' },
  '316': { state: 'KS', stateName: 'Kansas', region: 'South Central Kansas', primaryCities: ['Wichita'], counties: ['Sedgwick'], timezone: 'Central' },
  '317': { state: 'IN', stateName: 'Indiana', region: 'Central Indiana', primaryCities: ['Indianapolis'], counties: ['Marion'], timezone: 'Eastern' },
  '318': { state: 'LA', stateName: 'Louisiana', region: 'Northern Louisiana', primaryCities: ['Shreveport', 'Monroe'], counties: ['Caddo', 'Ouachita'], timezone: 'Central' },
  '319': { state: 'IA', stateName: 'Iowa', region: 'Eastern Iowa', primaryCities: ['Cedar Rapids', 'Dubuque'], counties: ['Linn', 'Dubuque'], timezone: 'Central' },
  '320': { state: 'MN', stateName: 'Minnesota', region: 'Central Minnesota', primaryCities: ['St. Cloud'], counties: ['Stearns'], timezone: 'Central' },
  '321': { state: 'FL', stateName: 'Florida', region: 'East Central Florida', primaryCities: ['Orlando', 'Cocoa'], counties: ['Orange', 'Brevard'], timezone: 'Eastern' },
  '323': { state: 'CA', stateName: 'California', region: 'Central LA', primaryCities: ['Los Angeles'], counties: ['Los Angeles'], timezone: 'Pacific' },
  '325': { state: 'TX', stateName: 'Texas', region: 'West Central Texas', primaryCities: ['Abilene'], counties: ['Taylor'], timezone: 'Central' },
  '330': { state: 'OH', stateName: 'Ohio', region: 'Northeast Ohio', primaryCities: ['Akron', 'Youngstown'], counties: ['Summit', 'Mahoning'], timezone: 'Eastern' },
  '331': { state: 'IL', stateName: 'Illinois', region: 'Chicago Suburbs', primaryCities: ['Aurora', 'Elgin'], counties: ['Kane', 'DuPage'], timezone: 'Central' },
  '334': { state: 'AL', stateName: 'Alabama', region: 'Southeast Alabama', primaryCities: ['Montgomery', 'Auburn'], counties: ['Montgomery', 'Lee'], timezone: 'Central' },
  '336': { state: 'NC', stateName: 'North Carolina', region: 'North Central NC', primaryCities: ['Greensboro', 'Winston-Salem'], counties: ['Guilford', 'Forsyth'], timezone: 'Eastern' },
  '337': { state: 'LA', stateName: 'Louisiana', region: 'Southwest Louisiana', primaryCities: ['Lafayette', 'Lake Charles'], counties: ['Lafayette', 'Calcasieu'], timezone: 'Central' },
  '339': { state: 'MA', stateName: 'Massachusetts', region: 'Eastern Massachusetts', primaryCities: ['Boston', 'Cambridge'], counties: ['Suffolk', 'Middlesex'], timezone: 'Eastern' },
  '347': { state: 'NY', stateName: 'New York', region: 'NYC Boroughs', primaryCities: ['Brooklyn', 'Queens', 'Bronx'], counties: ['Kings', 'Queens', 'Bronx'], timezone: 'Eastern' },
  '351': { state: 'MA', stateName: 'Massachusetts', region: 'Greater Boston', primaryCities: ['Lowell', 'Lawrence'], counties: ['Essex', 'Middlesex'], timezone: 'Eastern' },
  '352': { state: 'FL', stateName: 'Florida', region: 'North Central Florida', primaryCities: ['Gainesville'], counties: ['Alachua'], timezone: 'Eastern' },
  '360': { state: 'WA', stateName: 'Washington', region: 'Western Washington', primaryCities: ['Olympia', 'Bellingham'], counties: ['Thurston', 'Whatcom'], timezone: 'Pacific' },
  '361': { state: 'TX', stateName: 'Texas', region: 'South Texas', primaryCities: ['Corpus Christi'], counties: ['Nueces'], timezone: 'Central' },
  '386': { state: 'FL', stateName: 'Florida', region: 'North Florida', primaryCities: ['Daytona Beach'], counties: ['Volusia'], timezone: 'Eastern' },
  '401': { state: 'RI', stateName: 'Rhode Island', region: 'Rhode Island', primaryCities: ['Providence', 'Newport'], counties: ['Providence', 'Newport'], timezone: 'Eastern' },
  '402': { state: 'NE', stateName: 'Nebraska', region: 'Eastern Nebraska', primaryCities: ['Omaha', 'Lincoln'], counties: ['Douglas', 'Lancaster'], timezone: 'Central' },
  '404': { state: 'GA', stateName: 'Georgia', region: 'Atlanta', primaryCities: ['Atlanta'], counties: ['Fulton', 'DeKalb'], timezone: 'Eastern' },
  '405': { state: 'OK', stateName: 'Oklahoma', region: 'Central Oklahoma', primaryCities: ['Oklahoma City', 'Norman'], counties: ['Oklahoma', 'Cleveland'], timezone: 'Central' },
  '406': { state: 'MT', stateName: 'Montana', region: 'Montana', primaryCities: ['Billings', 'Missoula'], counties: ['Yellowstone', 'Missoula'], timezone: 'Mountain' },
  '407': { state: 'FL', stateName: 'Florida', region: 'Central Florida', primaryCities: ['Orlando'], counties: ['Orange'], timezone: 'Eastern' },
  '408': { state: 'CA', stateName: 'California', region: 'South Bay', primaryCities: ['San Jose'], counties: ['Santa Clara'], timezone: 'Pacific' },
  '409': { state: 'TX', stateName: 'Texas', region: 'Southeast Texas', primaryCities: ['Beaumont', 'Galveston'], counties: ['Jefferson', 'Galveston'], timezone: 'Central' },
  '410': { state: 'MD', stateName: 'Maryland', region: 'Eastern Maryland', primaryCities: ['Baltimore', 'Annapolis'], counties: ['Baltimore', 'Anne Arundel'], timezone: 'Eastern' },
  '412': { state: 'PA', stateName: 'Pennsylvania', region: 'Pittsburgh', primaryCities: ['Pittsburgh'], counties: ['Allegheny'], timezone: 'Eastern' },
  '413': { state: 'MA', stateName: 'Massachusetts', region: 'Western Massachusetts', primaryCities: ['Springfield', 'Pittsfield'], counties: ['Hampden', 'Berkshire'], timezone: 'Eastern' },
  '414': { state: 'WI', stateName: 'Wisconsin', region: 'Southeast Wisconsin', primaryCities: ['Milwaukee'], counties: ['Milwaukee'], timezone: 'Central' },
  '415': { state: 'CA', stateName: 'California', region: 'San Francisco', primaryCities: ['San Francisco'], counties: ['San Francisco'], timezone: 'Pacific' },
  '417': { state: 'MO', stateName: 'Missouri', region: 'Southwest Missouri', primaryCities: ['Springfield', 'Joplin'], counties: ['Greene', 'Jasper'], timezone: 'Central' },
  '419': { state: 'OH', stateName: 'Ohio', region: 'Northwest Ohio', primaryCities: ['Toledo', 'Lima'], counties: ['Lucas', 'Allen'], timezone: 'Eastern' },
  '423': { state: 'TN', stateName: 'Tennessee', region: 'East Tennessee', primaryCities: ['Chattanooga', 'Johnson City'], counties: ['Hamilton', 'Washington'], timezone: 'Eastern' },
  '424': { state: 'CA', stateName: 'California', region: 'West Los Angeles', primaryCities: ['Beverly Hills', 'Santa Monica'], counties: ['Los Angeles'], timezone: 'Pacific' },
  '425': { state: 'WA', stateName: 'Washington', region: 'Seattle Suburbs', primaryCities: ['Bellevue', 'Redmond'], counties: ['King', 'Snohomish'], timezone: 'Pacific' },
  '430': { state: 'TX', stateName: 'Texas', region: 'Northeast Texas', primaryCities: ['Tyler', 'Longview'], counties: ['Smith', 'Gregg'], timezone: 'Central' },
  '432': { state: 'TX', stateName: 'Texas', region: 'West Texas', primaryCities: ['Midland', 'Odessa'], counties: ['Midland', 'Ector'], timezone: 'Central' },
  '434': { state: 'VA', stateName: 'Virginia', region: 'South Central Virginia', primaryCities: ['Lynchburg', 'Charlottesville'], counties: ['Lynchburg City', 'Albemarle'], timezone: 'Eastern' },
  '435': { state: 'UT', stateName: 'Utah', region: 'Southern Utah', primaryCities: ['St. George', 'Cedar City'], counties: ['Washington', 'Iron'], timezone: 'Mountain' },
  '440': { state: 'OH', stateName: 'Ohio', region: 'Cleveland Suburbs', primaryCities: ['Lorain', 'Elyria'], counties: ['Lorain', 'Lake'], timezone: 'Eastern' },
  '443': { state: 'MD', stateName: 'Maryland', region: 'Eastern Maryland', primaryCities: ['Baltimore'], counties: ['Baltimore'], timezone: 'Eastern' },
  '458': { state: 'OR', stateName: 'Oregon', region: 'Eugene Metro', primaryCities: ['Eugene'], counties: ['Lane'], timezone: 'Pacific' },
  '469': { state: 'TX', stateName: 'Texas', region: 'Dallas Metro', primaryCities: ['Plano', 'McKinney'], counties: ['Collin', 'Denton'], timezone: 'Central' },
  '470': { state: 'GA', stateName: 'Georgia', region: 'Atlanta Metro', primaryCities: ['Marietta', 'Roswell'], counties: ['Cobb', 'Fulton'], timezone: 'Eastern' },
  '475': { state: 'CT', stateName: 'Connecticut', region: 'Southwest Connecticut', primaryCities: ['Bridgeport', 'New Haven'], counties: ['Fairfield', 'New Haven'], timezone: 'Eastern' },
  '478': { state: 'GA', stateName: 'Georgia', region: 'Central Georgia', primaryCities: ['Macon', 'Warner Robins'], counties: ['Bibb', 'Houston'], timezone: 'Eastern' },
  '479': { state: 'AR', stateName: 'Arkansas', region: 'Northwest Arkansas', primaryCities: ['Fort Smith', 'Fayetteville'], counties: ['Sebastian', 'Washington'], timezone: 'Central' },
  '480': { state: 'AZ', stateName: 'Arizona', region: 'East Phoenix', primaryCities: ['Scottsdale', 'Tempe'], counties: ['Maricopa'], timezone: 'Mountain' },
  '484': { state: 'PA', stateName: 'Pennsylvania', region: 'Southeast Pennsylvania', primaryCities: ['Allentown', 'Reading'], counties: ['Lehigh', 'Berks'], timezone: 'Eastern' },
  '501': { state: 'AR', stateName: 'Arkansas', region: 'Central Arkansas', primaryCities: ['Little Rock', 'Conway'], counties: ['Pulaski', 'Faulkner'], timezone: 'Central' },
  '502': { state: 'KY', stateName: 'Kentucky', region: 'North Central Kentucky', primaryCities: ['Louisville'], counties: ['Jefferson'], timezone: 'Eastern' },
  '503': { state: 'OR', stateName: 'Oregon', region: 'Northwest Oregon', primaryCities: ['Portland', 'Salem'], counties: ['Washington', 'Marion'], timezone: 'Pacific' },
  '504': { state: 'LA', stateName: 'Louisiana', region: 'New Orleans', primaryCities: ['New Orleans'], counties: ['Orleans'], timezone: 'Central' },
  '505': { state: 'NM', stateName: 'New Mexico', region: 'New Mexico', primaryCities: ['Albuquerque', 'Santa Fe'], counties: ['Bernalillo', 'Santa Fe'], timezone: 'Mountain' },
  '507': { state: 'MN', stateName: 'Minnesota', region: 'Southern Minnesota', primaryCities: ['Rochester', 'Mankato'], counties: ['Olmsted', 'Blue Earth'], timezone: 'Central' },
  '508': { state: 'MA', stateName: 'Massachusetts', region: 'Central Massachusetts', primaryCities: ['Worcester', 'Framingham'], counties: ['Worcester', 'Middlesex'], timezone: 'Eastern' },
  '509': { state: 'WA', stateName: 'Washington', region: 'Eastern Washington', primaryCities: ['Spokane', 'Yakima'], counties: ['Spokane', 'Yakima'], timezone: 'Pacific' },
  '510': { state: 'CA', stateName: 'California', region: 'East Bay', primaryCities: ['Oakland', 'Fremont'], counties: ['Alameda'], timezone: 'Pacific' },
  '512': { state: 'TX', stateName: 'Texas', region: 'Central Texas', primaryCities: ['Austin'], counties: ['Travis'], timezone: 'Central' },
  '513': { state: 'OH', stateName: 'Ohio', region: 'Southwest Ohio', primaryCities: ['Cincinnati', 'Dayton'], counties: ['Hamilton', 'Montgomery'], timezone: 'Eastern' },
  '515': { state: 'IA', stateName: 'Iowa', region: 'Central Iowa', primaryCities: ['Des Moines', 'Ames'], counties: ['Polk', 'Story'], timezone: 'Central' },
  '516': { state: 'NY', stateName: 'New York', region: 'Nassau County', primaryCities: ['Hempstead', 'Levittown'], counties: ['Nassau'], timezone: 'Eastern' },
  '517': { state: 'MI', stateName: 'Michigan', region: 'South Central Michigan', primaryCities: ['Lansing', 'Jackson'], counties: ['Ingham', 'Jackson'], timezone: 'Eastern' },
  '518': { state: 'NY', stateName: 'New York', region: 'Northeast New York', primaryCities: ['Albany', 'Schenectady'], counties: ['Albany', 'Schenectady'], timezone: 'Eastern' },
  '520': { state: 'AZ', stateName: 'Arizona', region: 'Southern Arizona', primaryCities: ['Tucson'], counties: ['Pima'], timezone: 'Mountain' },
  '530': { state: 'CA', stateName: 'California', region: 'Northern California', primaryCities: ['Redding', 'Chico'], counties: ['Shasta', 'Butte'], timezone: 'Pacific' },
  '540': { state: 'VA', stateName: 'Virginia', region: 'Northwest Virginia', primaryCities: ['Roanoke', 'Harrisonburg'], counties: ['Roanoke', 'Rockingham'], timezone: 'Eastern' },
  '541': { state: 'OR', stateName: 'Oregon', region: 'Central Oregon', primaryCities: ['Eugene', 'Bend'], counties: ['Lane', 'Deschutes'], timezone: 'Pacific' },
  '551': { state: 'NJ', stateName: 'New Jersey', region: 'Northern New Jersey', primaryCities: ['Jersey City', 'Newark'], counties: ['Hudson', 'Essex'], timezone: 'Eastern' },
  '559': { state: 'CA', stateName: 'California', region: 'Central Valley', primaryCities: ['Fresno', 'Visalia'], counties: ['Fresno', 'Tulare'], timezone: 'Pacific' },
  '561': { state: 'FL', stateName: 'Florida', region: 'Palm Beach', primaryCities: ['West Palm Beach', 'Boca Raton'], counties: ['Palm Beach'], timezone: 'Eastern' },
  '562': { state: 'CA', stateName: 'California', region: 'Southeast LA', primaryCities: ['Long Beach', 'Whittier'], counties: ['Los Angeles'], timezone: 'Pacific' },
  '563': { state: 'IA', stateName: 'Iowa', region: 'Eastern Iowa', primaryCities: ['Davenport', 'Dubuque'], counties: ['Scott', 'Dubuque'], timezone: 'Central' },
  '564': { state: 'WA', stateName: 'Washington', region: 'Western Washington', primaryCities: ['Olympia', 'Centralia'], counties: ['Thurston', 'Lewis'], timezone: 'Pacific' },
  '567': { state: 'OH', stateName: 'Ohio', region: 'Northwest Ohio', primaryCities: ['Toledo'], counties: ['Lucas'], timezone: 'Eastern' },
  '570': { state: 'PA', stateName: 'Pennsylvania', region: 'Northeast Pennsylvania', primaryCities: ['Scranton', 'Wilkes-Barre'], counties: ['Lackawanna', 'Luzerne'], timezone: 'Eastern' },
  '571': { state: 'VA', stateName: 'Virginia', region: 'Northern Virginia', primaryCities: ['Arlington', 'Alexandria'], counties: ['Arlington', 'Alexandria City'], timezone: 'Eastern' },
  '573': { state: 'MO', stateName: 'Missouri', region: 'Southeast Missouri', primaryCities: ['Columbia', 'Cape Girardeau'], counties: ['Boone', 'Cape Girardeau'], timezone: 'Central' },
  '574': { state: 'IN', stateName: 'Indiana', region: 'North Central Indiana', primaryCities: ['South Bend', 'Elkhart'], counties: ['St. Joseph', 'Elkhart'], timezone: 'Eastern' },
  '575': { state: 'NM', stateName: 'New Mexico', region: 'Southern New Mexico', primaryCities: ['Las Cruces', 'Roswell'], counties: ['Doña Ana', 'Chaves'], timezone: 'Mountain' },
  '580': { state: 'OK', stateName: 'Oklahoma', region: 'Southern Oklahoma', primaryCities: ['Lawton', 'Durant', 'Calera', 'Caddo'], counties: ['Comanche', 'Bryan', 'Atoka', 'Marshall'], timezone: 'Central' },
  '585': { state: 'NY', stateName: 'New York', region: 'Western New York', primaryCities: ['Rochester'], counties: ['Monroe'], timezone: 'Eastern' },
  '586': { state: 'MI', stateName: 'Michigan', region: 'East Detroit', primaryCities: ['Warren', 'Sterling Heights'], counties: ['Macomb'], timezone: 'Eastern' },
  '601': { state: 'MS', stateName: 'Mississippi', region: 'Central Mississippi', primaryCities: ['Jackson', 'Hattiesburg'], counties: ['Hinds', 'Forrest'], timezone: 'Central' },
  '602': { state: 'AZ', stateName: 'Arizona', region: 'Central Phoenix', primaryCities: ['Phoenix'], counties: ['Maricopa'], timezone: 'Mountain' },
  '603': { state: 'NH', stateName: 'New Hampshire', region: 'New Hampshire', primaryCities: ['Manchester', 'Nashua'], counties: ['Hillsborough'], timezone: 'Eastern' },
  '605': { state: 'SD', stateName: 'South Dakota', region: 'South Dakota', primaryCities: ['Sioux Falls', 'Rapid City'], counties: ['Minnehaha', 'Pennington'], timezone: 'Central' },
  '606': { state: 'KY', stateName: 'Kentucky', region: 'Southeast Kentucky', primaryCities: ['Ashland', 'Middlesboro'], counties: ['Boyd', 'Bell'], timezone: 'Eastern' },
  '607': { state: 'NY', stateName: 'New York', region: 'South Central New York', primaryCities: ['Binghamton', 'Ithaca'], counties: ['Broome', 'Tompkins'], timezone: 'Eastern' },
  '608': { state: 'WI', stateName: 'Wisconsin', region: 'Southwest Wisconsin', primaryCities: ['Madison', 'La Crosse'], counties: ['Dane', 'La Crosse'], timezone: 'Central' },
  '609': { state: 'NJ', stateName: 'New Jersey', region: 'Central New Jersey', primaryCities: ['Trenton', 'Atlantic City'], counties: ['Mercer', 'Atlantic'], timezone: 'Eastern' },
  '610': { state: 'PA', stateName: 'Pennsylvania', region: 'Southeast Pennsylvania', primaryCities: ['Allentown', 'Reading'], counties: ['Lehigh', 'Berks'], timezone: 'Eastern' },
  '612': { state: 'MN', stateName: 'Minnesota', region: 'Minneapolis', primaryCities: ['Minneapolis'], counties: ['Hennepin'], timezone: 'Central' },
  '614': { state: 'OH', stateName: 'Ohio', region: 'Central Ohio', primaryCities: ['Columbus'], counties: ['Franklin'], timezone: 'Eastern' },
  '615': { state: 'TN', stateName: 'Tennessee', region: 'Nashville', primaryCities: ['Nashville'], counties: ['Davidson'], timezone: 'Central' },
  '616': { state: 'MI', stateName: 'Michigan', region: 'West Michigan', primaryCities: ['Grand Rapids', 'Kalamazoo'], counties: ['Kent', 'Kalamazoo'], timezone: 'Eastern' },
  '617': { state: 'MA', stateName: 'Massachusetts', region: 'Boston', primaryCities: ['Boston'], counties: ['Suffolk'], timezone: 'Eastern' },
  '618': { state: 'IL', stateName: 'Illinois', region: 'Southern Illinois', primaryCities: ['East St. Louis', 'Carbondale'], counties: ['St. Clair', 'Jackson'], timezone: 'Central' },
  '619': { state: 'CA', stateName: 'California', region: 'San Diego', primaryCities: ['San Diego'], counties: ['San Diego'], timezone: 'Pacific' },
  '620': { state: 'KS', stateName: 'Kansas', region: 'Southeast Kansas', primaryCities: ['Dodge City', 'Garden City'], counties: ['Ford', 'Finney'], timezone: 'Central' },
  '623': { state: 'AZ', stateName: 'Arizona', region: 'West Phoenix', primaryCities: ['Glendale', 'Peoria'], counties: ['Maricopa'], timezone: 'Mountain' },
  '626': { state: 'CA', stateName: 'California', region: 'San Gabriel Valley', primaryCities: ['Pasadena', 'Pomona'], counties: ['Los Angeles'], timezone: 'Pacific' },
  '628': { state: 'CA', stateName: 'California', region: 'San Francisco', primaryCities: ['San Francisco'], counties: ['San Francisco'], timezone: 'Pacific' },
  '629': { state: 'TN', stateName: 'Tennessee', region: 'Nashville Metro', primaryCities: ['Nashville'], counties: ['Davidson'], timezone: 'Central' },
  '630': { state: 'IL', stateName: 'Illinois', region: 'West Chicago', primaryCities: ['Aurora', 'Naperville'], counties: ['DuPage', 'Kane'], timezone: 'Central' },
  '631': { state: 'NY', stateName: 'New York', region: 'Suffolk County', primaryCities: ['Huntington', 'Brookhaven'], counties: ['Suffolk'], timezone: 'Eastern' },
  '636': { state: 'MO', stateName: 'Missouri', region: 'East Missouri', primaryCities: ['O\'Fallon', 'St. Charles'], counties: ['St. Charles'], timezone: 'Central' },
  '641': { state: 'IA', stateName: 'Iowa', region: 'Central Iowa', primaryCities: ['Mason City', 'Ottumwa'], counties: ['Cerro Gordo', 'Wapello'], timezone: 'Central' },
  '646': { state: 'NY', stateName: 'New York', region: 'Manhattan', primaryCities: ['New York'], counties: ['New York'], timezone: 'Eastern' },
  '650': { state: 'CA', stateName: 'California', region: 'Peninsula', primaryCities: ['San Mateo', 'Palo Alto'], counties: ['San Mateo'], timezone: 'Pacific' },
  '651': { state: 'MN', stateName: 'Minnesota', region: 'St. Paul', primaryCities: ['St. Paul'], counties: ['Ramsey'], timezone: 'Central' },
  '657': { state: 'CA', stateName: 'California', region: 'North Orange County', primaryCities: ['Anaheim', 'Fullerton'], counties: ['Orange'], timezone: 'Pacific' },
  '660': { state: 'MO', stateName: 'Missouri', region: 'North Central Missouri', primaryCities: ['Sedalia', 'Kirksville'], counties: ['Pettis', 'Adair'], timezone: 'Central' },
  '661': { state: 'CA', stateName: 'California', region: 'North LA County', primaryCities: ['Palmdale', 'Lancaster'], counties: ['Los Angeles', 'Kern'], timezone: 'Pacific' },
  '662': { state: 'MS', stateName: 'Mississippi', region: 'North Mississippi', primaryCities: ['Tupelo', 'Columbus'], counties: ['Lee', 'Lowndes'], timezone: 'Central' },
  '667': { state: 'MD', stateName: 'Maryland', region: 'Eastern Maryland', primaryCities: ['Baltimore'], counties: ['Baltimore'], timezone: 'Eastern' },
  '669': { state: 'CA', stateName: 'California', region: 'South Bay', primaryCities: ['San Jose'], counties: ['Santa Clara'], timezone: 'Pacific' },
  '678': { state: 'GA', stateName: 'Georgia', region: 'North Atlanta', primaryCities: ['Marietta', 'Alpharetta'], counties: ['Cobb', 'Fulton'], timezone: 'Eastern' },
  '681': { state: 'WV', stateName: 'West Virginia', region: 'West Virginia', primaryCities: ['Charleston', 'Morgantown'], counties: ['Kanawha', 'Monongalia'], timezone: 'Eastern' },
  '682': { state: 'TX', stateName: 'Texas', region: 'Fort Worth', primaryCities: ['Fort Worth', 'Arlington'], counties: ['Tarrant'], timezone: 'Central' },
  '689': { state: 'FL', stateName: 'Florida', region: 'Central Florida', primaryCities: ['Orlando'], counties: ['Orange'], timezone: 'Eastern' },
  '701': { state: 'ND', stateName: 'North Dakota', region: 'North Dakota', primaryCities: ['Fargo', 'Bismarck'], counties: ['Cass', 'Burleigh'], timezone: 'Central' },
  '702': { state: 'NV', stateName: 'Nevada', region: 'Las Vegas', primaryCities: ['Las Vegas', 'Henderson'], counties: ['Clark'], timezone: 'Pacific' },
  '703': { state: 'VA', stateName: 'Virginia', region: 'Northern Virginia', primaryCities: ['Arlington', 'Alexandria'], counties: ['Arlington', 'Fairfax'], timezone: 'Eastern' },
  '704': { state: 'NC', stateName: 'North Carolina', region: 'South Central NC', primaryCities: ['Charlotte', 'Gastonia'], counties: ['Mecklenburg', 'Gaston'], timezone: 'Eastern' },
  '706': { state: 'GA', stateName: 'Georgia', region: 'North Georgia', primaryCities: ['Augusta', 'Columbus'], counties: ['Richmond', 'Muscogee'], timezone: 'Eastern' },
  '707': { state: 'CA', stateName: 'California', region: 'North Bay', primaryCities: ['Santa Rosa', 'Napa'], counties: ['Sonoma', 'Napa'], timezone: 'Pacific' },
  '708': { state: 'IL', stateName: 'Illinois', region: 'South Chicago', primaryCities: ['Oak Lawn', 'Cicero'], counties: ['Cook'], timezone: 'Central' },
  '712': { state: 'IA', stateName: 'Iowa', region: 'Western Iowa', primaryCities: ['Sioux City', 'Council Bluffs'], counties: ['Woodbury', 'Pottawattamie'], timezone: 'Central' },
  '713': { state: 'TX', stateName: 'Texas', region: 'Houston', primaryCities: ['Houston'], counties: ['Harris'], timezone: 'Central' },
  '714': { state: 'CA', stateName: 'California', region: 'North Orange County', primaryCities: ['Anaheim', 'Huntington Beach'], counties: ['Orange'], timezone: 'Pacific' },
  '715': { state: 'WI', stateName: 'Wisconsin', region: 'North Central Wisconsin', primaryCities: ['Eau Claire', 'Wausau'], counties: ['Eau Claire', 'Marathon'], timezone: 'Central' },
  '716': { state: 'NY', stateName: 'New York', region: 'Western New York', primaryCities: ['Buffalo', 'Niagara Falls'], counties: ['Erie', 'Niagara'], timezone: 'Eastern' },
  '717': { state: 'PA', stateName: 'Pennsylvania', region: 'South Central Pennsylvania', primaryCities: ['Harrisburg', 'Lancaster'], counties: ['Dauphin', 'Lancaster'], timezone: 'Eastern' },
  '718': { state: 'NY', stateName: 'New York', region: 'NYC Boroughs', primaryCities: ['Brooklyn', 'Queens', 'Bronx'], counties: ['Kings', 'Queens', 'Bronx'], timezone: 'Eastern' },
  '719': { state: 'CO', stateName: 'Colorado', region: 'South Central Colorado', primaryCities: ['Colorado Springs', 'Pueblo'], counties: ['El Paso', 'Pueblo'], timezone: 'Mountain' },
  '720': { state: 'CO', stateName: 'Colorado', region: 'Denver Metro', primaryCities: ['Denver', 'Thornton'], counties: ['Denver', 'Adams'], timezone: 'Mountain' },
  '724': { state: 'PA', stateName: 'Pennsylvania', region: 'Southwest Pennsylvania', primaryCities: ['Washington', 'Uniontown'], counties: ['Washington', 'Fayette'], timezone: 'Eastern' },
  '725': { state: 'NV', stateName: 'Nevada', region: 'Las Vegas', primaryCities: ['Las Vegas', 'Henderson'], counties: ['Clark'], timezone: 'Pacific' },
  '727': { state: 'FL', stateName: 'Florida', region: 'Pinellas County', primaryCities: ['St. Petersburg', 'Clearwater'], counties: ['Pinellas'], timezone: 'Eastern' },
  '731': { state: 'TN', stateName: 'Tennessee', region: 'West Tennessee', primaryCities: ['Jackson', 'Martin'], counties: ['Madison', 'Weakley'], timezone: 'Central' },
  '732': { state: 'NJ', stateName: 'New Jersey', region: 'Central New Jersey', primaryCities: ['New Brunswick', 'Toms River'], counties: ['Middlesex', 'Ocean'], timezone: 'Eastern' },
  '734': { state: 'MI', stateName: 'Michigan', region: 'Southeast Michigan', primaryCities: ['Ann Arbor', 'Livonia'], counties: ['Washtenaw', 'Wayne'], timezone: 'Eastern' },
  '737': { state: 'TX', stateName: 'Texas', region: 'Central Texas', primaryCities: ['Austin', 'Round Rock'], counties: ['Travis', 'Williamson'], timezone: 'Central' },
  '740': { state: 'OH', stateName: 'Ohio', region: 'Southeast Ohio', primaryCities: ['Zanesville', 'Athens'], counties: ['Muskingum', 'Athens'], timezone: 'Eastern' },
  '747': { state: 'CA', stateName: 'California', region: 'San Fernando Valley', primaryCities: ['Burbank', 'Glendale'], counties: ['Los Angeles'], timezone: 'Pacific' },
  '754': { state: 'FL', stateName: 'Florida', region: 'Broward County', primaryCities: ['Fort Lauderdale', 'Hollywood'], counties: ['Broward'], timezone: 'Eastern' },
  '757': { state: 'VA', stateName: 'Virginia', region: 'Hampton Roads', primaryCities: ['Virginia Beach', 'Norfolk'], counties: ['Virginia Beach City', 'Norfolk City'], timezone: 'Eastern' },
  '760': { state: 'CA', stateName: 'California', region: 'North San Diego', primaryCities: ['Oceanside', 'Palm Springs'], counties: ['San Diego', 'Riverside'], timezone: 'Pacific' },
  '762': { state: 'GA', stateName: 'Georgia', region: 'North Georgia', primaryCities: ['Augusta', 'Rome'], counties: ['Richmond', 'Floyd'], timezone: 'Eastern' },
  '763': { state: 'MN', stateName: 'Minnesota', region: 'Minneapolis Suburbs', primaryCities: ['Brooklyn Park', 'Plymouth'], counties: ['Hennepin', 'Anoka'], timezone: 'Central' },
  '765': { state: 'IN', stateName: 'Indiana', region: 'East Central Indiana', primaryCities: ['Muncie', 'Anderson'], counties: ['Delaware', 'Madison'], timezone: 'Eastern' },
  '769': { state: 'MS', stateName: 'Mississippi', region: 'Central Mississippi', primaryCities: ['Jackson'], counties: ['Hinds'], timezone: 'Central' },
  '770': { state: 'GA', stateName: 'Georgia', region: 'Atlanta Suburbs', primaryCities: ['Marietta', 'Roswell'], counties: ['Cobb', 'Fulton'], timezone: 'Eastern' },
  '772': { state: 'FL', stateName: 'Florida', region: 'Treasure Coast', primaryCities: ['Port St. Lucie', 'Vero Beach'], counties: ['St. Lucie', 'Indian River'], timezone: 'Eastern' },
  '773': { state: 'IL', stateName: 'Illinois', region: 'Chicago', primaryCities: ['Chicago'], counties: ['Cook'], timezone: 'Central' },
  '774': { state: 'MA', stateName: 'Massachusetts', region: 'Central Massachusetts', primaryCities: ['Worcester', 'Marlborough'], counties: ['Worcester', 'Middlesex'], timezone: 'Eastern' },
  '775': { state: 'NV', stateName: 'Nevada', region: 'Northern Nevada', primaryCities: ['Reno', 'Carson City'], counties: ['Washoe', 'Carson City'], timezone: 'Pacific' },
  '779': { state: 'IL', stateName: 'Illinois', region: 'North Illinois', primaryCities: ['Rockford', 'Elgin'], counties: ['Winnebago', 'Kane'], timezone: 'Central' },
  '781': { state: 'MA', stateName: 'Massachusetts', region: 'Boston Suburbs', primaryCities: ['Waltham', 'Lexington'], counties: ['Middlesex', 'Norfolk'], timezone: 'Eastern' },
  '785': { state: 'KS', stateName: 'Kansas', region: 'North Central Kansas', primaryCities: ['Topeka', 'Lawrence'], counties: ['Shawnee', 'Douglas'], timezone: 'Central' },
  '786': { state: 'FL', stateName: 'Florida', region: 'Miami-Dade', primaryCities: ['Miami', 'Hialeah'], counties: ['Miami-Dade'], timezone: 'Eastern' },
  '787': { state: 'PR', stateName: 'Puerto Rico', region: 'Puerto Rico', primaryCities: ['San Juan', 'Bayamón'], counties: ['San Juan', 'Bayamón'], timezone: 'Atlantic' },
  '801': { state: 'UT', stateName: 'Utah', region: 'Northern Utah', primaryCities: ['Salt Lake City', 'West Valley City'], counties: ['Salt Lake', 'Utah'], timezone: 'Mountain' },
  '802': { state: 'VT', stateName: 'Vermont', region: 'Vermont', primaryCities: ['Burlington', 'Rutland'], counties: ['Chittenden', 'Rutland'], timezone: 'Eastern' },
  '803': { state: 'SC', stateName: 'South Carolina', region: 'Central South Carolina', primaryCities: ['Columbia', 'Rock Hill'], counties: ['Richland', 'York'], timezone: 'Eastern' },
  '804': { state: 'VA', stateName: 'Virginia', region: 'East Central Virginia', primaryCities: ['Richmond', 'Petersburg'], counties: ['Richmond City', 'Petersburg City'], timezone: 'Eastern' },
  '805': { state: 'CA', stateName: 'California', region: 'Central Coast', primaryCities: ['Oxnard', 'Santa Barbara'], counties: ['Ventura', 'Santa Barbara'], timezone: 'Pacific' },
  '806': { state: 'TX', stateName: 'Texas', region: 'Panhandle', primaryCities: ['Lubbock', 'Amarillo'], counties: ['Lubbock', 'Potter'], timezone: 'Central' },
  '808': { state: 'HI', stateName: 'Hawaii', region: 'Hawaii', primaryCities: ['Honolulu', 'Hilo'], counties: ['Honolulu', 'Hawaii'], timezone: 'Hawaii' },
  '810': { state: 'MI', stateName: 'Michigan', region: 'East Central Michigan', primaryCities: ['Flint', 'Port Huron'], counties: ['Genesee', 'St. Clair'], timezone: 'Eastern' },
  '812': { state: 'IN', stateName: 'Indiana', region: 'South Central Indiana', primaryCities: ['Evansville', 'Bloomington'], counties: ['Vanderburgh', 'Monroe'], timezone: 'Eastern' },
  '813': { state: 'FL', stateName: 'Florida', region: 'Tampa', primaryCities: ['Tampa'], counties: ['Hillsborough'], timezone: 'Eastern' },
  '814': { state: 'PA', stateName: 'Pennsylvania', region: 'Central Pennsylvania', primaryCities: ['Erie', 'Altoona'], counties: ['Erie', 'Blair'], timezone: 'Eastern' },
  '815': { state: 'IL', stateName: 'Illinois', region: 'North Central Illinois', primaryCities: ['Rockford', 'Joliet'], counties: ['Winnebago', 'Will'], timezone: 'Central' },
  '816': { state: 'MO', stateName: 'Missouri', region: 'Northwest Missouri', primaryCities: ['Kansas City', 'Independence'], counties: ['Jackson', 'Clay'], timezone: 'Central' },
  '817': { state: 'TX', stateName: 'Texas', region: 'North Central Texas', primaryCities: ['Fort Worth', 'Arlington'], counties: ['Tarrant'], timezone: 'Central' },
  '818': { state: 'CA', stateName: 'California', region: 'San Fernando Valley', primaryCities: ['Glendale', 'Burbank'], counties: ['Los Angeles'], timezone: 'Pacific' },
  '828': { state: 'NC', stateName: 'North Carolina', region: 'Western North Carolina', primaryCities: ['Asheville', 'Hickory'], counties: ['Buncombe', 'Catawba'], timezone: 'Eastern' },
  '830': { state: 'TX', stateName: 'Texas', region: 'South Central Texas', primaryCities: ['New Braunfels', 'Fredericksburg'], counties: ['Comal', 'Gillespie'], timezone: 'Central' },
  '831': { state: 'CA', stateName: 'California', region: 'Central Coast', primaryCities: ['Salinas', 'Santa Cruz'], counties: ['Monterey', 'Santa Cruz'], timezone: 'Pacific' },
  '832': { state: 'TX', stateName: 'Texas', region: 'Houston Metro', primaryCities: ['Houston', 'The Woodlands'], counties: ['Harris', 'Montgomery'], timezone: 'Central' },
  '843': { state: 'SC', stateName: 'South Carolina', region: 'Coastal South Carolina', primaryCities: ['Charleston', 'Myrtle Beach'], counties: ['Charleston', 'Horry'], timezone: 'Eastern' },
  '845': { state: 'NY', stateName: 'New York', region: 'Hudson Valley', primaryCities: ['Poughkeepsie', 'Newburgh'], counties: ['Dutchess', 'Orange'], timezone: 'Eastern' },
  '847': { state: 'IL', stateName: 'Illinois', region: 'North Chicago', primaryCities: ['Schaumburg', 'Evanston'], counties: ['Cook', 'Lake'], timezone: 'Central' },
  '848': { state: 'NJ', stateName: 'New Jersey', region: 'Central New Jersey', primaryCities: ['New Brunswick', 'Edison'], counties: ['Middlesex'], timezone: 'Eastern' },
  '850': { state: 'FL', stateName: 'Florida', region: 'Northwest Florida', primaryCities: ['Tallahassee', 'Pensacola'], counties: ['Leon', 'Escambia'], timezone: 'Eastern' },
  '856': { state: 'NJ', stateName: 'New Jersey', region: 'South Jersey', primaryCities: ['Camden', 'Cherry Hill'], counties: ['Camden'], timezone: 'Eastern' },
  '857': { state: 'MA', stateName: 'Massachusetts', region: 'Boston Metro', primaryCities: ['Boston', 'Cambridge'], counties: ['Suffolk', 'Middlesex'], timezone: 'Eastern' },
  '858': { state: 'CA', stateName: 'California', region: 'North San Diego', primaryCities: ['San Diego'], counties: ['San Diego'], timezone: 'Pacific' },
  '859': { state: 'KY', stateName: 'Kentucky', region: 'North Central Kentucky', primaryCities: ['Lexington', 'Covington'], counties: ['Fayette', 'Kenton'], timezone: 'Eastern' },
  '860': { state: 'CT', stateName: 'Connecticut', region: 'Connecticut', primaryCities: ['Hartford', 'New Britain'], counties: ['Hartford'], timezone: 'Eastern' },
  '862': { state: 'NJ', stateName: 'New Jersey', region: 'Northern New Jersey', primaryCities: ['Newark', 'Paterson'], counties: ['Essex', 'Passaic'], timezone: 'Eastern' },
  '863': { state: 'FL', stateName: 'Florida', region: 'Central Florida', primaryCities: ['Lakeland', 'Sebring'], counties: ['Polk', 'Highlands'], timezone: 'Eastern' },
  '864': { state: 'SC', stateName: 'South Carolina', region: 'Upstate South Carolina', primaryCities: ['Greenville', 'Spartanburg'], counties: ['Greenville', 'Spartanburg'], timezone: 'Eastern' },
  '865': { state: 'TN', stateName: 'Tennessee', region: 'East Tennessee', primaryCities: ['Knoxville', 'Oak Ridge'], counties: ['Knox', 'Anderson'], timezone: 'Eastern' },
  '870': { state: 'AR', stateName: 'Arkansas', region: 'Northeast Arkansas', primaryCities: ['Jonesboro', 'Pine Bluff'], counties: ['Craighead', 'Jefferson'], timezone: 'Central' },
  '872': { state: 'IL', stateName: 'Illinois', region: 'Chicago', primaryCities: ['Chicago'], counties: ['Cook'], timezone: 'Central' },
  '878': { state: 'PA', stateName: 'Pennsylvania', region: 'Pittsburgh Metro', primaryCities: ['Pittsburgh'], counties: ['Allegheny'], timezone: 'Eastern' },
  '901': { state: 'TN', stateName: 'Tennessee', region: 'Southwest Tennessee', primaryCities: ['Memphis'], counties: ['Shelby'], timezone: 'Central' },
  '903': { state: 'TX', stateName: 'Texas', region: 'Northeast Texas', primaryCities: ['Tyler', 'Marshall'], counties: ['Smith', 'Harrison'], timezone: 'Central' },
  '904': { state: 'FL', stateName: 'Florida', region: 'Northeast Florida', primaryCities: ['Jacksonville'], counties: ['Duval'], timezone: 'Eastern' },
  '906': { state: 'MI', stateName: 'Michigan', region: 'Upper Peninsula', primaryCities: ['Marquette', 'Sault Ste. Marie'], counties: ['Marquette', 'Chippewa'], timezone: 'Eastern' },
  '907': { state: 'AK', stateName: 'Alaska', region: 'Alaska', primaryCities: ['Anchorage', 'Fairbanks'], counties: ['Anchorage', 'Fairbanks North Star'], timezone: 'Alaska' },
  '908': { state: 'NJ', stateName: 'New Jersey', region: 'Central New Jersey', primaryCities: ['Elizabeth', 'Plainfield'], counties: ['Union'], timezone: 'Eastern' },
  '909': { state: 'CA', stateName: 'California', region: 'Inland Empire', primaryCities: ['San Bernardino', 'Riverside'], counties: ['San Bernardino', 'Riverside'], timezone: 'Pacific' },
  '910': { state: 'NC', stateName: 'North Carolina', region: 'Southeast North Carolina', primaryCities: ['Fayetteville', 'Wilmington'], counties: ['Cumberland', 'New Hanover'], timezone: 'Eastern' },
  '912': { state: 'GA', stateName: 'Georgia', region: 'Southeast Georgia', primaryCities: ['Savannah', 'Brunswick'], counties: ['Chatham', 'Glynn'], timezone: 'Eastern' },
  '913': { state: 'KS', stateName: 'Kansas', region: 'Northeast Kansas', primaryCities: ['Overland Park', 'Kansas City'], counties: ['Johnson', 'Wyandotte'], timezone: 'Central' },
  '914': { state: 'NY', stateName: 'New York', region: 'Westchester County', primaryCities: ['Yonkers', 'New Rochelle'], counties: ['Westchester'], timezone: 'Eastern' },
  '915': { state: 'TX', stateName: 'Texas', region: 'West Texas', primaryCities: ['El Paso'], counties: ['El Paso'], timezone: 'Mountain' },
  '916': { state: 'CA', stateName: 'California', region: 'Sacramento', primaryCities: ['Sacramento'], counties: ['Sacramento'], timezone: 'Pacific' },
  '917': { state: 'NY', stateName: 'New York', region: 'New York City', primaryCities: ['New York'], counties: ['New York', 'Bronx', 'Queens', 'Kings'], timezone: 'Eastern' },
  '918': { state: 'OK', stateName: 'Oklahoma', region: 'Eastern Oklahoma', primaryCities: ['Tulsa', 'Muskogee'], counties: ['Tulsa', 'Muskogee'], timezone: 'Central' },
  '919': { state: 'NC', stateName: 'North Carolina', region: 'East Central NC', primaryCities: ['Raleigh', 'Durham'], counties: ['Wake', 'Durham'], timezone: 'Eastern' },
  '920': { state: 'WI', stateName: 'Wisconsin', region: 'Northeast Wisconsin', primaryCities: ['Green Bay', 'Appleton'], counties: ['Brown', 'Outagamie'], timezone: 'Central' },
  '925': { state: 'CA', stateName: 'California', region: 'East Bay', primaryCities: ['Concord', 'Antioch'], counties: ['Contra Costa'], timezone: 'Pacific' },
  '928': { state: 'AZ', stateName: 'Arizona', region: 'Northern Arizona', primaryCities: ['Flagstaff', 'Yuma'], counties: ['Coconino', 'Yuma'], timezone: 'Mountain' },
  '929': { state: 'NY', stateName: 'New York', region: 'New York City', primaryCities: ['Queens', 'Brooklyn'], counties: ['Queens', 'Kings'], timezone: 'Eastern' },
  '931': { state: 'TN', stateName: 'Tennessee', region: 'South Central Tennessee', primaryCities: ['Clarksville', 'Cookeville'], counties: ['Montgomery', 'Putnam'], timezone: 'Central' },
  '934': { state: 'NY', stateName: 'New York', region: 'Long Island', primaryCities: ['Hempstead'], counties: ['Nassau'], timezone: 'Eastern' },
  '936': { state: 'TX', stateName: 'Texas', region: 'East Texas', primaryCities: ['Huntsville', 'Conroe'], counties: ['Walker', 'Montgomery'], timezone: 'Central' },
  '937': { state: 'OH', stateName: 'Ohio', region: 'Southwest Ohio', primaryCities: ['Dayton', 'Springfield'], counties: ['Montgomery', 'Clark'], timezone: 'Eastern' },
  '940': { state: 'TX', stateName: 'Texas', region: 'North Central Texas', primaryCities: ['Wichita Falls', 'Denton'], counties: ['Wichita', 'Denton'], timezone: 'Central' },
  '941': { state: 'FL', stateName: 'Florida', region: 'Southwest Florida', primaryCities: ['Sarasota', 'Bradenton'], counties: ['Sarasota', 'Manatee'], timezone: 'Eastern' },
  '947': { state: 'MI', stateName: 'Michigan', region: 'Oakland County', primaryCities: ['Troy', 'Pontiac'], counties: ['Oakland'], timezone: 'Eastern' },
  '949': { state: 'CA', stateName: 'California', region: 'South Orange County', primaryCities: ['Irvine', 'Mission Viejo'], counties: ['Orange'], timezone: 'Pacific' },
  '951': { state: 'CA', stateName: 'California', region: 'Riverside County', primaryCities: ['Riverside', 'Corona'], counties: ['Riverside'], timezone: 'Pacific' },
  '952': { state: 'MN', stateName: 'Minnesota', region: 'Minneapolis Suburbs', primaryCities: ['Bloomington', 'Eden Prairie'], counties: ['Hennepin', 'Dakota'], timezone: 'Central' },
  '954': { state: 'FL', stateName: 'Florida', region: 'Broward County', primaryCities: ['Fort Lauderdale', 'Hollywood'], counties: ['Broward'], timezone: 'Eastern' },
  '956': { state: 'TX', stateName: 'Texas', region: 'South Texas', primaryCities: ['Laredo', 'McAllen'], counties: ['Webb', 'Hidalgo'], timezone: 'Central' },
  '959': { state: 'CT', stateName: 'Connecticut', region: 'Connecticut', primaryCities: ['Hartford', 'Waterbury'], counties: ['Hartford', 'New Haven'], timezone: 'Eastern' },
  '970': { state: 'CO', stateName: 'Colorado', region: 'Northern Colorado', primaryCities: ['Fort Collins', 'Grand Junction'], counties: ['Larimer', 'Mesa'], timezone: 'Mountain' },
  '971': { state: 'OR', stateName: 'Oregon', region: 'Portland Metro', primaryCities: ['Portland', 'Beaverton'], counties: ['Washington', 'Multnomah'], timezone: 'Pacific' },
  '972': { state: 'TX', stateName: 'Texas', region: 'Dallas Suburbs', primaryCities: ['Plano', 'Irving'], counties: ['Collin', 'Dallas'], timezone: 'Central' },
  '973': { state: 'NJ', stateName: 'New Jersey', region: 'North Central New Jersey', primaryCities: ['Newark', 'Paterson'], counties: ['Essex', 'Passaic'], timezone: 'Eastern' },
  '978': { state: 'MA', stateName: 'Massachusetts', region: 'North Central Massachusetts', primaryCities: ['Lowell', 'Lawrence'], counties: ['Middlesex', 'Essex'], timezone: 'Eastern' },
  '979': { state: 'TX', stateName: 'Texas', region: 'East Central Texas', primaryCities: ['College Station', 'Bay City'], counties: ['Brazos', 'Matagorda'], timezone: 'Central' },
  '980': { state: 'NC', stateName: 'North Carolina', region: 'South Central NC', primaryCities: ['Charlotte'], counties: ['Mecklenburg'], timezone: 'Eastern' },
  '984': { state: 'NC', stateName: 'North Carolina', region: 'East Central NC', primaryCities: ['Raleigh', 'Cary'], counties: ['Wake'], timezone: 'Eastern' },
  '985': { state: 'LA', stateName: 'Louisiana', region: 'Southeast Louisiana', primaryCities: ['Houma', 'Hammond'], counties: ['Terrebonne', 'Tangipahoa'], timezone: 'Central' },
  '989': { state: 'MI', stateName: 'Michigan', region: 'Central Michigan', primaryCities: ['Saginaw', 'Bay City'], counties: ['Saginaw', 'Bay'], timezone: 'Eastern' }
};

// Phone line type detection patterns
const LINE_TYPE_PATTERNS = {
  'toll-free': ['800', '888', '877', '866', '855', '844', '833', '822', '880', '881', '882', '883', '884', '885', '886', '887', '889'],
  'premium': ['900', '976'],
  'canadian': ['403', '587', '780', '825', '204', '431', '506', '709', '902', '782'],
  'pager': [], // Obsolete
  'voip': [] // Requires carrier lookup
};

// Carrier database (simplified - in production would use comprehensive database)
const CARRIER_DATABASE: Record<string, CarrierInfo> = {
  // Major wireless carriers
  'verizon': { name: 'Verizon Wireless', type: 'wireless', coverage: ['nationwide'] },
  'att': { name: 'AT&T Mobility', type: 'wireless', coverage: ['nationwide'] },
  'tmobile': { name: 'T-Mobile USA', type: 'wireless', coverage: ['nationwide'] },
  'sprint': { name: 'Sprint Corporation', type: 'wireless', coverage: ['nationwide'] },
  'uscellular': { name: 'U.S. Cellular', type: 'wireless', coverage: ['regional'] },
  
  // VoIP providers
  'google': { name: 'Google Voice', type: 'voip', coverage: ['nationwide'] },
  'skype': { name: 'Skype', type: 'voip', coverage: ['international'] },
  'vonage': { name: 'Vonage', type: 'voip', coverage: ['nationwide'] },
  'magicjack': { name: 'MagicJack', type: 'voip', coverage: ['nationwide'] },
  
  // Regional/Local carriers
  'frontier': { name: 'Frontier Communications', type: 'landline', coverage: ['regional'] },
  'centurylink': { name: 'CenturyLink', type: 'landline', coverage: ['regional'] },
  'windstream': { name: 'Windstream', type: 'landline', coverage: ['regional'] }
};

/**
 * Analyze phone number for comprehensive intelligence
 */
export function analyzePhoneNumber(phoneNumber: string, context?: {
  searchName?: string;
  searchLocation?: string;
  knownNumbers?: string[];
}): PhoneIntelligence {
  // Normalize phone number
  const digits = phoneNumber.replace(/\D/g, '');
  let normalizedNumber = digits;
  
  // Handle various formats
  if (digits.length === 11 && digits.startsWith('1')) {
    normalizedNumber = digits.substring(1);
  } else if (digits.length !== 10) {
    return createInvalidPhoneIntelligence(phoneNumber);
  }
  
  const areaCode = normalizedNumber.substring(0, 3);
  const exchange = normalizedNumber.substring(3, 6);
  const lineNumber = normalizedNumber.substring(6);
  const formattedNumber = `(${areaCode}) ${exchange}-${lineNumber}`;
  
  // Get geographic information
  const region = getGeographicRegion(areaCode);
  
  // Determine line type
  const lineType = determineLineType(areaCode, exchange);
  
  // Calculate confidence score
  const confidence = calculatePhoneConfidence(areaCode, exchange, region, context);
  
  // Identify risk factors
  const riskFactors = identifyPhoneRiskFactors(areaCode, exchange, lineType);
  
  // Find related numbers (if context provided)
  const relatedNumbers = findRelatedNumbers(normalizedNumber, context?.knownNumbers);
  
  return {
    number: formattedNumber,
    areaCode,
    exchange,
    lineNumber,
    region,
    lineType,
    confidence,
    riskFactors,
    relatedNumbers
  };
}

function createInvalidPhoneIntelligence(phoneNumber: string): PhoneIntelligence {
  return {
    number: phoneNumber,
    areaCode: '',
    exchange: '',
    lineNumber: '',
    region: {
      state: '',
      stateName: 'Unknown',
      region: 'Invalid Number',
      primaryCities: [],
      counties: [],
      timezone: 'Unknown'
    },
    lineType: 'unknown',
    confidence: 0,
    riskFactors: ['Invalid phone number format'],
    relatedNumbers: []
  };
}

function getGeographicRegion(areaCode: string): GeographicRegion {
  const data = AREA_CODE_DATABASE[areaCode];
  
  if (!data) {
    return {
      state: '',
      stateName: 'Unknown',
      region: 'Unknown Area Code',
      primaryCities: [],
      counties: [],
      timezone: 'Unknown'
    };
  }
  
  return {
    state: data.state,
    stateName: data.stateName,
    region: data.region,
    primaryCities: data.primaryCities,
    counties: data.counties,
    timezone: data.timezone
  };
}

function determineLineType(areaCode: string, exchange: string): PhoneIntelligence['lineType'] {
  // Check toll-free numbers
  if (LINE_TYPE_PATTERNS['toll-free'].includes(areaCode)) {
    return 'toll-free';
  }
  
  // Check premium numbers
  if (LINE_TYPE_PATTERNS['premium'].includes(areaCode)) {
    return 'premium';
  }
  
  // Basic mobile vs landline heuristics (limited without carrier database)
  // This is simplified - real-world would require comprehensive carrier lookup
  const exchangeNum = parseInt(exchange);
  
  // Some patterns that suggest mobile (very simplified)
  if (exchangeNum >= 200 && exchangeNum <= 999) {
    // Could be either - would need carrier lookup
    return 'unknown';
  }
  
  return 'unknown';
}

function calculatePhoneConfidence(
  areaCode: string, 
  exchange: string, 
  region: GeographicRegion,
  context?: {
    searchName?: string;
    searchLocation?: string;
    knownNumbers?: string[];
  }
): number {
  let confidence = 30; // Base confidence for valid format
  
  // Valid area code boosts confidence
  if (AREA_CODE_DATABASE[areaCode]) {
    confidence += 25;
  }
  
  // Valid exchange (not starting with 0 or 1)
  if (exchange[0] !== '0' && exchange[0] !== '1') {
    confidence += 15;
  }
  
  // Geographic correlation with search context
  if (context?.searchLocation && region.state) {
    const searchLower = context.searchLocation.toLowerCase();
    
    // State match
    if (searchLower.includes(region.state.toLowerCase()) || 
        searchLower.includes(region.stateName.toLowerCase())) {
      confidence += 20;
    }
    
    // City match
    const cityMatch = region.primaryCities.some(city => 
      searchLower.includes(city.toLowerCase())
    );
    if (cityMatch) {
      confidence += 15;
    }
    
    // County match
    const countyMatch = region.counties.some(county => 
      searchLower.includes(county.toLowerCase())
    );
    if (countyMatch) {
      confidence += 10;
    }
  }
  
  // Not toll-free or premium
  if (!LINE_TYPE_PATTERNS['toll-free'].includes(areaCode) && 
      !LINE_TYPE_PATTERNS['premium'].includes(areaCode)) {
    confidence += 10;
  }
  
  return Math.min(confidence, 100);
}

function identifyPhoneRiskFactors(areaCode: string, exchange: string, lineType: PhoneIntelligence['lineType']): string[] {
  const riskFactors: string[] = [];
  
  // Toll-free numbers in skip tracing context
  if (lineType === 'toll-free') {
    riskFactors.push('Toll-free number (business/service line)');
  }
  
  // Premium numbers
  if (lineType === 'premium') {
    riskFactors.push('Premium rate number (potential scam)');
  }
  
  // Unknown area code
  if (!AREA_CODE_DATABASE[areaCode]) {
    riskFactors.push('Unknown or invalid area code');
  }
  
  // Sequential patterns in exchange or line number (potential fake)
  if (isSequentialPattern(exchange)) {
    riskFactors.push('Sequential exchange pattern (potentially fake)');
  }
  
  // All same digits (potential test/fake number)
  if (new Set(exchange).size === 1 || new Set(exchange).size === 1) {
    riskFactors.push('Repetitive digit pattern (potentially fake)');
  }
  
  // Common "fake" exchanges
  const fakeExchanges = ['555', '000', '111', '999'];
  if (fakeExchanges.includes(exchange)) {
    riskFactors.push('Common fake/test exchange');
  }
  
  return riskFactors;
}

function isSequentialPattern(digits: string): boolean {
  if (digits.length < 3) return false;
  
  for (let i = 1; i < digits.length; i++) {
    const current = parseInt(digits[i]);
    const previous = parseInt(digits[i - 1]);
    
    if (current !== previous + 1) {
      return false;
    }
  }
  
  return true;
}

function findRelatedNumbers(phoneNumber: string, knownNumbers?: string[]): string[] {
  if (!knownNumbers || knownNumbers.length === 0) {
    return [];
  }
  
  const related: string[] = [];
  const areaCode = phoneNumber.substring(0, 3);
  const exchange = phoneNumber.substring(3, 6);
  
  knownNumbers.forEach(known => {
    const knownDigits = known.replace(/\D/g, '');
    if (knownDigits.length === 10 || (knownDigits.length === 11 && knownDigits.startsWith('1'))) {
      const normalizedKnown = knownDigits.length === 11 ? knownDigits.substring(1) : knownDigits;
      
      if (normalizedKnown !== phoneNumber) {
        const knownAreaCode = normalizedKnown.substring(0, 3);
        const knownExchange = normalizedKnown.substring(3, 6);
        
        // Same area code
        if (knownAreaCode === areaCode) {
          related.push(`(${knownAreaCode}) ${knownExchange}-${normalizedKnown.substring(6)}`);
        }
        // Same exchange (very close numbers)
        else if (knownAreaCode === areaCode && knownExchange === exchange) {
          related.push(`(${knownAreaCode}) ${knownExchange}-${normalizedKnown.substring(6)}`);
        }
      }
    }
  });
  
  return related;
}

/**
 * Batch analyze multiple phone numbers for relationship analysis
 */
export function analyzePhoneNumberBatch(
  phoneNumbers: string[],
  context?: {
    searchName?: string;
    searchLocation?: string;
  }
): PhoneIntelligence[] {
  const results = phoneNumbers.map(phone => 
    analyzePhoneNumber(phone, { ...context, knownNumbers: phoneNumbers })
  );
  
  // Cross-reference for additional insights
  results.forEach(result => {
    if (result.confidence > 0) {
      // Boost confidence for numbers in same region
      const sameRegionCount = results.filter(r => 
        r.region.state === result.region.state && r.number !== result.number
      ).length;
      
      if (sameRegionCount > 0) {
        result.confidence = Math.min(100, result.confidence + (sameRegionCount * 5));
      }
    }
  });
  
  return results;
}

/**
 * Generate skip tracing recommendations based on phone intelligence
 */
export function generatePhoneSkipTracingRecommendations(intelligence: PhoneIntelligence[]): string[] {
  const recommendations: string[] = [];
  
  intelligence.forEach(phone => {
    if (phone.confidence < 30) {
      recommendations.push(`Low confidence phone number ${phone.number} - verify through additional sources`);
    }
    
    if (phone.riskFactors.length > 0) {
      recommendations.push(`${phone.number} has risk factors: ${phone.riskFactors.join(', ')}`);
    }
    
    if (phone.region.state && phone.region.primaryCities.length > 0) {
      recommendations.push(`${phone.number} is associated with ${phone.region.region}, ${phone.region.state} - check records in ${phone.region.primaryCities.join(', ')}`);
    }
    
    if (phone.relatedNumbers && phone.relatedNumbers.length > 0) {
      recommendations.push(`${phone.number} has related numbers: ${phone.relatedNumbers.join(', ')} - investigate connections`);
    }
  });
  
  return recommendations;
}