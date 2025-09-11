import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConsentWarningProps {
  variant?: 'default' | 'prominent';
}

export const ConsentWarning = ({ variant = 'default' }: ConsentWarningProps) => {
  if (variant === 'prominent') {
    return (
      <div className="mb-6 rounded-lg border-l-4 border-destructive bg-destructive/10 p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="flex items-center text-lg font-semibold text-foreground">
              <Shield className="mr-2 h-5 w-5 text-destructive" />
              Consent Required - Real Data Only
            </h3>
            <div className="mt-3 space-y-3 text-sm text-foreground/80">
              <p className="font-bold">
                ⚠️ By using this tool, you confirm the subject has provided explicit consent for this search.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>Use only consented data for educational demonstrations</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>All results are from real public sources - no mock data</span>
                </div>
              </div>
              <p className="text-xs">
                This tool returns ONLY real public OSINT data. Results may vary based on subject's public presence.
                Use fictional or self-data if unsure about consent.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Alert className="mb-4 border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertDescription className="text-foreground">
        <strong>Consent Reminder:</strong> Confirm subject consent before searching. Real data only - no simulations.
      </AlertDescription>
    </Alert>
  );
};