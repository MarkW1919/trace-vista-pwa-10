import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const SimpleSearchTest = () => {
  const [query, setQuery] = useState('John Smith Oklahoma');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSimpleSearch = async () => {
    setIsSearching(true);
    setResult(null);
    
    try {
      console.log('🚀 Starting simple search test:', query);
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session found');
      }
      
      console.log('👤 User ID:', session.user.id);
      
      const sessionId = crypto.randomUUID();
      console.log('🆔 Session ID:', sessionId);
      
      const payload = {
        q: query,
        userId: session.user.id,
        sessionId: sessionId
      };
      
      console.log('📤 Sending payload:', payload);
      
      const { data, error } = await supabase.functions.invoke('search-proxy', {
        body: payload
      });
      
      console.log('📥 Response:', { data, error });
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      setResult(data);
      toast({
        title: "Search Complete",
        description: `Found ${data?.totalResults || 0} results`,
      });
      
    } catch (error) {
      console.error('❌ Search failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({ error: errorMessage });
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🔍 Simple Search Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query..."
            disabled={isSearching}
          />
          <Button onClick={handleSimpleSearch} disabled={isSearching || !query.trim()}>
            {isSearching ? 'Searching...' : 'Test Search'}
          </Button>
        </div>

        {result && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Response:</h4>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};