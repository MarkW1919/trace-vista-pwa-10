import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const TestSearchComponent = () => {
  const [searchQuery, setSearchQuery] = useState('John Smith Oklahoma');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const runTestSearch = async () => {
    setIsSearching(true);
    setProgress(10);
    setResults(null);
    
    try {
      console.log('🧪 Starting test search with query:', searchQuery);
      
      // Call the search-proxy edge function directly  
      const { data, error } = await supabase.functions.invoke('search-proxy', {
        body: {
          q: searchQuery,
          page: 1,
          user_id: '5d893671-c8a9-44ea-a05d-011852c9b2dc' // test user ID
        }
      });

      setProgress(50);

      if (error) {
        console.error('❌ Search function error:', error);
        throw new Error(`Search function failed: ${error.message}`);
      }

      setProgress(80);

      console.log('✅ Search completed successfully:', data);
      setResults(data);
      
      toast({
        title: "Test Search Complete",
        description: `Found ${data.results?.length || 0} results, filtered out ${data.filteredOutCount || 0}`,
      });

      setProgress(100);
      
    } catch (error) {
      console.error('💥 Test search failed:', error);
      toast({
        title: "Test Search Failed", 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Search Flow Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter test search query..."
            disabled={isSearching}
          />
          <Button onClick={runTestSearch} disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? 'Testing...' : 'Run Test'}
          </Button>
        </div>

        {isSearching && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Testing search flow phases...
            </p>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Session ID:</strong> {results.sessionId}
              </div>
              <div>
                <strong>Success:</strong> {results.success ? '✅' : '❌'}
              </div>
              <div>
                <strong>Results Found:</strong> {results.results?.length || 0}
              </div>
              <div>
                <strong>Filtered Out:</strong> {results.filteredOutCount || 0}
              </div>
              <div>
                <strong>Total Cost:</strong> ${results.totalCost || 0}
              </div>
              <div>
                <strong>Raw Results:</strong> {results.rawResults?.length || 0}
              </div>
            </div>

            {results.results && results.results.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Sample Results:</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {results.results.slice(0, 3).map((result: any, idx: number) => (
                    <div key={idx} className="p-2 bg-muted rounded text-xs">
                      <div><strong>Title:</strong> {result.title}</div>
                      <div><strong>URL:</strong> {result.url}</div>
                      <div><strong>Source:</strong> {result.source}</div>
                      <div><strong>Hash:</strong> {result.result_hash}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <strong>Error:</strong> {results.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};