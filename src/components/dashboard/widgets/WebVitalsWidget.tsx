import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, MousePointer, LayoutGrid, TrendingUp, AlertTriangle } from 'lucide-react';

interface VitalMetricProps {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  value: number;
  unit: string;
  threshold: number;
  description: string;
}

function VitalMetric({ icon: Icon, name, value, unit, threshold, description }: VitalMetricProps) {
  const isGood = value <= threshold;
  const percentOfBudget = (value / threshold) * 100;
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{name}</span>
            <Badge variant={isGood ? 'default' : 'destructive'} className="text-xs">
              {value.toFixed(unit === '' ? 3 : 0)}{unit}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-medium ${isGood ? 'text-green-600' : 'text-destructive'}`}>
          {percentOfBudget.toFixed(0)}%
        </div>
        <p className="text-xs text-muted-foreground">of budget</p>
      </div>
    </div>
  );
}

export function WebVitalsWidget() {
  const { data: vitals, isLoading } = useQuery({
    queryKey: ['web-vitals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('metric_type, duration_ms, created_at')
        .in('metric_type', ['lcp', 'fid', 'cls', 'page_load'])
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: alerts } = useQuery({
    queryKey: ['performance-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const avgMetrics = {
    lcp: calculateAvg(vitals, 'lcp'),
    fid: calculateAvg(vitals, 'fid'),
    cls: calculateAvg(vitals, 'cls') / 1000, // Convert back from ms
    pageLoad: calculateAvg(vitals, 'page_load'),
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/2 mb-4" />
          <div className="space-y-3">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Core Web Vitals</h3>
        {alerts && alerts.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
      
      <div className="space-y-3">
        <VitalMetric
          icon={Activity}
          name="LCP"
          value={avgMetrics.lcp}
          unit="ms"
          threshold={2500}
          description="Largest Contentful Paint"
        />
        <VitalMetric
          icon={MousePointer}
          name="FID"
          value={avgMetrics.fid}
          unit="ms"
          threshold={100}
          description="First Input Delay"
        />
        <VitalMetric
          icon={LayoutGrid}
          name="CLS"
          value={avgMetrics.cls}
          unit=""
          threshold={0.1}
          description="Cumulative Layout Shift"
        />
        <VitalMetric
          icon={TrendingUp}
          name="TTI"
          value={avgMetrics.pageLoad}
          unit="ms"
          threshold={2000}
          description="Time to Interactive"
        />
      </div>

      {vitals && vitals.length === 0 && (
        <p className="text-sm text-muted-foreground text-center mt-4">
          No metrics in the last hour
        </p>
      )}
    </Card>
  );
}

function calculateAvg(data: any[] | undefined, type: string): number {
  if (!data || data.length === 0) return 0;
  const filtered = data.filter(d => d.metric_type === type);
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, d) => sum + d.duration_ms, 0) / filtered.length;
}
