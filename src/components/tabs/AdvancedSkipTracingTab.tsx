import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, User, Home, Phone, Mail, Building, Car, FileText, Scale } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

export const AdvancedSkipTracingTab = () => {
  const [searchType, setSearchType] = useState<string>('name');
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SkipTracingResult | null>(null);
  const [progress, setProgress] = useState(0);
  
  const { toast } = useToast();

  const searchTypes = [
    { value: 'name', label: 'Full Name', placeholder: 'John Doe', icon: User },
    { value: 'phone', label: 'Phone Number', placeholder: '(555) 123-4567', icon: Phone },
    { value: 'email', label: 'Email Address', placeholder: 'example@domain.com', icon: Mail },
    { value: 'address', label: 'Address', placeholder: '123 Main St, City, State', icon: Home },
    { value: 'license_plate', label: 'License Plate', placeholder: 'ABC123', icon: Car },
  ];

  const validateInput = (type: string, value: string): boolean => {
    switch (type) {
      case 'name':
        return value.trim().length >= 2 && /^[a-zA-Z\s-']+$/.test(value);
      case 'phone':
        return /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(value.replace(/\s+/g, ''));
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'address':
        return value.trim().length >= 5;
      case 'license_plate':
        return /^[A-Za-z0-9]{2,8}$/.test(value.replace(/\s+/g, ''));
      default:
        return false;
    }
  };

  const handleSearch = async () => {
    if (!searchValue || !validateInput(searchType, searchValue)) {
      toast({
        title: "Invalid Input",
        description: `Please enter a valid ${searchTypes.find(t => t.value === searchType)?.label.toLowerCase()}`,
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setProgress(0);
    setResults(null);

    try {
      console.log('Starting advanced skip tracing:', searchType, searchValue);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 8, 90));
      }, 800);

      const query: SkipTracingQuery = {
        type: searchType as any,
        value: searchValue,
        additional_info: {}
      };

      const { data, error } = await supabase.functions.invoke('advanced-skiptracer', {
        body: { query, userId: 'demo-user' }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        throw new Error(`Skip tracing error: ${error.message}`);
      }

      console.log('Skip tracing response:', data);

      if (data && data.success && data.results) {
        setResults(data.results);
        toast({
          title: "Skip Tracing Complete",
          description: `Analysis completed with ${data.results.confidence_score}% confidence`,
          variant: data.results.confidence_score > 50 ? "default" : "destructive",
        });
      } else {
        throw new Error(data?.error || 'No results returned');
      }

    } catch (err: any) {
      console.error('Skip tracing error:', err);
      toast({
        title: "Search Error",
        description: err.message || "Failed to complete skip tracing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setSearchValue('');
    setResults(null);
    setProgress(0);
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 50) return 'secondary';
    return 'destructive';
  };

  const currentSearchType = searchTypes.find(t => t.value === searchType);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-primary" />
            <span>Advanced Skip Tracing</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive skip tracing using public records, digital footprints, and asset searches. 
            Powered by xillwillx/skiptracer methodology for professional investigations.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger>
                <SelectValue placeholder="Select search type" />
              </SelectTrigger>
              <SelectContent>
                {searchTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            <Input
              placeholder={currentSearchType?.placeholder || 'Enter search value'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchValue}
                className="bg-primary hover:bg-primary/90 flex-1"
              >
                {isSearching ? 'Tracing...' : 'Start Trace'}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={isSearching}>
                Reset
              </Button>
            </div>
          </div>

          {isSearching && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Searching public records and databases...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Skip Tracing Results</span>
                </span>
                <Badge variant={getConfidenceBadge(results.confidence_score)}>
                  {results.confidence_score}% confidence
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getConfidenceColor(results.confidence_score)}`}>
                    {results.confidence_score}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{results.personal_info.names.length}</div>
                  <div className="text-sm text-muted-foreground">Names Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{results.personal_info.addresses.length}</div>
                  <div className="text-sm text-muted-foreground">Addresses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{formatResponseTime(results.search_time)}</div>
                  <div className="text-sm text-muted-foreground">Search Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Names ({results.personal_info.names.length})</h4>
                  <div className="space-y-1">
                    {results.personal_info.names.map((name, index) => (
                      <Badge key={index} variant="outline" className="block w-fit">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Addresses ({results.personal_info.addresses.length})</h4>
                  <div className="space-y-1">
                    {results.personal_info.addresses.map((address, index) => (
                      <div key={index} className="text-sm p-2 bg-muted rounded">
                        {address}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Phone Numbers ({results.personal_info.phones.length})</h4>
                  <div className="space-y-1">
                    {results.personal_info.phones.map((phone, index) => (
                      <Badge key={index} variant="outline" className="block w-fit">
                        {phone}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Email Addresses ({results.personal_info.emails.length})</h4>
                  <div className="space-y-1">
                    {results.personal_info.emails.map((email, index) => (
                      <Badge key={index} variant="outline" className="block w-fit">
                        {email}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Public Records */}
          {(results.public_records.voter_registration || 
            results.public_records.property_records.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scale className="h-5 w-5 text-primary" />
                  <span>Public Records</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.public_records.voter_registration && (
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium mb-2">Voter Registration</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Party:</strong> {results.public_records.voter_registration.party}</div>
                        <div><strong>Status:</strong> {results.public_records.voter_registration.status}</div>
                      </div>
                    </div>
                  )}
                  
                  {results.public_records.property_records.map((property, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <h4 className="font-medium mb-2">Property Record</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Address:</strong> {property.address}</div>
                        <div><strong>Value:</strong> ${property.assessed_value?.toLocaleString()}</div>
                        <div><strong>Type:</strong> {property.property_type}</div>
                        <div><strong>Year Built:</strong> {property.year_built}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assets */}
          {results.assets.vehicles && results.assets.vehicles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-primary" />
                  <span>Assets</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.assets.vehicles.map((vehicle, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <h4 className="font-medium mb-2">Vehicle Record</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Make/Model:</strong> {vehicle.make} {vehicle.model}</div>
                        <div><strong>Year:</strong> {vehicle.year}</div>
                        <div><strong>State:</strong> {vehicle.registration_state}</div>
                        <div><strong>VIN:</strong> {vehicle.vin}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Digital Footprint */}
          {results.digital_footprint.social_media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-primary" />
                  <span>Digital Footprint</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <h4 className="font-medium mb-2">Social Media Presence</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {results.digital_footprint.social_media.map((platform, index) => (
                      <Badge key={index} variant="outline" className="justify-center">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card className="border-warning/20 bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Scale className="h-5 w-5 text-warning mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-warning-foreground">Legal & Ethical Notice</h4>
              <p className="text-sm text-warning-foreground/80">
                This skip tracing tool searches public records and databases for legitimate investigative purposes. 
                Ensure you have proper legal authorization and comply with all applicable privacy laws, FCRA regulations, 
                and jurisdictional requirements before conducting any investigation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};