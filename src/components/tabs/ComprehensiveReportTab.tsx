import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ClipboardList, Download, FileText, TrendingUp, Users, 
  MapPin, Phone, Mail, AlertTriangle, CheckCircle, Calendar, BookOpen, ExternalLink 
} from 'lucide-react';
import { useSkipTracing } from '@/contexts/SkipTracingContext';
import { useToast } from '@/hooks/use-toast';
import { calculateAccuracyMetrics, calculateConfidenceInterval } from '@/utils/scoring';
import { ApiSearchService } from '@/services/apiSearchService';
import { SearchResult } from '@/types/entities';

export const ComprehensiveReportTab = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAutomatedSearch, setUseAutomatedSearch] = useState(false);
  const [reportCost, setReportCost] = useState(0);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const { state, dispatch } = useSkipTracing();
  const { toast } = useToast();

  const reportMetrics = useMemo(() => {
    const resultsToUse = state.filteredResult ? [state.filteredResult] : state.compiledResults;
    const entitiesToUse = state.filteredResult?.extractedEntities || state.entities;
    
    if (resultsToUse.length === 0) return null;
    
    const metrics = calculateAccuracyMetrics(resultsToUse, entitiesToUse);
    const confidenceScores = resultsToUse.map(r => r.confidence);
    const confidenceInterval = calculateConfidenceInterval(confidenceScores);
    
    return { ...metrics, confidenceInterval };
  }, [state.compiledResults, state.entities, state.filteredResult]);

  const generateReport = async () => {
    const resultsToUse = state.filteredResult ? [state.filteredResult] : state.compiledResults;
    const entitiesToUse = state.filteredResult?.extractedEntities || state.entities;
    
    if (resultsToUse.length === 0) {
      toast({
        title: "No Data Available",
        description: "Please perform some searches first to generate a report",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportTitle = state.filteredResult 
        ? `Detailed Report - ${state.filteredResult.title}`
        : 'Comprehensive Search Report';
      
      dispatch({
        type: 'GENERATE_REPORT',
        payload: {
          subject: {
            name: state.filteredResult?.title || 'Search Subject',
            lastKnownLocation: 'Various Locations',
            searchDate: new Date(),
          },
          timeline: generateTimeline(),
          accuracy: {
            overallConfidence: reportMetrics?.overallConfidence || 0,
            crossVerified: entitiesToUse.filter(e => e.verified).length,
            flaggedInconsistencies: [],
          },
        },
      });
      
      toast({
        title: "Report Generated",
        description: state.filteredResult 
          ? "Detailed result report has been compiled"
          : "Comprehensive skip tracing report has been compiled",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTimeline = () => {
    // Generate timeline from search history
    return state.searchHistory.map((search, index) => ({
      date: new Date(Date.now() - (state.searchHistory.length - index) * 60000).toISOString().split('T')[0],
      event: search,
      source: 'Search History',
      confidence: 90,
    }));
  };

  const exportToCSV = () => {
    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `skip_tracing_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV Downloaded",
      description: "Report has been exported to CSV format",
      variant: "default",
    });
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(state.report, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `skip_tracing_report_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "JSON Downloaded",
      description: "Report has been exported to JSON format",
      variant: "default",
    });
  };

  const generateCSVContent = () => {
    const headers = ['Type', 'Value', 'Confidence', 'Source', 'Verified', 'Timestamp'];
    const rows = state.entities.map(entity => [
      entity.type,
      entity.value,
      entity.confidence,
      entity.source,
      entity.verified ? 'Yes' : 'No',
      entity.timestamp.toISOString(),
    ]);
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  const clearAllData = () => {
    dispatch({ type: 'CLEAR_ALL' });
    toast({
      title: "Data Cleared",
      description: "All search results and reports have been cleared",
      variant: "default",
    });
  };

  const getEntityTypeStats = () => {
    const stats: { [key: string]: number } = {};
    state.entities.forEach(entity => {
      stats[entity.type] = (stats[entity.type] || 0) + 1;
    });
    return stats;
  };

  const entityStats = getEntityTypeStats();

  return (
    <div className="space-y-6">
      <Card className="border-success/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ClipboardList className="h-5 w-5 text-success" />
              <span>{state.filteredResult ? 'Detailed Result Report' : 'Comprehensive Skip Tracing Report'}</span>
              {state.filteredResult && (
                <Badge variant="secondary" className="text-xs">
                  Individual Result
                </Badge>
              )}
              {useAutomatedSearch && reportCost > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Cost: ${reportCost.toFixed(3)}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {state.filteredResult && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => dispatch({ type: 'SET_FILTERED_REPORT', payload: null })}
                >
                  View All Results
                </Button>
              )}
              <Button 
                onClick={generateReport} 
                disabled={isGenerating || (state.filteredResult ? !state.filteredResult : state.compiledResults.length === 0)}
                size="sm"
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button variant="outline" size="sm" onClick={clearAllData}>
                Clear All
              </Button>
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {state.filteredResult 
              ? `Detailed analysis for: ${state.filteredResult.title}`
              : 'Compile and analyze all search results with accuracy metrics and export capabilities'
            }
            {useAutomatedSearch && " • API-powered automated analysis enabled"}
          </p>
        </CardHeader>
        
        {/* Automated Analysis Toggle */}
        <CardContent className="pb-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium">Enhanced Analysis</span>
                {useAutomatedSearch && (
                  <Badge variant="default" className="text-xs">Active</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Use AI-powered analysis for deeper insights and cross-referencing
                {reportCost > 0 && ` • Analysis cost: $${reportCost.toFixed(3)}`}
              </p>
            </div>
            <Button
              variant={useAutomatedSearch ? "default" : "outline"}
              size="sm"
              onClick={() => setUseAutomatedSearch(!useAutomatedSearch)}
            >
              {useAutomatedSearch ? "Enhanced" : "Basic"}
            </Button>
          </div>
        </CardContent>
        
        {isGenerating && (
          <CardContent>
            <Progress value={66} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {useAutomatedSearch ? "Performing enhanced AI analysis..." : "Analyzing data and generating insights..."}
            </p>
          </CardContent>
        )}
      </Card>

      {reportMetrics && (
        <div className="grid gap-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Results</p>
                    <p className="text-2xl font-bold">{reportMetrics.totalResults}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">High Confidence</p>
                    <p className="text-2xl font-bold text-success">{reportMetrics.highConfidenceResults}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Entities Found</p>
                    <p className="text-2xl font-bold text-primary">{reportMetrics.verifiedEntities}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data Quality</p>
                    <p className="text-2xl font-bold text-accent">{reportMetrics.dataQualityScore}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Accuracy Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <span>Accuracy Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Overall Confidence</h4>
                  <div className="flex items-center space-x-2">
                    <Progress value={reportMetrics.overallConfidence} className="flex-1" />
                    <Badge variant={reportMetrics.overallConfidence >= 70 ? "default" : "secondary"}>
                      {reportMetrics.overallConfidence}%
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Completeness Score</h4>
                  <div className="flex items-center space-x-2">
                    <Progress value={reportMetrics.completeness} className="flex-1" />
                    <Badge variant={reportMetrics.completeness >= 70 ? "default" : "secondary"}>
                      {reportMetrics.completeness}%
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Confidence Interval</h4>
                  <p className="text-sm text-muted-foreground">
                    {reportMetrics.confidenceInterval.lower}% - {reportMetrics.confidenceInterval.upper}%
                  </p>
                  <p className="text-xs text-muted-foreground">95% confidence level</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entity Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Entity Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(entityStats).map(([type, count]) => {
                  const getIcon = () => {
                    switch (type) {
                      case 'phone': return Phone;
                      case 'email': return Mail;
                      case 'address': return MapPin;
                      case 'name': return Users;
                      default: return FileText;
                    }
                  };
                  const Icon = getIcon();
                  
                  return (
                    <div key={type} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium capitalize">{type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">{count} found</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Search Timeline */}
          {state.searchHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span>Search Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {state.searchHistory.slice(-5).map((search, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm">{search}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(Date.now() - (state.searchHistory.length - index) * 60000).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5 text-accent" />
                <span>Export Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={exportToCSV} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={exportToJSON} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
                <Button variant="outline" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF (Pro)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                CSV includes all entities with confidence scores. JSON includes full report structure.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {(state.filteredResult || state.compiledResults.length === 0) && !reportMetrics && (
        <Card className="border-muted">
          <CardContent className="pt-6 text-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {state.filteredResult ? 'Result Details' : 'No Data Available'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {state.filteredResult 
                ? `Showing detailed analysis for: ${state.filteredResult.title}`
                : 'Perform searches in other tabs to generate comprehensive reports'
              }
            </p>
            {!state.filteredResult && (
              <p className="text-sm text-muted-foreground">
                Try: Deep Search → Enhanced Pro → Phone Validation → Email OSINT → Public Records
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-warning/20 bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-warning-foreground">Educational OSINT Report - Reality Check</h4>
              <p className="text-sm text-warning-foreground/80">
                This educational tool demonstrates real OSINT limitations. Professional investigations require 
                manual verification, specialized databases ($$$), legal compliance, and advanced techniques. 
                Free automated searches have severe limitations and should not be relied upon for actual investigations.
              </p>
              <div className="mt-3 text-xs text-warning-foreground/70 space-y-1">
                <p>• Professional OSINT: 2-8 hours per subject, $50-200+ per comprehensive report</p>
                <p>• Success depends on subject's digital footprint and privacy settings</p>
                <p>• Always verify information through multiple independent sources</p>
                <p>• Ensure compliance with applicable privacy laws and ethical guidelines</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <BookOpen className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-primary-foreground">Continue Learning OSINT</h4>
              <p className="text-sm text-primary-foreground/80 mt-1 mb-3">
                Explore professional OSINT resources and methodologies:
              </p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://www.sans.org/white-papers/36707/', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  SANS OSINT Guide
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://osintframework.com/', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  OSINT Framework
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};