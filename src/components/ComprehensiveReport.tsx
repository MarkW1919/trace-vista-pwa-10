import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Shield,
  Eye,
  Download,
  Share,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database
} from 'lucide-react';
import { SearchResult, BaseEntity } from '@/types/entities';
import { SupabaseSearchService } from '@/services/supabaseSearchService';
import { useToast } from '@/hooks/use-toast';

interface ComprehensiveReportProps {
  searchResult: SearchResult;
  sessionId?: string;
  onClose?: () => void;
}

interface ReportData {
  entities: BaseEntity[];
  results: SearchResult[];
  summary: {
    totalResults: number;
    highConfidenceResults: number;
    entitiesExtracted: number;
    sourcesCount: number;
  };
  subject: {
    name: string;
    lastKnownLocation: string;
    searchDate: Date;
  };
}

const getEntityIcon = (type: string) => {
  switch (type) {
    case 'phone': return <Phone className="h-4 w-4" />;
    case 'email': return <Mail className="h-4 w-4" />;
    case 'address': return <MapPin className="h-4 w-4" />;
    case 'name': return <User className="h-4 w-4" />;
    default: return <CheckCircle className="h-4 w-4" />;
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (confidence >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (confidence >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

export const ComprehensiveReport: React.FC<ComprehensiveReportProps> = ({ 
  searchResult, 
  sessionId,
  onClose 
}) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadReportData();
  }, [sessionId]);

  const loadReportData = async () => {
    if (!sessionId) {
      // If no session ID, create report from single result
      setReportData({
        entities: searchResult.extractedEntities || [],
        results: [searchResult],
        summary: {
          totalResults: 1,
          highConfidenceResults: searchResult.confidence > 60 ? 1 : 0,
          entitiesExtracted: searchResult.extractedEntities?.length || 0,
          sourcesCount: 1
        },
        subject: {
          name: searchResult.value || 'Unknown',
          lastKnownLocation: 'Unknown',
          searchDate: searchResult.timestamp || new Date()
        }
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch complete session data
      const [sessionResults, sessionEntities] = await Promise.all([
        SupabaseSearchService.getSessionResults(sessionId),
        SupabaseSearchService.getSessionEntities(sessionId)
      ]);

      if (!sessionResults.success) {
        throw new Error(sessionResults.error || 'Failed to load session results');
      }

      // Process and compile the report data
      const results = sessionResults.results;
      const entities = sessionEntities.success ? sessionEntities.entities : [];
      
      const highConfidenceResults = results.filter(r => r.confidence > 60).length;
      const uniqueSources = new Set(results.map(r => r.source)).size;

      // Extract subject information from search results
      const names = entities.filter(e => e.type === 'name').map(e => e.value);
      const addresses = entities.filter(e => e.type === 'address').map(e => e.value);
      
      const subjectName = names.length > 0 ? names[0] : searchResult.value || 'Unknown';
      const lastKnownLocation = addresses.length > 0 ? addresses[0] : 'Unknown';

      setReportData({
        entities,
        results,
        summary: {
          totalResults: results.length,
          highConfidenceResults,
          entitiesExtracted: entities.length,
          sourcesCount: uniqueSources
        },
        subject: {
          name: subjectName,
          lastKnownLocation,
          searchDate: new Date()
        }
      });

    } catch (error) {
      console.error('Error loading report data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load report data');
      toast({
        title: "Report Loading Failed",
        description: "Unable to load comprehensive report data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const groupEntitiesByType = (entities: BaseEntity[]) => {
    const grouped: Record<string, BaseEntity[]> = {};
    entities.forEach(entity => {
      if (!grouped[entity.type]) {
        grouped[entity.type] = [];
      }
      grouped[entity.type].push(entity);
    });
    return grouped;
  };

  const exportReport = () => {
    toast({
      title: "Export Feature",
      description: "Report export functionality will be available soon.",
      variant: "default",
    });
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 animate-pulse" />
            <CardTitle>Loading Comprehensive Report...</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={45} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Compiling search results and analyzing extracted entities...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !reportData) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Report Generation Failed</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {error || 'Unable to generate comprehensive report'}
          </p>
          <div className="flex gap-2">
            <Button onClick={loadReportData} variant="outline">
              Retry
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="ghost">
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedEntities = groupEntitiesByType(reportData.entities);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <div>
                <CardTitle className="text-xl">Comprehensive Report</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generated on {reportData.subject.searchDate.toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportReport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              {onClose && (
                <Button onClick={onClose} variant="ghost" size="sm">
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Subject Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Subject Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-lg">{reportData.subject.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Last Known Location</p>
              <p className="text-lg">{reportData.subject.lastKnownLocation}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Search Date</p>
              <p className="text-lg">{reportData.subject.searchDate.toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{reportData.summary.totalResults}</p>
                <p className="text-xs text-muted-foreground">Total Results</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{reportData.summary.highConfidenceResults}</p>
                <p className="text-xs text-muted-foreground">High Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{reportData.summary.entitiesExtracted}</p>
                <p className="text-xs text-muted-foreground">Entities Found</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{reportData.summary.sourcesCount}</p>
                <p className="text-xs text-muted-foreground">Sources Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="entities" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="entities">Extracted Entities</TabsTrigger>
          <TabsTrigger value="results">Search Results</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="entities" className="space-y-4">
          {Object.keys(groupedEntities).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedEntities).map(([type, entities]) => (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      {getEntityIcon(type)}
                      {type}s Found ({entities.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {entities.map((entity, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${getConfidenceColor(entity.confidence)}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-sm">{entity.value}</span>
                            <Badge variant="outline" className="text-xs">
                              {entity.confidence}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Source: {entity.source}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Entities Extracted</h3>
                <p className="text-muted-foreground">
                  No specific entities were extracted from the search results.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="space-y-4">
            {reportData.results.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-2 mb-2">
                        {result.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge 
                          variant="outline" 
                          className={getConfidenceColor(result.confidence)}
                        >
                          {result.confidence}% confidence
                        </Badge>
                        <span>•</span>
                        <span>{result.source}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {result.snippet}
                  </p>
                  {result.extractedEntities && result.extractedEntities.length > 0 && (
                    <div className="space-y-2">
                      <Separator />
                      <div className="flex flex-wrap gap-1 pt-2">
                        {result.extractedEntities.slice(0, 4).map((entity: BaseEntity, entityIndex) => (
                          <Badge key={entityIndex} variant="secondary" className="text-xs">
                            {entity.type}: {entity.value}
                          </Badge>
                        ))}
                        {result.extractedEntities.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{result.extractedEntities.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Confidence Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>High Confidence (80%+)</span>
                      <span>{reportData.results.filter(r => r.confidence >= 80).length} results</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Medium Confidence (60-79%)</span>
                      <span>{reportData.results.filter(r => r.confidence >= 60 && r.confidence < 80).length} results</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Low Confidence (&lt;60%)</span>
                      <span>{reportData.results.filter(r => r.confidence < 60).length} results</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Cross-verify high-confidence results through multiple sources</li>
                    <li>• Focus on results with extracted contact information</li>
                    <li>• Consider geographic proximity when validating addresses</li>
                    <li>• Use phone numbers and emails for direct contact verification</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};