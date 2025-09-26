import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, Phone, Network, BookOpen, Home, Activity } from 'lucide-react';

interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'intro', label: 'Introduction', icon: Home },
  { id: 'deep', label: 'Deep Search (Fast)', icon: Search },
  { id: 'enhanced', label: 'Enhanced Pro (Max Accuracy)', icon: Users },
  { id: 'report', label: 'Report', icon: BookOpen },
  { id: 'methodology', label: 'Methodology', icon: BookOpen },
  { id: 'monitor', label: 'System Status', icon: Activity },
];

export const NavigationTabs = ({ activeTab, onTabChange }: NavigationTabsProps) => {
  return (
    <div className="w-full overflow-x-auto">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-muted/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center space-x-1 px-2 py-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
};