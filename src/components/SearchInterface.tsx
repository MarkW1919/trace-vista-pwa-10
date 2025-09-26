import React, { useState } from 'react';
import { Search, Loader2, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSearch, SearchResult } from '@/hooks/useSearch';

const EntityBadge: React.FC<{ entity: { type: string; value: string; confidence: number } }> = ({ entity }) => {
  const getEntityColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'phone': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'name': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'address': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'age': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Badge variant="secondary" className={`text-xs ${getEntityColor(entity.type)}`}>
      {entity.type}: {entity.value} ({Math.round(entity.confidence * 100)}%)
    </Badge>
  );
};

const ResultCard: React.FC<{ result: SearchResult; index: number }> = ({ result, index }) => {
  return (
    <Card className="mb-4">
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
              {Math.round(result.confidence * 100)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      {result.entities && result.entities.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Extracted Data ({result.entities.length} items):
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
  );
};

export const SearchInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const { results, isSearching, error, lastResponse, search, clearResults } = useSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      search(query.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (error) {
      // Clear error when user starts typing
      clearResults();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            OSINT Search
          </CardTitle>
          <CardDescription>
            Search across multiple intelligence sources for comprehensive results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter name, email, phone, or other identifying information..."
              value={query}
              onChange={handleInputChange}
              disabled={isSearching}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={isSearching || !query.trim()}
              className="flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search
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
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Search Summary */}
      {lastResponse && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Search Results Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">{lastResponse.totalResults}</div>
                <div className="text-sm text-muted-foreground">Total Results</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">{lastResponse.summary.totalEntities}</div>
                <div className="text-sm text-muted-foreground">Entities Found</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">
                  {lastResponse.summary.serpapi + lastResponse.summary.hunter + lastResponse.summary.scraperapi}
                </div>
                <div className="text-sm text-muted-foreground">API Sources</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-orange-600">${lastResponse.totalCost.toFixed(4)}</div>
                <div className="text-sm text-muted-foreground">Search Cost</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span>SerpAPI: {lastResponse.summary.serpapi} results</span>
                <span>Hunter.io: {lastResponse.summary.hunter} results</span>
                <span>ScraperAPI: {lastResponse.summary.scraperapi} results</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Search Results ({results.length})</h2>
            <Button variant="outline" onClick={clearResults} size="sm">
              Clear Results
            </Button>
          </div>
          
          {results.map((result, index) => (
            <ResultCard key={result.id} result={result} index={index} />
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
              Try different search terms or check if the APIs are properly configured.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Success State for No Search */}
      {!isSearching && !error && !lastResponse && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready to Search</h3>
            <p className="text-muted-foreground">
              Enter a search query above to begin your OSINT investigation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};