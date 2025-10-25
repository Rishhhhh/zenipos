import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  TrendingUp,
  Gift,
  Brain,
  Loader2,
  Award,
} from 'lucide-react';

export default function CRMDashboard() {
  const { toast } = useToast();
  const [aiInsights, setAiInsights] = useState<any>(null);

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('total_spent', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch top loyal customers
  const { data: topCustomers } = useQuery({
    queryKey: ['top-customers'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_loyal_customers', { limit_count: 10 });
      if (error) throw error;
      return data;
    },
  });

  // Fetch loyalty stats
  const { data: loyaltyStats } = useQuery({
    queryKey: ['loyalty-stats'],
    queryFn: async () => {
      const { data: ledger } = await supabase.from('loyalty_ledger').select('*');
      
      const totalEarned = ledger?.filter(l => l.transaction_type === 'earned')
        .reduce((sum, l) => sum + l.points_delta, 0) || 0;
      const totalRedeemed = Math.abs(ledger?.filter(l => l.transaction_type === 'redeemed')
        .reduce((sum, l) => sum + l.points_delta, 0) || 0);
      
      return {
        totalEarned,
        totalRedeemed,
        redemptionRate: totalEarned > 0 ? (totalRedeemed / totalEarned) * 100 : 0,
      };
    },
  });

  // AI Insights mutation
  const getAIInsights = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('loyalty-insights');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setAiInsights(data);
      toast({
        title: 'AI Insights Ready',
        description: `${data.campaigns?.length || 0} campaign suggestions generated`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Insights Failed',
        description: error.message,
      });
    },
  });

  const totalCustomers = customers?.length || 0;
  const activeCustomers = customers?.filter(c => c.total_orders > 0).length || 0;
  const totalPointsInCirculation = customers?.reduce((sum, c) => sum + c.loyalty_points, 0) || 0;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CRM & Loyalty</h1>
          <p className="text-muted-foreground">Manage customer relationships and loyalty programs</p>
        </div>
        <Button onClick={() => getAIInsights.mutate()} disabled={getAIInsights.isPending}>
          {getAIInsights.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          AI Campaign Insights
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Users className="h-12 w-12 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold">{totalCustomers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="h-12 w-12 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Active Customers</p>
              <p className="text-2xl font-bold">{activeCustomers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Gift className="h-12 w-12 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Points in Circulation</p>
              <p className="text-2xl font-bold">{totalPointsInCirculation.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Award className="h-12 w-12 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Redemption Rate</p>
              <p className="text-2xl font-bold">{loyaltyStats?.redemptionRate.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Top Customers Tab */}
        <TabsContent value="customers">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Top Loyal Customers</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Rank</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Phone</th>
                    <th className="text-right p-3">Points</th>
                    <th className="text-right p-3">Total Spent</th>
                    <th className="text-right p-3">Orders</th>
                    <th className="text-right p-3">Redemption Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers?.map((customer, idx) => (
                    <tr key={customer.id} className="border-b">
                      <td className="p-3">
                        <Badge variant={idx < 3 ? 'default' : 'outline'}>
                          #{idx + 1}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium">{customer.name || 'Guest'}</td>
                      <td className="p-3 text-muted-foreground">{customer.phone}</td>
                      <td className="p-3 text-right font-bold text-primary">
                        {customer.loyalty_points.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">RM {customer.total_spent.toFixed(2)}</td>
                      <td className="p-3 text-right">{customer.total_orders}</td>
                      <td className="p-3 text-right">{customer.redemption_rate?.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights">
          {!aiInsights ? (
            <Card className="p-12 text-center">
              <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI Campaign Insights</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Get AI-powered suggestions for loyalty campaigns based on your customer behavior patterns
              </p>
              <Button onClick={() => getAIInsights.mutate()} disabled={getAIInsights.isPending} size="lg">
                {getAIInsights.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Generate Insights
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Raw Data Summary */}
              <Card className="p-6 bg-muted/50">
                <h3 className="font-bold mb-4">Analysis Summary</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-xl font-bold">{aiInsights.rawData?.totalCustomers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Repeat Customers</p>
                    <p className="text-xl font-bold">{aiInsights.rawData?.repeatCustomers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lapsed Customers</p>
                    <p className="text-xl font-bold text-warning">{aiInsights.rawData?.lapsedCustomers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Redemption Rate</p>
                    <p className="text-xl font-bold">{aiInsights.rawData?.redemptionRate}%</p>
                  </div>
                </div>
              </Card>

              {/* AI Insights */}
              {aiInsights.insights && (
                <Card className="p-6">
                  <h3 className="font-bold mb-4">Key Insights</h3>
                  <ul className="space-y-2">
                    {aiInsights.insights.map((insight: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-success mt-1 flex-shrink-0" />
                        <span className="text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Campaign Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aiInsights.campaigns?.map((campaign: any, idx: number) => (
                  <Card key={idx} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-bold text-lg">{campaign.title}</h3>
                      <Badge>{campaign.target.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{campaign.description}</p>
                    <div className="bg-primary/10 p-3 rounded mb-4">
                      <p className="text-sm font-medium">Suggested Action:</p>
                      <p className="text-sm">{campaign.action}</p>
                    </div>
                    <div className="bg-success/10 p-3 rounded">
                      <p className="text-sm font-medium">Expected Impact:</p>
                      <p className="text-sm">{campaign.expected_impact}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
