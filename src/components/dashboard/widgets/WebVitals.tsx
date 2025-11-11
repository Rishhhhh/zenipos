import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, MousePointer, LayoutGrid, TrendingUp, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useWidgetConfig } from '@/hooks/useWidgetConfig';
import { WebVitalsConfig } from '@/types/widgetConfigs';
import { cn } from '@/lib/utils';

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
    <div className={cn("flex flex-col items-center justify-center rounded-lg bg-muted/30 border border-border/50", compactMode ? "w-[88px] h-[88px] p-2" : "w-[96px] h-[96px] p-2.5")}>
      <Icon className={cn("text-muted-foreground mb-1", compactMode ? "h-4 w-4" : "h-5 w-5")} />
      <p className={cn("font-medium text-muted-foreground mb-0.5", compactMode ? "text-[10px]" : "text-[11px]")}>{name}</p>
      <div className="flex items-center gap-1">
        <span className={cn("font-bold", compactMode ? "text-base" : "text-lg", isGood ? "text-success" : "text-destructive")}>{unit === '' ? value.toFixed(3) : Math.round(value)}</span>
        <span className={cn("text-muted-foreground", compactMode ? "text-[9px]" : "text-[10px]")}>{unit}</span>
      </div>
      <div className={cn("rounded-full mt-1", compactMode ? "w-1.5 h-1.5" : "w-2 h-2", isGood ? "bg-success" : "bg-destructive")} />
    </div>
  );
}

export default function WebVitals() {
  const { config } = useWidgetConfig<WebVitalsConfig>('web-vitals');
  
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

  const calculateAvg = (data: any[] | undefined, type: string): number => {
    if (!data || data.length === 0) return 0;
    const filtered = data.filter(d => d.metric_type === type);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, d) => sum + d.duration_ms, 0) / filtered.length;
  };

  const avgMetrics = {
    lcp: calculateAvg(vitals, 'lcp'),
    fid: calculateAvg(vitals, 'fid'),
    cls: calculateAvg(vitals, 'cls') / 1000,
    tti: calculateAvg(vitals, 'page_load'),
  };

  return (
    <Card className={cn("glass-card flex flex-col w-full h-full", config.compactMode ? "p-3" : "p-4")}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Web Vitals</h3>
        <div className="flex items-center gap-2">
          {config.showAlertCount && alerts && alerts.length > 0 && <Badge variant="destructive" className="text-xs h-4 px-1.5">{alerts.length}</Badge>}
          <Button onClick={() => refetch()} variant="ghost" size="sm" className="h-7 w-7 p-0"><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className={cn("rounded", config.compactMode ? "w-[88px] h-[88px]" : "w-[96px] h-[96px]")} />)}
          </div>
        ) : (
          <div className={cn("grid grid-cols-2 auto-rows-min", config.compactMode ? "gap-2" : "gap-2.5")}>
            <MetricCard icon={Activity} name="LCP" value={avgMetrics.lcp} unit="ms" threshold={config.thresholds.lcp} compactMode={config.compactMode} />
            <MetricCard icon={MousePointer} name="FID" value={avgMetrics.fid} unit="ms" threshold={config.thresholds.fid} compactMode={config.compactMode} />
            <MetricCard icon={LayoutGrid} name="CLS" value={avgMetrics.cls} unit="" threshold={config.thresholds.cls} compactMode={config.compactMode} />
            <MetricCard icon={TrendingUp} name="TTI" value={avgMetrics.tti} unit="ms" threshold={config.thresholds.tti} compactMode={config.compactMode} />
          </div>
        )}
      </div>
    </Card>
  );
}
