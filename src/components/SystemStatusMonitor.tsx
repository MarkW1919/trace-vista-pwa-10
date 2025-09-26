import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Clock, Database, Zap, Activity, Shield, User, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { validateSessionHealth } from '@/utils/authUtils';

interface SystemStatus {
  searchSessions: {
    total: number;
    processing: number;
    completed: number;
    failed: number;
  };
  searchResults: {
    total: number;
    withEntities: number;
  };
  extractedEntities: {
    total: number;
    byType: { [key: string]: number };
  };
  costTracking: {
    totalSpent: number;
    thisMonth: number;
    topServices: { service: string; cost: number }[];
  };
  authStatus: {
    isAuthenticated: boolean;
    sessionValid: boolean;
    userEmail?: string;
    error?: string;
  };
}

export const SystemStatusMonitor = () => {
  const { toast } = useToast();
  const auth = useAuth();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getScraperAPIStatus = () => {
    const scraperApiKey = localStorage.getItem('scraperapi_key');
    if (!scraperApiKey) return "secondary";
    
    // Check if key was validated successfully
    const validationResult = localStorage.getItem('scraperapi_validation');
    if (validationResult) {
      const result = JSON.parse(validationResult);
      return result.valid && result.hasCredits ? "default" : "destructive";
    }
    return "secondary";
  };

  const getScraperAPIStatusText = () => {
    const scraperApiKey = localStorage.getItem('scraperapi_key');
    if (!scraperApiKey) return "Not Configured";
    
    const validationResult = localStorage.getItem('scraperapi_validation');
    if (validationResult) {
      const result = JSON.parse(validationResult);
      if (result.valid && result.hasCredits) return "Active";
      if (result.valid && !result.hasCredits) return "No Credits";
      return "Invalid Key";
    }
    return "Needs Testing";
  };

  const loadSystemStatus = async () => {
    try {
      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();

      // Get search sessions data
      const { data: sessions, error: sessionsError } = await supabase
        .from('search_sessions')
        .select('status, total_cost, created_at');

      if (sessionsError) throw sessionsError;

      // Get search results data
      const { data: results, error: resultsError } = await supabase
        .from('search_results')
        .select('id, extracted_entities');

      if (resultsError) throw resultsError;

      // Get extracted entities data
      const { data: entities, error: entitiesError } = await supabase
        .from('extracted_entities')
        .select('entity_type');

      if (entitiesError) throw entitiesError;

      // Get cost tracking data
      const { data: costs, error: costsError } = await supabase
        .from('api_cost_tracking')
        .select('service_name, cost, created_at')
        .gte('created_at', monthStart);

      if (costsError) throw costsError;

      // Process data
      const sessionStats = sessions.reduce(
        (acc, session) => {
          acc.total++;
          acc[session.status]++;
          return acc;
        },
        { total: 0, processing: 0, completed: 0, failed: 0 }
      );

      const resultsWithEntities = results.filter(
        r => r.extracted_entities && 
        Array.isArray(r.extracted_entities) && 
        r.extracted_entities.length > 0
      ).length;

      const entityTypes = entities.reduce((acc, entity) => {
        acc[entity.entity_type] = (acc[entity.entity_type] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const totalSpent = sessions.reduce((sum, s) => sum + (s.total_cost || 0), 0);
      const monthlySpent = costs.reduce((sum, c) => sum + (c.cost || 0), 0);
      
      const serviceSpending = costs.reduce((acc, cost) => {
        acc[cost.service_name] = (acc[cost.service_name] || 0) + cost.cost;
        return acc;
      }, {} as { [key: string]: number });

      const topServices = Object.entries(serviceSpending)
        .map(([service, cost]) => ({ service, cost }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 3);

      // Check authentication status
      const authValidation = await validateSessionHealth();

      setStatus({
        searchSessions: sessionStats,
        searchResults: {
          total: results.length,
          withEntities: resultsWithEntities
        },
        extractedEntities: {
          total: entities.length,
          byType: entityTypes
        },
        costTracking: {
          totalSpent,
          thisMonth: monthlySpent,
          topServices
        },
        authStatus: {
          isAuthenticated: auth.isAuthenticated,
          sessionValid: auth.sessionValid,
          userEmail: auth.user?.email,
          error: authValidation.error
        }
      });
    } catch (error) {
      console.error('Error loading system status:', error);
      toast({
        title: "Error",
        description: "Failed to load system status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSystemStatus();
  };

  const fixStuckSessions = async () => {
    try {
      const { data: stuckSessions, error } = await supabase
        .from('search_sessions')
        .select('id, created_at')
        .eq('status', 'processing')
        .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // 10 minutes ago

      if (error) throw error;

      if (stuckSessions.length > 0) {
        toast({
          title: "Stuck Sessions Found",
          description: `Found ${stuckSessions.length} stuck sessions. These need manual review.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "No Stuck Sessions",
          description: "All sessions are in proper state"
        });
      }
    } catch (error) {
      console.error('Error checking stuck sessions:', error);
      toast({
        title: "Error",
        description: "Failed to check for stuck sessions",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadSystemStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Progress value={50} className="w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const getStatusIcon = (processing: number, failed: number) => {
    if (processing > 0) return <Clock className="h-4 w-4 text-yellow-500" />;
    if (failed > 0) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const entityExtractionRate = status.searchResults.total > 0 
    ? Math.round((status.extractedEntities.total / status.searchResults.total) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Skip Tracing System Status
            </CardTitle>
            <CardDescription>
              Real-time monitoring of search sessions, data extraction, and API costs
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fixStuckSessions}
            >
              Check Sessions
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Sessions Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
            {getStatusIcon(status.searchSessions.processing, status.searchSessions.failed)}
            <div>
              <p className="text-sm font-medium">Total Sessions</p>
              <p className="text-2xl font-bold">{status.searchSessions.total}</p>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">Completed</p>
            <p className="text-2xl font-bold text-green-600">{status.searchSessions.completed}</p>
          </div>

          {status.searchSessions.processing > 0 && (
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Processing</p>
              <p className="text-2xl font-bold text-yellow-600">{status.searchSessions.processing}</p>
            </div>
          )}

          {status.searchSessions.failed > 0 && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed</p>
              <p className="text-2xl font-bold text-red-600">{status.searchSessions.failed}</p>
            </div>
          )}
        </div>

        {/* Authentication Status */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Authentication Health
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg ${
              status.authStatus.isAuthenticated && status.authStatus.sessionValid
                ? 'bg-green-50 dark:bg-green-950/20'
                : 'bg-red-50 dark:bg-red-950/20'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {status.authStatus.isAuthenticated && status.authStatus.sessionValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <p className={`text-sm font-medium ${
                  status.authStatus.isAuthenticated && status.authStatus.sessionValid
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  Session Status
                </p>
              </div>
              <p className={`text-lg font-bold ${
                status.authStatus.isAuthenticated && status.authStatus.sessionValid
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {status.authStatus.sessionValid ? 'Valid' : 'Invalid'}
              </p>
              {status.authStatus.error && (
                <p className="text-xs text-red-600 mt-1">{status.authStatus.error}</p>
              )}
            </div>

            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4" />
                <p className="text-sm font-medium">User Status</p>
              </div>
              <p className="text-sm font-medium">
                {status.authStatus.userEmail || 'Not signed in'}
              </p>
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <div>Frontend: {status.authStatus.isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}</div>
                <div>Backend: {status.authStatus.sessionValid ? '✅ Valid session' : '❌ Invalid session'}</div>
              </div>
              {!status.authStatus.sessionValid && status.authStatus.isAuthenticated && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2 h-6 px-2 text-xs"
                  onClick={() => auth.refreshSession?.()}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Data Extraction Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Extraction Performance
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Search Results</span>
                <span className="font-medium">{status.searchResults.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Extracted Entities</span>
                <span className="font-medium">{status.extractedEntities.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Extraction Rate</span>
                <Badge variant={entityExtractionRate > 50 ? "default" : "destructive"}>
                  {entityExtractionRate}%
                </Badge>
              </div>
            </div>
            
            {entityExtractionRate < 10 && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ Low entity extraction rate. Check ScraperAPI integration.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Entity Types Found</h3>
            <div className="space-y-2">
              {Object.entries(status.extractedEntities.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="capitalize">{type}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              {Object.keys(status.extractedEntities.byType).length === 0 && (
                <p className="text-sm text-muted-foreground">No entities extracted yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Cost Tracking */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            API Cost Tracking
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Total Spent</p>
              <p className="text-xl font-bold">${status.costTracking.totalSpent.toFixed(4)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-sm font-medium">This Month</p>
              <p className="text-xl font-bold">${status.costTracking.thisMonth.toFixed(4)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Top Service</p>
              <p className="text-sm font-bold">
                {status.costTracking.topServices[0]?.service || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Health Indicators */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border">
          <h4 className="font-semibold mb-2">System Health</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Search Function</span>
              <Badge variant={status.searchSessions.total > 0 ? "default" : "secondary"}>
                {status.searchSessions.total > 0 ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Entity Extraction</span>
              <Badge variant={status.extractedEntities.total > 0 ? "default" : "destructive"}>
                {status.extractedEntities.total > 0 ? "Working" : "Not Working"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>ScraperAPI Integration</span>
              <Badge variant={getScraperAPIStatus()}>
                {getScraperAPIStatusText()}
              </Badge>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};