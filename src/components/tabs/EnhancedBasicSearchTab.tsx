import React, { useState, useCallback } from 'react';
import { Search, Loader2, User, MapPin, Phone, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useSearch } from '@/hooks/useSearch';
import { useAuth } from '@/contexts/AuthContext';

interface SearchFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  age: string;
}

const EntityBadge: React.FC<{ entity: { type: string; value: string; confidence: number } }> = ({ entity }) => {
  const getIcon = () => {
    switch (entity.type) {
      case 'email': return <Mail className="h-3 w-3" />;
      case 'phone': return <Phone className="h-3 w-3" />;
      case 'name': return <User className="h-3 w-3" />;
      case 'address': return <MapPin className="h-3 w-3" />;
      default: return null;
    }
  };

  const getColor = () => {
    switch (entity.type) {
      case 'email': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'phone': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'name': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'address': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Badge variant="secondary" className={`text-xs flex items-center gap-1 ${getColor()}`}>
      {getIcon()}
      {entity.type}: {entity.value} ({Math.round(entity.confidence * 100)}%)
    </Badge>
  );
};

export const EnhancedBasicSearchTab: React.FC = () => {
  const [formData, setFormData] = useState<SearchFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    age: ''
  });

  const { user } = useAuth();
  const { results, isSearching, error, search, lastResponse } = useSearch();

  const handleInputChange = (field: keyof SearchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const buildSearchQuery = useCallback(() => {
    const parts: string[] = [];
    
    if (formData.firstName || formData.lastName) {
      parts.push(`${formData.firstName} ${formData.lastName}`.trim());
    }
    if (formData.email) parts.push(formData.email);
    if (formData.phone) parts.push(formData.phone);
    if (formData.city || formData.state) {
      parts.push(`${formData.city} ${formData.state}`.trim());
    }
    if (formData.age) parts.push(`age ${formData.age}`);
    
    return parts.filter(Boolean).join(' ');
  }, [formData]);

  const doSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const query = buildSearchQuery();
    if (!query.trim()) {
      return;
    }

    await search(query);
  };

  const isFormValid = buildSearchQuery().trim().length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Enhanced Pro Search - Maximum Accuracy
          </CardTitle>
          <CardDescription>
            Tier 2: Advanced comprehensive search using multiple specialized APIs (ScraperAPI, Hunter.io, SerpAPI) for maximum accuracy and depth. Includes people search databases and email intelligence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={doSearch} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="John"
                  disabled={isSearching}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Smith"
                  disabled={isSearching}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john.smith@example.com"
                  disabled={isSearching}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  disabled={isSearching}
                />
              </div>
            </div>

            {/* Location Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  City
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Oklahoma City"
                  disabled={isSearching}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="OK"
                  disabled={isSearching}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="35"
                  disabled={isSearching}
                />
              </div>
            </div>

            {/* Search Query Preview */}
            {buildSearchQuery() && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-sm font-medium">Search Query:</Label>
                <p className="text-sm text-muted-foreground mt-1">"{buildSearchQuery()}"</p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={!isFormValid || isSearching}
              className="w-full"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching Multiple Databases...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Begin Investigation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Results Summary */}
      {lastResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investigation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">{lastResponse.totalResults}</div>
                <div className="text-sm text-muted-foreground">Results Found</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">{lastResponse.summary.totalEntities}</div>
                <div className="text-sm text-muted-foreground">Data Points</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">
                  {lastResponse.summary.serpapi + lastResponse.summary.hunter + lastResponse.summary.scraperapi}
                </div>
                <div className="text-sm text-muted-foreground">Sources</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-orange-600">${lastResponse.totalCost.toFixed(4)}</div>
                <div className="text-sm text-muted-foreground">Cost</div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Sources: SerpAPI ({lastResponse.summary.serpapi}), Hunter.io ({lastResponse.summary.hunter}), ScraperAPI ({lastResponse.summary.scraperapi})
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Detailed Findings ({results.length})</h3>
          
          {results.map((result, index) => (
            <Card key={result.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base leading-tight">
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {result.title}
                      </a>
                    </CardTitle>
                    {result.snippet && (
                      <CardDescription className="mt-2 text-sm">
                        {result.snippet}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {result.source}
                    </Badge>
                    <Badge 
                      variant={result.confidence > 0.7 ? "default" : result.confidence > 0.5 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {Math.round(result.confidence * 100)}% match
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              {result.entities && result.entities.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Extracted Information ({result.entities.length} items):
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {result.entities.map((entity, idx) => (
                        <EntityBadge key={idx} entity={entity} />
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {!isSearching && !error && lastResponse && results.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Results Found</h3>
            <p className="text-muted-foreground">
              Try different search terms or verify the information is correct.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};