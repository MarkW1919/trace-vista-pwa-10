import { AlertCircle, Search, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LowResultsWarningProps {
  resultCount: number;
  suggestions?: string[];
}

export const LowResultsWarning = ({ resultCount, suggestions = [] }: LowResultsWarningProps) => {
  const defaultSuggestions = [
    "Add date of birth or age range",
    "Try name variations (nicknames, maiden names)",
    "Include additional location details",
    "Use broader search terms",
    "Check subject's public online presence",
    "Try state-specific databases manually"
  ];

  const allSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
    <Alert className="mb-4 border-warning/50 bg-warning/5">
      <AlertCircle className="h-4 w-4 text-warning" />
      <AlertDescription>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-warning" />
            <strong className="text-warning-foreground">
              Limited real results found ({resultCount} entries)
            </strong>
          </div>
          
          <div className="text-sm text-warning-foreground/90">
            <p className="mb-2">
              No mock data added. To improve results, try these refinements:
            </p>
            <ul className="space-y-1">
              {allSuggestions.slice(0, 4).map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <Plus className="mt-0.5 h-3 w-3 flex-shrink-0 text-warning" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <p className="text-xs text-warning-foreground/75">
            Real OSINT results depend on the subject's public data availability and privacy settings.
            This teaches real-world skip tracing limitations.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};