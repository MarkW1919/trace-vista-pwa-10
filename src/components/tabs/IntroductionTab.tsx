import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Users, Zap, BookOpen, Download } from 'lucide-react';

export const IntroductionTab = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
          Skip Tracing Educational Tool
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Learn OSINT (Open Source Intelligence) techniques through hands-on experience with ethical skip tracing methods
        </p>
        <Badge variant="outline" className="mt-4">
          <Download className="mr-1 h-3 w-3" />
          PWA Enabled - Install for offline access
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="mr-2 h-5 w-5 text-primary" />
              What is Skip Tracing?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Skip tracing is the process of locating a person's whereabouts using available information and OSINT techniques.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                Originally used by debt collectors and law enforcement
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                Now essential for cybersecurity and digital investigations
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                Demonstrates the importance of digital privacy
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5 text-accent" />
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2 text-accent">•</span>
                DuckDuckGo-powered web searches
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-accent">•</span>
                Social media profile discovery
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-accent">•</span>
                Phone number validation and analysis
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-accent">•</span>
                Network relationship visualization
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-accent">•</span>
                Progressive Web App capabilities
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-success" />
              Ethical Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2 text-success">•</span>
                Only use consented data for demonstrations
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-success">•</span>
                Respect privacy laws and regulations
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-success">•</span>
                Educational purposes only - no harassment
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-success">•</span>
                Demonstrate responsible disclosure practices
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-primary" />
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                Understand OSINT methodology and tools
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                Learn data correlation and analysis techniques
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                Practice ethical information gathering
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                Develop digital investigation skills
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-primary text-white">
        <CardContent className="pt-6">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 mb-4 opacity-90" />
            <h3 className="text-xl font-bold mb-2">Professional Tools Comparison</h3>
            <p className="text-sm opacity-90 mb-4">
              This educational tool demonstrates similar capabilities to professional platforms like Maltego, 
              Shodan, and commercial skip tracing services - but using free, open-source alternatives.
            </p>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <strong>Professional:</strong> Paid APIs, proprietary databases
              </div>
              <div>
                <strong>This Tool:</strong> Open source, educational focused
              </div>
              <div>
                <strong>Purpose:</strong> Learning and demonstration
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};