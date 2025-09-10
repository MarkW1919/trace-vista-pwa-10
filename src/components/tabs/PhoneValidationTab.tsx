import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, CheckCircle, XCircle, MapPin, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhoneValidationResult {
  isValid: boolean;
  formattedNumber: string;
  country: string;
  countryCode: string;
  region: string;
  carrier?: string;
  lineType: 'mobile' | 'landline' | 'voip' | 'unknown';
  timezone?: string;
}

// Mock phone validation function
const validatePhone = async (phoneNumber: string): Promise<PhoneValidationResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Basic validation logic for demo
  const cleaned = phoneNumber.replace(/\D/g, '');
  const isValid = cleaned.length >= 10;
  
  if (!isValid) {
    throw new Error('Invalid phone number format');
  }
  
  // Mock data based on phone number patterns
  const countryData = {
    '1': { country: 'United States', code: 'US', region: 'North America' },
    '44': { country: 'United Kingdom', code: 'GB', region: 'Europe' },
    '49': { country: 'Germany', code: 'DE', region: 'Europe' },
    '33': { country: 'France', code: 'FR', region: 'Europe' }
  };
  
  const carriers = ['Verizon', 'AT&T', 'T-Mobile', 'Sprint', 'Regional Carrier'];
  const lineTypes: ('mobile' | 'landline' | 'voip')[] = ['mobile', 'landline', 'voip'];
  
  return {
    isValid: true,
    formattedNumber: `+1 (${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`,
    country: countryData['1'].country,
    countryCode: countryData['1'].code,
    region: countryData['1'].region,
    carrier: carriers[Math.floor(Math.random() * carriers.length)],
    lineType: lineTypes[Math.floor(Math.random() * lineTypes.length)],
    timezone: 'EST (UTC-5)'
  };
};

export const PhoneValidationTab = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [result, setResult] = useState<PhoneValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleValidate = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number to validate.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const validationResult = await validatePhone(phoneNumber);
      setResult(validationResult);
      toast({
        title: "Validation Complete",
        description: `Phone number is ${validationResult.isValid ? 'valid' : 'invalid'}.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Validation failed';
      setError(errorMessage);
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPhoneNumber('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Phone Number Validation</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Validate and analyze phone numbers to extract useful information like carrier, line type, 
          and geographic data. This is essential for verifying leads in skip tracing investigations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="mr-2 h-5 w-5" />
            Phone Number Input
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  className="pl-10"
                  placeholder="e.g., +1 555-123-4567 or 5551234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Supports various formats: +1-555-123-4567, (555) 123-4567, 555.123.4567, etc.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={handleValidate}
                disabled={isLoading || !phoneNumber.trim()}
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
                {isLoading ? 'Validating...' : 'Validate Number'}
              </Button>
              <Button 
                variant="outline"
                onClick={handleReset}
                disabled={!phoneNumber && !result && !error}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Analyzing phone number...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Validation Failed</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          <Card className={result.isValid ? 'border-success' : 'border-destructive'}>
            <CardHeader>
              <CardTitle className="flex items-center">
                {result.isValid ? (
                  <CheckCircle className="mr-2 h-5 w-5 text-success" />
                ) : (
                  <XCircle className="mr-2 h-5 w-5 text-destructive" />
                )}
                Validation Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      <Badge variant={result.isValid ? 'default' : 'destructive'}>
                        {result.isValid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Formatted Number</Label>
                    <p className="text-sm font-mono mt-1">{result.formattedNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Line Type</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="capitalize">
                        {result.lineType}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium flex items-center">
                      <MapPin className="mr-1 h-3 w-3" />
                      Geographic Info
                    </Label>
                    <p className="text-sm mt-1">{result.country} ({result.countryCode})</p>
                    <p className="text-sm text-muted-foreground">{result.region}</p>
                  </div>
                  {result.carrier && (
                    <div>
                      <Label className="text-sm font-medium flex items-center">
                        <Building className="mr-1 h-3 w-3" />
                        Carrier
                      </Label>
                      <p className="text-sm mt-1">{result.carrier}</p>
                    </div>
                  )}
                  {result.timezone && (
                    <div>
                      <Label className="text-sm font-medium">Timezone</Label>
                      <p className="text-sm mt-1">{result.timezone}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">Investigation Notes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Mobile numbers are often more current than landlines</li>
                <li>• VoIP numbers may indicate tech-savvy individuals</li>
                <li>• Carrier information can help narrow geographic regions</li>
                <li>• Port history (not shown) can reveal previous carriers</li>
                <li>• Always verify findings through multiple sources</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};