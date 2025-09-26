import React, { useState } from 'react';
import { useStreamingSearch } from './hooks/useStreamingSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SimpleSearchTest } from '@/components/SimpleSearchTest';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Streaming Search Demo Component
const StreamingSearchDemo = () => {
  const [query, setQuery] = useState('');
  const { results, isSearching, error, search, totalResults } = useStreamingSearch();

  const handleSearch = () => {
    const userId = 'demo-user-123'; // Replace with real auth user ID
    search(query, userId);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">🔍 OSINT Streaming Search</h1>
          <p className="text-muted-foreground">Real-time search across multiple APIs</p>
        </div>

        <Card className="p-6">
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Enter search query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="px-6"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg mb-4">
              {error}
            </div>
          )}

          {totalResults > 0 && (
            <div className="text-sm text-muted-foreground mb-4">
              Found {totalResults} results
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {results.map((result, i) => (
            <Card key={result.id || i} className="p-4">
              <div className="space-y-2">
                <a 
                  href={result.url || result.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-lg font-semibold text-primary hover:underline block"
                >
                  {result.title || 'Untitled Result'}
                </a>
                
                {result.snippet && (
                  <p className="text-sm text-muted-foreground">
                    {result.snippet}
                  </p>
                )}

                <div className="flex gap-2 text-xs">
                  <span className="bg-secondary px-2 py-1 rounded">
                    Confidence: {Math.round((result.confidence || 0) * 100)}%
                  </span>
                  {result.source && (
                    <span className="bg-secondary px-2 py-1 rounded">
                      Source: {result.source}
                    </span>
                  )}
                </div>

                {result.entities && result.entities.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Extracted Entities:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.entities.map((entity: any, idx: number) => (
                        <span 
                          key={idx} 
                          className="text-xs bg-accent px-2 py-1 rounded"
                        >
                          {entity.type}: {entity.value} ({Math.round(entity.confidence * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {isSearching && (
            <Card className="p-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Streaming results...</span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/simple-test" element={<SimpleSearchTest />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
