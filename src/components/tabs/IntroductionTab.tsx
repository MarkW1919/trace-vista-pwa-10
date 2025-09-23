import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Users, Zap, BookOpen, Download } from 'lucide-react';

export const IntroductionTab = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
          Professional Skip Tracing & OSINT Platform
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Industry-grade Open Source Intelligence (OSINT) and skip tracing platform using <strong>real APIs and live data</strong>. 
          Built for professionals, investigators, and researchers who need accurate, comprehensive results.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Badge variant="default" className="bg-gradient-primary text-white px-3 py-1">
            <Shield className="h-3 w-3 mr-1" />
            Real APIs Only
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            <Eye className="h-3 w-3 mr-1" />
            Professional Grade
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Zap className="h-3 w-3 mr-1" />
            Industry Methods
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Download className="h-3 w-3 mr-1" />
            PWA Enabled
          </Badge>
        </div>
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

        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5 text-primary" />
              Platform Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2 text-primary">🔥</span>
                <strong>Live API Integration:</strong> SerpAPI, ScraperAPI, Hunter.io with real-time results
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">🎯</span>
                <strong>Advanced Entity Extraction:</strong> AI-powered confidence scoring and verification
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">🔍</span>
                <strong>Professional Search Modes:</strong> Basic, Deep, Targeted, Enhanced with ScraperAPI
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">🛡️</span>
                <strong>Secure Architecture:</strong> Supabase Edge Functions eliminate CORS restrictions
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">📊</span>
                <strong>Comprehensive Analytics:</strong> Session tracking, cost monitoring, result persistence
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

      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">Professional-Grade Platform</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              This platform uses the same methodologies and APIs as professional skip tracing companies and OSINT investigators.
              Unlike educational simulations, all results are <strong>live data from real sources</strong>.
            </p>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div className="p-3 rounded-lg bg-background/50">
                <strong className="text-primary">Real APIs:</strong><br/>
                SerpAPI, ScraperAPI, Hunter.io integration
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <strong className="text-accent">Live Data:</strong><br/>
                No simulations, mock data, or placeholders
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <strong className="text-success">Professional:</strong><br/>
                Industry-standard methodologies & tools
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};