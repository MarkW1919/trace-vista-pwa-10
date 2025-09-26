import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  Shield, 
  Zap, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Status = 'active' | 'error' | 'inactive' | 'configured' | 'not_configured';

interface SystemStatus {
  authentication: {
    status: Status;
    isAuthenticated: boolean;
    userEmail?: string;
    message?: string;
  };
  database: {
    status: Status;
    searchSessions: number;
    searchResults: number;
    extractedEntities: number;
    message?: string;
  };
  apis: {
    serpapi: Status;
    hunter: Status;
    scraperapi: Status;
  };
  costs: {
    totalSpent: number;
    thisMonth: number;
  };
}

const StatusIcon: React.FC<{ status: Status }> = ({ status }) => {
  if (status === 'active' || status === 'configured') return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
  return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
};

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const getVariant = () => {
    if (status === 'active' || status === 'configured') return 'default';
    if (status === 'error') return 'destructive';
    return 'secondary';
  };

  const getText = () => {
    switch (status) {
      case 'active': return 'Active';
      case 'configured': return 'Configured';
      case 'error': return 'Error';
      case 'inactive': return 'Inactive';
      case 'not_configured': return 'Not Configured';
      default: return 'Unknown';
    }
  };

  return <Badge variant={getVariant()}>{getText()}</Badge>;
};

export const SystemHealth: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const checkSystemStatus = async () => {
    setIsLoading(true);
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      const authStatus = {
        status: (authError ? 'error' : (session ? 'active' : 'inactive')) as Status,
        isAuthenticated: !!session,
        userEmail: session?.user?.email,
        message: authError?.message
      };

      let dbStatus = {
        status: 'active' as Status,
        searchSessions: 0,
        searchResults: 0,
        extractedEntities: 0,
        message: undefined as string | undefined
      };

      try {
        const [sessionsResult, resultsResult, entitiesResult] = await Promise.all([
          supabase.from('search_sessions').select('id', { count: 'exact' }),
          supabase.from('search_results').select('id', { count: 'exact' }),
          supabase.from('extracted_entities').select('id', { count: 'exact' })
        ]);

        dbStatus.searchSessions = sessionsResult.count || 0;
        dbStatus.searchResults = resultsResult.count || 0;
        dbStatus.extractedEntities = entitiesResult.count || 0;

        if (sessionsResult.error || resultsResult.error || entitiesResult.error) {
          dbStatus.status = 'error';
          dbStatus.message = 'Database query errors detected';
        }
      } catch (dbError) {
        dbStatus.status = 'error';
        dbStatus.message = 'Database connection failed';
      }

      const apiStatus = {
        serpapi: 'not_configured' as Status,
        hunter: 'not_configured' as Status,
        scraperapi: 'not_configured' as Status
      };

      let costStatus = { totalSpent: 0, thisMonth: 0 };

      const newStatus: SystemStatus = {
        authentication: authStatus,
        database: dbStatus,
        apis: apiStatus,
        costs: costStatus
      };

      setStatus(newStatus);

    } catch (error) {
      console.error('System status check failed:', error);
      toast({
        title: "Status Check Failed",
        description: "Failed to check system status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSystemStatus();
  }, []);

  if (isLoading || !status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Authentication Status */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Authentication Status
          </h4>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <StatusIcon status={status.authentication.status} />
              <div>
                <p className="font-medium text-sm">Session Status</p>
                <p className="text-xs text-muted-foreground">
                  {status.authentication.userEmail || 'Not authenticated'}
                </p>
              </div>
            </div>
            <StatusBadge status={status.authentication.status} />
          </div>
        </div>

        {/* Database Status */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database Statistics
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg border">
              <div className="text-lg font-bold text-primary">{status.database.searchSessions}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <div className="text-lg font-bold text-blue-600">{status.database.searchResults}</div>
              <div className="text-xs text-muted-foreground">Results</div>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <div className="text-lg font-bold text-green-600">{status.database.extractedEntities}</div>
              <div className="text-xs text-muted-foreground">Entities</div>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            API Integrations
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">SerpAPI</p>
                <p className="text-xs text-muted-foreground">Google Search</p>
              </div>
              <StatusBadge status={status.apis.serpapi} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Hunter.io</p>
                <p className="text-xs text-muted-foreground">Email Discovery</p>
              </div>
              <StatusBadge status={status.apis.hunter} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">ScraperAPI</p>
                <p className="text-xs text-muted-foreground">Web Scraping</p>
              </div>
              <StatusBadge status={status.apis.scraperapi} />
            </div>
          </div>
        </div>

        <Button variant="outline" onClick={checkSystemStatus} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
};