import { AlertTriangle, Shield, BookOpen } from 'lucide-react';

export const EthicalDisclaimer = () => {
  return (
    <div className="mb-8 rounded-lg border-l-4 border-warning bg-warning/5 p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-warning" />
        </div>
        <div className="flex-1">
          <h3 className="flex items-center text-lg font-semibold text-warning-foreground">
            <Shield className="mr-2 h-5 w-5" />
            Educational Use Only
          </h3>
          <div className="mt-3 space-y-3 text-sm text-warning-foreground/90">
            <p>
              This tool returns <strong>ONLY real public OSINT data</strong> for educational demonstrations.
              No mock or simulated data is generated. Requires explicit subject consent.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-start space-x-2">
                <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                <span>Use only with consented data for classroom demonstrations</span>
              </div>
              <div className="flex items-start space-x-2">
                <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                <span>Comply with all applicable laws and privacy standards</span>
              </div>
            </div>
            <p className="font-medium">
              ⚠️ Do NOT use for harassment, illegal surveillance, stalking, or any unethical purposes.
            </p>
            <p className="text-xs">
              Results are from real public sources only. Variable results teach real-world OSINT limitations 
              and the importance of subject consent and digital privacy awareness.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};