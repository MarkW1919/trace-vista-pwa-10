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
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { SystemStatusMonitor } from '@/components/SystemStatusMonitor';

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
      case 'deep':
        return <BasicSearchTab />;
      case 'enhanced':
        return <EnhancedBasicSearchTab />;
      case 'report':
        return <ComprehensiveReportTab />;
      case 'methodology':
        return <MethodologyTab />;
      case 'monitor':
        return <SystemStatusMonitor />;
      default:
        return <IntroductionTab />;
    }
  };

  return (
    <AuthProvider>
      <SkipTracingProvider>
        <div className="min-h-screen bg-background">
          <header className="border-b bg-card/80 backdrop-blur-sm supports-backdrop-blur:bg-card/80 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
                  Professional Skip Tracing & OSINT Platform v7.0
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Two-Tier System: Deep Search (Fast) • Enhanced Pro (Maximum Accuracy) • Real API Integration • Live Data Extraction
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
                Professional Skip Tracing Platform v7.0 • Simplified Two-Tier System • Real APIs • Live Data Extraction •
                <span className="ml-2 text-primary font-medium">Enhanced Intelligence</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Streamlined OSINT platform with intelligent search filtering and training-enhanced accuracy. Always verify subject consent and use ethically.
              </p>
            </div>
          </footer>

          <PWAInstallPrompt />
          <Toaster />
        </div>
      </SkipTracingProvider>
    </AuthProvider>
  );
};

export default Index;
