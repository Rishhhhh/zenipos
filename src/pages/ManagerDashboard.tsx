import { useState } from 'react';
import { BranchSelector } from '@/components/branch/BranchSelector';
import { BranchComparisonCards } from '@/components/branch/BranchComparisonCards';
import { LiveOrdersFeed } from '@/components/branch/LiveOrdersFeed';
import { AlertsPanel } from '@/components/branch/AlertsPanel';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';
import { useBranch } from '@/contexts/BranchContext';

export default function ManagerDashboard() {
  const { branches, isLoading: branchesLoading } = useBranch();
  const [selectedBranch, setSelectedBranch] = useState<string | null>('all');
  const [date, setDate] = useState<Date>(new Date());

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manager Dashboard</h1>
          <p className="text-muted-foreground">Multi-branch analytics and oversight</p>
        </div>

        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(date, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
              />
            </PopoverContent>
          </Popover>

          <BranchSelector 
            value={selectedBranch} 
            onChange={setSelectedBranch}
            branches={branches}
            isLoading={branchesLoading}
          />
        </div>
      </div>

      <AlertsPanel />

      {selectedBranch === 'all' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Branch Comparison</h2>
          <BranchComparisonCards date={date} />
        </div>
      )}

      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live">Live Feed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          <LiveOrdersFeed branchId={selectedBranch} />
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6">
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Analytics Coming Soon</h3>
              <p className="text-muted-foreground">
                Advanced analytics and insights will be available here
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card className="h-[600px]">
            <AIAssistantPanel />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
