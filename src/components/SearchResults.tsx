import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Phone, Mail, MapPin, User, Search, TrendingUp, FileText } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  entities?: Entity[];
}

interface Entity {
  type: 'phone' | 'email' | 'address' | 'name';
  value: string;
  confidence: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  onViewReport?: (result: SearchResult) => void;
}

const entityIcons = {
  phone: Phone,
  email: Mail,
  address: MapPin,
  name: User,
};

const entityColors = {
  phone: 'bg-blue-100 text-blue-800',
  email: 'bg-green-100 text-green-800',
  address: 'bg-purple-100 text-purple-800',
  name: 'bg-orange-100 text-orange-800',
};

export const SearchResults = ({ results, isLoading, onViewReport }: SearchResultsProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 w-3/4 rounded bg-muted"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 w-full rounded bg-muted mb-2"></div>
              <div className="h-3 w-2/3 rounded bg-muted"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="border-primary/20">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="text-muted-foreground">
            <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Results Found</p>
            <p className="text-sm">
              This could mean the subject has minimal public presence or try adjusting search parameters.
            </p>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>Pro Tips:</strong></p>
            <ul className="text-left max-w-md mx-auto space-y-1">
              <li>• Try different name variations or nicknames</li>
              <li>• Add location information for better targeting</li>
              <li>• Use Enhanced mode with ScraperAPI for deeper results</li>
              <li>• Check if the subject has limited digital footprint</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{results.length} Results Found</span>
        </div>
        <Badge variant="outline" className="text-xs">
          Live API Data
        </Badge>
      </div>
      
      {results.map((result) => (
        <Card key={result.id} className="transition-all hover:shadow-md border-primary/10 hover:border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base line-clamp-2 leading-snug">
                {result.title}
              </CardTitle>
              <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {result.source}
                </Badge>
                {(result as any).confidence && (
                  <Badge 
                    variant={(result as any).confidence >= 70 ? "default" : "outline"} 
                    className="text-xs"
                  >
                    {(result as any).confidence}% match
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
              {result.snippet}
            </p>
            
            {result.entities && result.entities.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-muted/30 border">
                <h4 className="text-xs font-semibold mb-2 text-primary flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  Extracted Intelligence ({result.entities.length} items):
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.entities.map((entity, idx) => {
                    const Icon = entityIcons[entity.type];
                    const confidence = Math.round(entity.confidence * 100);
                    return (
                      <div
                        key={idx}
                        className={`inline-flex items-center space-x-1 rounded-full px-3 py-1 text-xs font-medium ${entityColors[entity.type]} border`}
                      >
                        <Icon className="h-3 w-3" />
                        <span className="max-w-[120px] truncate">{entity.value}</span>
                        <span className="opacity-75 font-normal">({confidence}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Verify Source</span>
              </a>
              
              <div className="flex items-center space-x-2">
                {onViewReport && (
                  <Button
                    onClick={() => onViewReport(result)}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View Report
                  </Button>
                )}
                {(result as any).relevanceScore && (
                  <div className="text-xs text-muted-foreground">
                    Relevance: {Math.round((result as any).relevanceScore)}%
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground">
          🔍 Results from live API searches • Always verify information accuracy • Respect privacy laws
        </p>
      </div>
    </div>
  );
};