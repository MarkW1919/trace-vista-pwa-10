import { useState, useEffect } from 'react';
import { NavigationTabs } from '@/components/NavigationTabs';
import { EthicalDisclaimer } from '@/components/EthicalDisclaimer';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { IntroductionTab } from '@/components/tabs/IntroductionTab';
import { EnhancedBasicSearchTab } from '@/components/tabs/EnhancedBasicSearchTab';
import { BasicSearchTab } from '@/components/tabs/BasicSearchTab';
import { SocialSearchTab } from '@/components/tabs/SocialSearchTab';
import { EnhancedPhoneValidationTab } from '@/components/tabs/EnhancedPhoneValidationTab';
import { EmailOsintTab } from '@/components/tabs/EmailOsintTab';
import { PublicRecordsTab } from '@/components/tabs/PublicRecordsTab';
import { NetworkAnalysisTab } from '@/components/tabs/NetworkAnalysisTab';
import { ComprehensiveReportTab } from '@/components/tabs/ComprehensiveReportTab';
import { MethodologyTab } from '@/components/tabs/MethodologyTab';
import { SkipTracingProvider } from '@/contexts/SkipTracingContext';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  const [activeTab, setActiveTab] = useState('intro');

  // Register service worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'intro':
        return <IntroductionTab />;
      case 'search':
        return <EnhancedBasicSearchTab />;
      case 'social':
        return <SocialSearchTab />;
      case 'phone':
        return <EnhancedPhoneValidationTab />;
      case 'email':
        return <EmailOsintTab />;
      case 'records':
        return <PublicRecordsTab />;
      case 'network':
        return <NetworkAnalysisTab />;
      case 'report':
        return <ComprehensiveReportTab />;
      case 'methodology':
        return <MethodologyTab />;
      default:
        return <IntroductionTab />;
    }
  };

  return (
    <SkipTracingProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/50 backdrop-blur supports-backdrop-blur:bg-card/50">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
                Real Data Skip Tracing Educational Tool
              </h1>
              <p className="text-muted-foreground">
                Professional OSINT techniques using only real public data - no simulations
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <EthicalDisclaimer />
          
          <div className="space-y-8">
            <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div className="min-h-[600px]">
              {renderTabContent()}
            </div>
          </div>
        </main>

        <footer className="border-t bg-muted/20 mt-16">
          <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Real Data Skip Tracing Educational Tool v5.0 | Real Data Only | 
              <span className="ml-2">Progressive Web App Enabled</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Real public data only - requires subject consent. Always use ethically and legally.
            </p>
          </div>
        </footer>

        <PWAInstallPrompt />
        <Toaster />
      </div>
    </SkipTracingProvider>
  );
};

export default Index;
