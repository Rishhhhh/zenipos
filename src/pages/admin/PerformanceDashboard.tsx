import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PerformanceDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Calculate statistics
  const pageLoadMetrics = metrics?.filter(m => m.metric_type === 'page_load') || [];
  const avgTTI = pageLoadMetrics.length > 0
    ? pageLoadMetrics.reduce((sum, m) => sum + (m.duration_ms || 0), 0) / pageLoadMetrics.length
    : 0;

  const budgetViolations = metrics?.filter(m => m.exceeded_budget) || [];
  const budgetCompliance = metrics && metrics.length > 0
    ? ((metrics.length - budgetViolations.length) / metrics.length) * 100
    : 100;

  // Group by page
  const pagePerformance = pageLoadMetrics.reduce((acc: any, metric) => {
    const page = metric.page_path || 'unknown';
    if (!acc[page]) {
      acc[page] = {
        count: 0,
        totalDuration: 0,
        violations: 0
      };
    }
    acc[page].count++;
    acc[page].totalDuration += metric.duration_ms || 0;
    if (metric.exceeded_budget) acc[page].violations++;
    return acc;
  }, {});

  const pageStats = Object.entries(pagePerformance).map(([page, stats]: [string, any]) => ({
    page,
    avgDuration: stats.totalDuration / stats.count,
    violations: stats.violations,
    count: stats.count
  })).sort((a, b) => b.avgDuration - a.avgDuration);

  const budgetThresholds = {
    page_load: 1500,
    route_change: 200,
    kds_update: 1000,
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Performance Dashboard</h1>
        <p className="text-muted-foreground">Monitor page load times and Core Web Vitals</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Avg TTI</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgTTI.toFixed(0)}ms</p>
          <p className="text-xs text-muted-foreground mt-1">Budget: 1500ms</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <p className="text-sm font-medium text-muted-foreground">Budget Compliance</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{budgetCompliance.toFixed(1)}%</p>
          <Progress value={budgetCompliance} className="mt-2" />
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-sm font-medium text-muted-foreground">Budget Violations</p>
          </div>
          <p className="text-2xl font-bold text-destructive">{budgetViolations.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Last 100 requests</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <p className="text-sm font-medium text-muted-foreground">Total Metrics</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{metrics?.length || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Tracked events</p>
        </Card>
      </div>

      {/* Performance Budgets */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Performance Budgets</h3>
        <div className="space-y-4">
          {Object.entries(budgetThresholds).map(([type, budget]) => {
            const typeMetrics = metrics?.filter(m => m.metric_type === type) || [];
            const avgDuration = typeMetrics.length > 0
              ? typeMetrics.reduce((sum, m) => sum + (m.duration_ms || 0), 0) / typeMetrics.length
              : 0;
            const percentage = (avgDuration / budget) * 100;
            const isExceeded = avgDuration > budget;

            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground capitalize">
                      {type.replace('_', ' ')}
                    </span>
                    <Badge variant={isExceeded ? 'destructive' : 'default'}>
                      {avgDuration.toFixed(0)}ms / {budget}ms
                    </Badge>
                  </div>
                  <span className={`text-sm ${isExceeded ? 'text-destructive' : 'text-success'}`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className="h-2"
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Slowest Pages */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Slowest Pages</h3>
        <div className="space-y-2">
          {pageStats.slice(0, 10).map((stat) => (
            <div key={stat.page} className="flex items-center justify-between p-3 border rounded bg-card">
              <div className="flex-1">
                <p className="font-medium text-foreground">{stat.page}</p>
                <p className="text-xs text-muted-foreground">
                  {stat.count} requests
                </p>
              </div>
              <div className="flex items-center gap-3">
                {stat.violations > 0 && (
                  <Badge variant="destructive">
                    {stat.violations} violations
                  </Badge>
                )}
                <span className="font-mono text-sm text-foreground">
                  {stat.avgDuration.toFixed(0)}ms
                </span>
              </div>
            </div>
          ))}
          {pageStats.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-2 text-primary" />
              <p>No performance data yet. Metrics will appear as users navigate the app.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Violations */}
      {budgetViolations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Recent Budget Violations
          </h3>
          <div className="space-y-2">
            {budgetViolations.slice(0, 10).map((violation) => (
              <div key={violation.id} className="flex items-center justify-between p-3 border rounded bg-card">
                <div>
                  <p className="font-medium text-foreground">{violation.page_path}</p>
                  <p className="text-xs text-muted-foreground">
                    {violation.metric_type} - {format(new Date(violation.created_at), 'PPp')}
                  </p>
                </div>
                <Badge variant="destructive">
                  {violation.duration_ms}ms
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
