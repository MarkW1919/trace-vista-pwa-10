import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, ExternalLink, Shield, DollarSign, 
  Clock, AlertTriangle, CheckCircle, Users 
} from 'lucide-react';

export const RealOSINTGuide = () => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>Real OSINT Investigation Guide</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Professional OSINT Reality:</strong> This educational tool demonstrates 
            the limitations of free, automated searches. Real investigations require manual 
            analysis, specialized databases, and professional techniques.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>What This Tool Provides</span>
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Real, clickable search URLs</li>
              <li>• Educational OSINT techniques</li>
              <li>• Proper search methodology</li>
              <li>• Legal and ethical guidelines</li>
              <li>• Manual verification requirements</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span>Professional Requirements</span>
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Paid database subscriptions ($100s/month)</li>
              <li>• Specialized OSINT software</li>
              <li>• Legal compliance knowledge</li>
              <li>• Cross-source verification</li>
              <li>• Manual analysis expertise</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <Badge variant="outline" className="mb-1">Time Investment</Badge>
            <p className="text-xs text-muted-foreground">
              Professional searches: 2-8 hours per subject
            </p>
          </div>

          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <DollarSign className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <Badge variant="outline" className="mb-1">Cost Reality</Badge>
            <p className="text-xs text-muted-foreground">
              Premium databases: $50-200 per detailed report
            </p>
          </div>

          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <Badge variant="outline" className="mb-1">Success Rate</Badge>
            <p className="text-xs text-muted-foreground">
              Quality results: 30-70% depending on subject
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Next Steps for Real Investigation:</h4>
          <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
            <li>Click the generated search URLs above</li>
            <li>Manually analyze each source for relevant information</li>
            <li>Cross-reference findings across multiple platforms</li>
            <li>Document sources and confidence levels</li>
            <li>Consider professional databases for comprehensive results</li>
          </ol>
        </div>

        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <ExternalLink className="h-3 w-3" />
          <span>
            Learn more: <a href="https://www.sans.org/white-papers/36707/" 
            target="_blank" rel="noopener noreferrer" 
            className="text-primary hover:underline">
              SANS OSINT Guide
            </a>
          </span>
        </div>
      </CardContent>
    </Card>
  );
};