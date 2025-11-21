import { memo, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, MousePointer, LayoutGrid, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useWidgetConfig } from '@/hooks/useWidgetConfig';
import { WebVitalsConfig } from '@/types/widgetConfigs';
import { cn } from '@/lib/utils';
import { useWidgetRefresh } from '@/contexts/WidgetRefreshContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  value: number;
  unit: string;
  threshold: number;
  compactMode: boolean;
}

function MetricCard({ icon: Icon, name, value, unit, threshold, compactMode }: MetricCardProps) {
  const isGood = value <= threshold;
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-lg bg-muted/30 border border-border/50",
      compactMode ? "p-2.5 min-h-[85px]" : "p-3.5 min-h-[95px]"
    )}>
      <Icon className={cn("text-muted-foreground mb-2", compactMode ? "h-5 w-5" : "h-6 w-6")} />
      <p className={cn("font-medium text-muted-foreground mb-1", compactMode ? "text-xs" : "text-sm")}>
        {name}
      </p>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          "font-bold",
          compactMode ? "text-xl" : "text-2xl",
          isGood ? "text-success" : "text-destructive"
        )}>
          {unit === '' ? value.toFixed(3) : Math.round(value)}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      <div className={cn(
        "rounded-full mt-2",
        compactMode ? "w-2 h-2" : "w-2.5 h-2.5",
        isGood ? "bg-success" : "bg-destructive"
      )} />
    </div>
  );
}

export default memo(function WebVitals() {
  const { config } = useWidgetConfig<WebVitalsConfig>('web-vitals');
  const { registerRefresh } = useWidgetRefresh();
  const { isMobile } = useDeviceDetection();
  
  const { data: vitals, isLoading, refetch } = useQuery({
    queryKey: ['web-vitals-widget'],
    queryFn: async () => {
      const { data, error } = await supabase.from('performance_metrics').select('metric_type, duration_ms, created_at').in('metric_type', ['lcp', 'fid', 'cls', 'page_load']).gte('created_at', new Date(Date.now() - 3600000).toISOString()).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: config.refreshInterval * 1000,
  });

  const { data: alerts } = useQuery({
    queryKey: ['performance-alerts-widget'],
    queryFn: async () => {
      const { data, error } = await supabase.from('performance_alerts').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(5);
      if (error) throw error;
      return data;
    },
    refetchInterval: config.refreshInterval * 1000,
    enabled: config.showAlertCount,
  });

  const calculateAvg = useCallback((data: any[] | undefined, type: string): number => {
    if (!data || data.length === 0) return 0;
    const filtered = data.filter(d => d.metric_type === type);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, d) => sum + d.duration_ms, 0) / filtered.length;
  }, []);

  const avgMetrics = useMemo(() => ({
    lcp: calculateAvg(vitals, 'lcp'),
    fid: calculateAvg(vitals, 'fid'),
    cls: calculateAvg(vitals, 'cls') / 1000,
    tti: calculateAvg(vitals, 'page_load'),
  }), [vitals, calculateAvg]);

  // Register refetch function
  useEffect(() => {
    registerRefresh(refetch);
  }, [refetch, registerRefresh]);

  return (
    <Card className={cn("glass-card flex flex-col w-full h-full", config.compactMode ? "p-3" : "p-4")}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold">Web Vitals</h3>
        {config.showAlertCount && alerts && alerts.length > 0 && (
          <Badge variant="destructive" className="text-xs h-4 px-1.5">{alerts.length}</Badge>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center min-h-[120px]">
        {isLoading ? (
          <div className="grid grid-cols-4 gap-3 w-full max-w-[900px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-[95px] rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 w-full max-w-[900px]">
            <MetricCard
              icon={Activity}
              name="LCP"
              value={avgMetrics.lcp}
              unit="ms"
              threshold={config.thresholds.lcp}
              compactMode={config.compactMode}
            />
            <MetricCard
              icon={MousePointer}
              name="FID"
              value={avgMetrics.fid}
              unit="ms"
              threshold={config.thresholds.fid}
              compactMode={config.compactMode}
            />
            <MetricCard
              icon={LayoutGrid}
              name="CLS"
              value={avgMetrics.cls}
              unit=""
              threshold={config.thresholds.cls}
              compactMode={config.compactMode}
            />
            <MetricCard
              icon={TrendingUp}
              name="TTI"
              value={avgMetrics.tti}
              unit="ms"
              threshold={config.thresholds.tti}
              compactMode={config.compactMode}
            />
          </div>
        )}
      </div>
    </Card>
  );
});
