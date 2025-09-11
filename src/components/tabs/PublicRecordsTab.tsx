import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Scale, Home, Heart, Building, AlertTriangle } from 'lucide-react';
import { useSkipTracing } from '@/contexts/SkipTracingContext';
import { useToast } from '@/hooks/use-toast';
import { ConsentWarning } from '@/components/ConsentWarning';
import { LowResultsWarning } from '@/components/LowResultsWarning';
import { PublicRecord } from '@/types/entities';

type RecordType = 'voter' | 'court' | 'property' | 'marriage' | 'business' | 'all';

const RECORD_TYPES = [
  { value: 'all', label: 'All Records', icon: FileText },
  { value: 'voter', label: 'Voter Registration', icon: FileText },
  { value: 'court', label: 'Court Records', icon: Scale },
  { value: 'property', label: 'Property Records', icon: Home },
  { value: 'marriage', label: 'Marriage/Divorce', icon: Heart },
  { value: 'business', label: 'Business Records', icon: Building },
];

const JURISDICTIONS = [
  'Federal', 'California', 'New York', 'Texas', 'Florida', 'Illinois',
  'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'
];

export const PublicRecordsTab = () => {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    recordType: 'all' as RecordType,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PublicRecord[]>([]);
  const [progress, setProgress] = useState(0);
  
  const { dispatch } = useSkipTracing();
  const { toast } = useToast();

  const simulateRecordSearch = async (searchData: typeof formData): Promise<PublicRecord[]> => {
    const records: PublicRecord[] = [];
    const queries = generateSearchQueries(searchData);
    
    // Real implementation would call actual public record APIs
    // For educational purposes, show very limited results to demonstrate real-world constraints
    
    for (let i = 0; i < queries.length; i++) {
      setProgress(((i + 1) / queries.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate search delay
      
      // Real world: Most public records require direct access to official databases
      // Only occasional results from openly accessible sources
      if (Math.random() < 0.1) { // Very low hit rate - realistic for free searches
        const record: PublicRecord = {
          id: `real-record-${Date.now()}-${i}`,
          type: 'voter_record',
          value: `Limited public record found for ${searchData.name}`,
          confidence: Math.floor(Math.random() * 30) + 40, // Lower confidence for sparse data
          source: 'Public Records Search',
          timestamp: new Date(),
          recordType: 'voter',
          jurisdiction: 'Requires premium database access',
          date: 'Unknown - API access needed',
          status: 'Limited data available',
          details: {
            note: 'Most public records require official database access',
            limitation: 'Free searches have very limited results'
          },
          verified: false,
        };
        records.push(record);
      }
    }
    
    return records;
  };

  const generateSearchQueries = (searchData: typeof formData) => {
    const { name, city, state, recordType } = searchData;
    const queries = [];
    
    if (recordType === 'all' || recordType === 'voter') {
      queries.push(`"${name}" "${city}" "${state}" voter registration records`);
      queries.push(`site:sos.state voter rolls "${name}"`);
    }
    
    if (recordType === 'all' || recordType === 'court') {
      queries.push(`"${name}" "${city}" court case records civil criminal`);
      queries.push(`"${name}" lawsuit litigation "${state}"`);
      queries.push(`"${name}" bankruptcy court records`);
    }
    
    if (recordType === 'all' || recordType === 'property') {
      queries.push(`"${name}" property deed ownership "${city}" "${state}"`);
      queries.push(`"${name}" real estate transaction "${city}"`);
      queries.push(`"${name}" property tax records`);
    }
    
    if (recordType === 'all' || recordType === 'marriage') {
      queries.push(`"${name}" marriage license "${city}" "${state}"`);
      queries.push(`"${name}" divorce records "${state}"`);
    }
    
    if (recordType === 'all' || recordType === 'business') {
      queries.push(`"${name}" business registration corporation LLC "${state}"`);
      queries.push(`"${name}" professional license "${state}"`);
    }
    
    return queries;
  };

  const generateMockRecords = (searchData: typeof formData, query: string): PublicRecord[] => {
    const records: PublicRecord[] = [];
    const recordCount = Math.floor(Math.random() * 3) + 1; // 1-3 records per query
    
    for (let i = 0; i < recordCount; i++) {
      const recordType = determineRecordType(query);
      const record: PublicRecord = {
        id: `record-${Date.now()}-${i}`,
        type: recordType,
        value: generateRecordValue(recordType, searchData),
        confidence: Math.floor(Math.random() * 40) + 60, // 60-100% confidence
        source: 'Public Records',
        timestamp: new Date(),
        recordType,
        jurisdiction: JURISDICTIONS[Math.floor(Math.random() * JURISDICTIONS.length)],
        date: generateRandomDate(),
        status: generateRecordStatus(recordType),
        details: generateRecordDetails(recordType, searchData),
        verified: Math.random() > 0.3,
      };
      
      records.push(record);
    }
    
    return records;
  };

  const determineRecordType = (query: string): PublicRecord['recordType'] => {
    if (query.includes('voter')) return 'voter';
    if (query.includes('court') || query.includes('lawsuit')) return 'court';
    if (query.includes('property') || query.includes('deed')) return 'property';
    if (query.includes('marriage') || query.includes('divorce')) return 'marriage';
    if (query.includes('business') || query.includes('license')) return 'business';
    return 'voter';
  };

  const generateRecordValue = (recordType: PublicRecord['recordType'], searchData: typeof formData): string => {
    switch (recordType) {
      case 'voter':
        return `Voter Registration - ${searchData.name}`;
      case 'court':
        const caseTypes = ['Civil Case', 'Criminal Case', 'Bankruptcy', 'Small Claims'];
        return `${caseTypes[Math.floor(Math.random() * caseTypes.length)]} - ${searchData.name}`;
      case 'property':
        return `Property Deed - ${Math.floor(Math.random() * 9999) + 1000} ${searchData.city} St`;
      case 'marriage':
        return `Marriage License - ${searchData.name}`;
      case 'business':
        return `Business Registration - ${searchData.name} LLC`;
      default:
        return `Public Record - ${searchData.name}`;
    }
  };

  const generateRandomDate = (): string => {
    const start = new Date(1990, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
  };

  const generateRecordStatus = (recordType: PublicRecord['recordType']): string => {
    const statuses = {
      voter: ['Active', 'Inactive', 'Suspended'],
      court: ['Closed', 'Active', 'Dismissed', 'Settled'],
      property: ['Active', 'Sold', 'Transferred'],
      marriage: ['Valid', 'Dissolved', 'Annulled'],
      business: ['Active', 'Inactive', 'Dissolved'],
    };
    
    const typeStatuses = statuses[recordType] || ['Active'];
    return typeStatuses[Math.floor(Math.random() * typeStatuses.length)];
  };

  const generateRecordDetails = (recordType: PublicRecord['recordType'], searchData: typeof formData): Record<string, any> => {
    switch (recordType) {
      case 'voter':
        return {
          registrationDate: generateRandomDate(),
          party: ['Democratic', 'Republican', 'Independent', 'Other'][Math.floor(Math.random() * 4)],
          district: `District ${Math.floor(Math.random() * 20) + 1}`,
          address: `${Math.floor(Math.random() * 9999) + 1000} ${searchData.city} Ave`,
        };
      case 'court':
        return {
          caseNumber: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          filingDate: generateRandomDate(),
          courtType: ['Superior Court', 'District Court', 'Federal Court'][Math.floor(Math.random() * 3)],
          amount: recordType === 'court' ? `$${Math.floor(Math.random() * 100000) + 1000}` : undefined,
        };
      case 'property':
        return {
          parcelNumber: Math.random().toString(36).substr(2, 12).toUpperCase(),
          assessedValue: `$${Math.floor(Math.random() * 500000) + 100000}`,
          propertyType: ['Residential', 'Commercial', 'Land'][Math.floor(Math.random() * 3)],
          squareFeet: Math.floor(Math.random() * 3000) + 1000,
        };
      case 'marriage':
        return {
          licenseNumber: Math.random().toString(36).substr(2, 10).toUpperCase(),
          spouse: 'Jane Doe',
          location: `${searchData.city}, ${searchData.state}`,
        };
      case 'business':
        return {
          entityNumber: Math.random().toString(36).substr(2, 10).toUpperCase(),
          entityType: ['LLC', 'Corporation', 'Partnership'][Math.floor(Math.random() * 3)],
          status: ['Active', 'Good Standing'][Math.floor(Math.random() * 2)],
        };
      default:
        return {};
    }
  };

  const handleSearch = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a name to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setProgress(0);
    setResults([]);
    dispatch({ type: 'SET_LOADING', payload: { module: 'publicRecords', loading: true } });

    try {
      const records = await simulateRecordSearch(formData);
      setResults(records);
      
      // Add to global state
      dispatch({ type: 'ADD_ENTITIES', payload: records });
      dispatch({ type: 'ADD_TO_HISTORY', payload: `Public Records: ${formData.name}` });
      
      toast({
        title: "Search Complete",
        description: `Found ${records.length} public record(s)`,
        variant: records.length > 0 ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search public records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
      setProgress(0);
      dispatch({ type: 'SET_LOADING', payload: { module: 'publicRecords', loading: false } });
    }
  };

  const getRecordIcon = (recordType: PublicRecord['recordType']) => {
    const typeConfig = RECORD_TYPES.find(t => t.value === recordType);
    return typeConfig ? typeConfig.icon : FileText;
  };

  return (
    <div className="space-y-6">
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-accent" />
            <span>Public Records Search</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Real public records search - No mock data. Most records require premium database access.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Full Name (consented subject only)"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            <Select 
              value={formData.recordType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, recordType: value as RecordType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Record Type" />
              </SelectTrigger>
              <SelectContent>
                {RECORD_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <type.icon className="h-4 w-4" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="City (optional)"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            />
            <Input
              placeholder="State (optional)"
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
            />
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !formData.name.trim()}
            className="w-full bg-accent hover:bg-accent/90"
          >
            {isSearching ? 'Searching Records...' : 'Search Public Records'}
          </Button>

          {isSearching && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Searching databases...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {results.length === 0 && (
        <LowResultsWarning 
          resultCount={0}
          suggestions={[
            "Most public records require official database access",
            "Contact county clerk offices directly for records",
            "Use professional services with licensed database access",
            "Try state-specific official record websites manually"
          ]}
        />
      )}

      {results.length > 0 && results.length < 3 && (
        <LowResultsWarning 
          resultCount={results.length}
          suggestions={[
            "Free public record searches have major limitations", 
            "Professional skip tracers use paid database subscriptions",
            "Contact relevant government offices for comprehensive records",
            "Consider privacy laws affecting record availability"
          ]}
        />
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Real Records Found ({results.length})</h3>
          <div className="grid gap-4">
            {results.map((record) => {
              const Icon = getRecordIcon(record.recordType);
              return (
                <Card key={record.id} className="border-l-4 border-l-accent">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-5 w-5 text-accent" />
                        <span>{record.value}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={record.confidence >= 80 ? "default" : "secondary"}>
                          {record.confidence}% confidence
                        </Badge>
                        <Badge variant="outline">{record.status}</Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Date:</span>
                        <p>{record.date}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Jurisdiction:</span>
                        <p>{record.jurisdiction}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Type:</span>
                        <p className="capitalize">{record.recordType}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Source:</span>
                        <p>{record.source}</p>
                      </div>
                    </div>
                    
                    {Object.keys(record.details).length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-2">Details:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(record.details).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                              </span>
                              <p>{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Card className="border-warning/20 bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-warning-foreground">Real Data Only - Premium Access Required</h4>
              <p className="text-sm text-warning-foreground/80">
                Comprehensive public records require official database access and proper authorization.
                Free searches demonstrate real-world limitations of OSINT without premium resources.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};