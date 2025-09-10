import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Book, Shield, Zap, Users, AlertTriangle } from 'lucide-react';

const methodologySteps = [
  {
    step: 1,
    title: "Information Gathering",
    description: "Collect all known information about the target",
    details: [
      "Full name, aliases, nicknames",
      "Last known address and phone",
      "Date of birth, SSN (if available)",
      "Email addresses and usernames",
      "Employment history",
      "Family and associate information"
    ],
    tools: ["Basic Search", "Phone Validation"]
  },
  {
    step: 2,
    title: "Digital Footprint Analysis",
    description: "Search for online presence and social media profiles",
    details: [
      "Social media platform search",
      "Username correlation across sites",
      "Public records searches",
      "Professional networking sites",
      "Forum and community participation",
      "Digital breadcrumb analysis"
    ],
    tools: ["Social Profile Search"]
  },
  {
    step: 3,
    title: "Data Correlation",
    description: "Connect and verify information from multiple sources",
    details: [
      "Cross-reference addresses",
      "Validate phone number ownership",
      "Confirm employment history",
      "Identify family connections",
      "Verify timeline consistency",
      "Flag discrepancies for investigation"
    ],
    tools: ["Phone Validation", "Link Analysis"]
  },
  {
    step: 4,
    title: "Network Mapping",
    description: "Build relationship networks and identify connections",
    details: [
      "Map family relationships",
      "Identify business associates",
      "Track address histories",
      "Connect social circles",
      "Analyze communication patterns",
      "Find mutual connections"
    ],
    tools: ["Link Analysis", "Network Visualization"]
  },
  {
    step: 5,
    title: "Lead Development",
    description: "Generate actionable leads and investigation paths",
    details: [
      "Prioritize high-confidence leads",
      "Identify verification methods",
      "Plan contact approaches",
      "Develop alternative strategies",
      "Document evidence chain",
      "Prepare follow-up actions"
    ],
    tools: ["All Tools Combined"]
  }
];

const professionalComparison = [
  {
    category: "Search Capabilities",
    professional: "Paid databases, API access, real-time data",
    thistool: "Free search engines, mock data, educational focus",
    advantage: "Cost-effective learning, no API keys required"
  },
  {
    category: "Data Sources",
    professional: "Proprietary databases, credit reports, utility records",
    thisool: "Public web sources, social media, open databases",
    advantage: "Demonstrates OSINT principles, privacy-aware"
  },
  {
    category: "Visualization",
    professional: "Advanced graphs, geospatial mapping, timeline analysis",
    thisool: "Basic network visualization, relationship mapping",
    advantage: "Easy to understand, educational clarity"
  },
  {
    category: "Automation",
    professional: "Automated monitoring, alert systems, batch processing",
    thisool: "Manual searches, interactive learning, step-by-step process",
    advantage: "Hands-on learning, transparent methodology"
  }
];

export const MethodologyTab = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Skip Tracing Methodology</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Learn the systematic approach to skip tracing investigations and understand 
          how professional tools compare to this educational implementation.
        </p>
      </div>

      <Card className="bg-gradient-primary text-white">
        <CardContent className="pt-6">
          <div className="text-center">
            <Book className="mx-auto h-12 w-12 mb-4 opacity-90" />
            <h3 className="text-xl font-bold mb-2">Educational Framework</h3>
            <p className="text-sm opacity-90">
              This tool demonstrates real-world skip tracing techniques in a controlled, 
              ethical environment using publicly available information and free tools.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Investigation Process</h3>
        {methodologySteps.map((step, index) => (
          <Card key={step.step} className="relative">
            <div className="absolute -left-3 top-6 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
              {step.step}
            </div>
            <CardHeader className="pl-8">
              <CardTitle className="flex items-center justify-between">
                <span>{step.title}</span>
                <div className="flex space-x-1">
                  {step.tools.map(tool => (
                    <Badge key={tool} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </CardTitle>
              <p className="text-muted-foreground">{step.description}</p>
            </CardHeader>
            <CardContent className="pl-8">
              <ul className="grid gap-2 md:grid-cols-2">
                {step.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start text-sm">
                    <CheckCircle className="mr-2 mt-0.5 h-3 w-3 text-success flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </CardContent>
            {index < methodologySteps.length - 1 && (
              <div className="flex justify-center pb-4">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Professional Tools Comparison</h3>
        <div className="grid gap-4">
          {professionalComparison.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base">{item.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="text-sm font-medium text-destructive">Professional Tools</Label>
                    <p className="text-sm text-muted-foreground mt-1">{item.professional}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-primary">This Educational Tool</Label>
                    <p className="text-sm text-muted-foreground mt-1">{item.thisool}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-success">Educational Advantage</Label>
                    <p className="text-sm text-muted-foreground mt-1">{item.advantage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
                <CheckCircle className="mr-2 mt-0.5 h-3 w-3 text-success flex-shrink-0" />
                Always obtain proper consent before investigating
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 mt-0.5 h-3 w-3 text-success flex-shrink-0" />
                Use only publicly available information
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 mt-0.5 h-3 w-3 text-success flex-shrink-0" />
                Comply with all applicable privacy laws
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 mt-0.5 h-3 w-3 text-success flex-shrink-0" />
                Document your methodology and sources
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 mt-0.5 h-3 w-3 text-success flex-shrink-0" />
                Respect individuals' privacy and dignity
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-warning" />
              Legal Considerations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <AlertTriangle className="mr-2 mt-0.5 h-3 w-3 text-warning flex-shrink-0" />
                FCRA compliance for employment screening
              </li>
              <li className="flex items-start">
                <AlertTriangle className="mr-2 mt-0.5 h-3 w-3 text-warning flex-shrink-0" />
                GLBA requirements for financial institutions
              </li>
              <li className="flex items-start">
                <AlertTriangle className="mr-2 mt-0.5 h-3 w-3 text-warning flex-shrink-0" />
                State privacy laws and regulations
              </li>
              <li className="flex items-start">
                <AlertTriangle className="mr-2 mt-0.5 h-3 w-3 text-warning flex-shrink-0" />
                International data protection laws (GDPR)
              </li>
              <li className="flex items-start">
                <AlertTriangle className="mr-2 mt-0.5 h-3 w-3 text-warning flex-shrink-0" />
                Professional licensing requirements
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold mb-2">For Classroom Use</h4>
              <p className="text-sm text-muted-foreground mb-3">
                This tool is designed for cybersecurity and investigative training programs. 
                Students learn OSINT techniques while understanding ethical boundaries and legal requirements.
              </p>
              <div className="grid gap-2 md:grid-cols-2 text-sm">
                <div>
                  <strong>Recommended for:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Cybersecurity courses</li>
                    <li>• Digital forensics training</li>
                    <li>• Private investigation programs</li>
                    <li>• Law enforcement academies</li>
                  </ul>
                </div>
                <div>
                  <strong>Learning outcomes:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• OSINT methodology understanding</li>
                    <li>• Ethical investigation practices</li>
                    <li>• Data correlation techniques</li>
                    <li>• Legal compliance awareness</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Label = ({ children, className, ...props }: { children: React.ReactNode; className?: string }) => (
  <div className={`font-medium ${className}`} {...props}>
    {children}
  </div>
);