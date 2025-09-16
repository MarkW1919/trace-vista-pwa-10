import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  History, Search, Calendar, DollarSign, 
  ExternalLink, Trash2, Eye, AlertCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SupabaseSearchService } from '@/services/supabaseSearchService';

interface SearchSession {
  id: string;
  search_mode: string;
  search_params: any;
  status: string;
  total_results: number;
  total_cost: number;
  created_at: string;
  completed_at: string;
}

export const SearchHistory = () => {
  const [sessions, setSessions] = useState<SearchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const authenticated = await SupabaseSearchService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const result = await SupabaseSearchService.getSearchHistory(20);
        if (result.success) {
          setSessions(result.sessions || []);
        }
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const result = await SupabaseSearchService.deleteSession(sessionId);
      if (result.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        toast({
          title: "Session Deleted",
          description: "Search session and all related data have been removed",
          variant: "default",
        });
      } else {
        throw new Error('Failed to delete session');
      }
    } catch (error) {
      toast({
        title: "Delete Failed", 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <span>Search History</span>
            <Badge variant="secondary">Login Required</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Sign in to view your search history, track costs, and manage previous sessions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-primary" />
            <span>Search History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-primary" />
            <span>Search History</span>
            <Badge variant="outline">{sessions.length} sessions</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={loadSearchHistory}>
            Refresh
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your recent OSINT searches with results and cost tracking
        </p>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <Alert>
            <Search className="h-4 w-4" />
            <AlertTitle>No Search History</AlertTitle>
            <AlertDescription>
              Your search sessions will appear here after you perform automated searches.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {session.search_params?.name || 'Unknown Subject'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {session.search_mode}
                    </Badge>
                    <Badge 
                      variant={session.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {session.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSession(session.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {formatDate(session.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {session.total_results || 0} results
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      ${(session.total_cost || 0).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    ID: {session.id.slice(-8)}...
                  </div>
                </div>

                {session.search_params && (
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <strong>Search Parameters:</strong>{' '}
                    {Object.entries(session.search_params)
                      .filter(([_, value]) => value)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(', ') || 'No parameters recorded'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};