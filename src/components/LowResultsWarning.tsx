import { AlertCircle, Search, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LowResultsWarningProps {
  resultCount: number;
  suggestions?: string[];
}

export const LowResultsWarning = ({ resultCount, suggestions = [] }: LowResultsWarningProps) => {
  const defaultSuggestions = [
    "Requires premium OSINT database access for comprehensive results",
    "Professional skip tracers use licensed data sources",
    "Try direct contact with relevant government offices",
    "Verify subject consent and check privacy law limitations",
    "Consider hiring licensed investigative services",
    "Free OSINT has inherent limitations - this is realistic"
  ];

  const allSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
    <Alert className="mb-4 border-warning/50 bg-warning/10">
      <AlertCircle className="h-4 w-4 text-warning" />
      <AlertDescription>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-primary" />
            <strong className="text-foreground">
              Limited real results found ({resultCount} entries)
            </strong>
          </div>
          
          <div className="text-sm text-foreground/80">
            <p className="mb-2">
              Real OSINT limitations - no mock data generated. To improve results:
            </p>
            <ul className="space-y-1">
              {allSuggestions.slice(0, 4).map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <Plus className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Real OSINT results demonstrate actual limitations of free public data sources. 
            Professional skip tracing requires paid databases and proper legal authorization.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};