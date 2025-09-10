import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Phone, Mail, MapPin, User } from 'lucide-react';

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

export const SearchResults = ({ results, isLoading }: SearchResultsProps) => {
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
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No results found. Try adjusting your search terms.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.id} className="transition-all hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base line-clamp-2">
                {result.title}
              </CardTitle>
              <Badge variant="secondary" className="ml-2 flex-shrink-0">
                {result.source}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {result.snippet}
            </p>
            
            {result.entities && result.entities.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium mb-2">Extracted Entities:</h4>
                <div className="flex flex-wrap gap-2">
                  {result.entities.map((entity, idx) => {
                    const Icon = entityIcons[entity.type];
                    return (
                      <div
                        key={idx}
                        className={`inline-flex items-center space-x-1 rounded-full px-2 py-1 text-xs ${entityColors[entity.type]}`}
                      >
                        <Icon className="h-3 w-3" />
                        <span>{entity.value}</span>
                        <span className="opacity-70">({Math.round(entity.confidence * 100)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              <span>View Source</span>
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};