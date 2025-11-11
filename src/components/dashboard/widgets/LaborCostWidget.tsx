import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Clock, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useWidgetConfig } from '@/hooks/useWidgetConfig';
import { LaborCostConfig } from '@/types/widgetConfigs';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/ui/sparkline';

export function LaborCostWidget() {
  const { config } = useWidgetConfig<LaborCostConfig>('labor-cost');
  
  // Fetch current labor metrics
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['labor-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_labor_metrics', {
        branch_id_param: null,
      });
      if (error) throw error;
      return data?.[0];
    },
    refetchInterval: config.refreshInterval * 1000,
  });

  // Fetch sparkline data (last 8 hours)
  const { data: sparklineData } = useQuery({
    queryKey: ['labor-sparkline'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_labor_sparkline', {
        hours_back: 8,
      });
      if (error) {
        console.error('Sparkline error:', error);
        return [];
      }
      return data?.map((d: any) => Number(d.labor_percentage) || 0) || [];
    },
    enabled: config.showSparkline,
    refetchInterval: config.refreshInterval * 1000,
  });

  const laborPercentage = Number(metrics?.labor_percentage || 0);
  const isOverBudget = laborPercentage > config.targetPercentage;
  const variance = laborPercentage - config.targetPercentage;
  const progressMax = config.targetPercentage * 1.5;

  const getProgressColor = () => {
    if (laborPercentage > config.targetPercentage * 1.2) return 'bg-destructive';
    if (laborPercentage > config.targetPercentage) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <Card className={cn(
      "glass-card flex flex-col w-full h-full",
      config.compactMode ? "p-2.5" : "p-3"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-end",
        config.compactMode ? "mb-2" : "mb-3"
      )}>
        <Button
          onClick={() => refetch()}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 flex flex-col justify-between",
        config.compactMode ? "h-[208px]" : "h-[192px]"
      )}>
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full rounded" />
            <Skeleton className="h-8 w-full rounded mt-2" />
            <Skeleton className="h-10 w-full rounded mt-2" />
            {config.showSparkline && !config.compactMode && (
              <Skeleton className="h-10 w-full rounded mt-2" />
            )}
          </>
        ) : (
          <>
            {/* Labor Percentage (Hero Element) */}
            <div className="text-center">
              <div className={cn(
                "font-bold text-primary",
                config.compactMode ? "text-4xl" : "text-3xl"
              )}>
                {laborPercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target: {config.targetPercentage.toFixed(1)}%
              </p>
            </div>

            {/* Progress Bar */}
            <div className={cn(
              config.compactMode ? "h-10 py-1" : "h-8"
            )}>
              <Progress 
                value={laborPercentage} 
                max={progressMax}
                className={cn(
                  "w-full",
                  config.compactMode ? "h-3" : "h-2"
                )}
                indicatorClassName={getProgressColor()}
              />
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-center">
              {isOverBudget ? (
                <Badge variant="destructive" className={cn(
                  "flex items-center gap-1.5",
                  config.compactMode ? "text-base px-3 py-1" : "text-sm px-2 py-0.5"
                )}>
                  <TrendingUp className="h-3.5 w-3.5" />
                  +{Math.abs(variance).toFixed(1)}% Over Budget
                </Badge>
              ) : (
                <Badge variant="default" className={cn(
                  "flex items-center gap-1.5 bg-success/20 text-success",
                  config.compactMode ? "text-base px-3 py-1" : "text-sm px-2 py-0.5"
                )}>
                  <TrendingDown className="h-3.5 w-3.5" />
                  {Math.abs(variance).toFixed(1)}% Under Budget
                </Badge>
              )}
            </div>

            {/* Sparkline OR Mini Metrics */}
            {config.showSparkline && !config.compactMode ? (
              <div className="space-y-1">
                <div className="h-10 flex items-center justify-center">
                  {sparklineData && sparklineData.length > 0 ? (
                    <Sparkline 
                      data={sparklineData} 
                      width={200} 
                      height={36}
                      className="text-primary"
                    />
                  ) : (
                    <div className="h-9 w-full bg-muted/20 rounded animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Last 8 Hours
                </p>
              </div>
            ) : config.compactMode ? (
              <div className="space-y-1.5 text-center">
                <p className="text-xs text-muted-foreground">
                  RM {Number(metrics?.total_labor_cost || 0).toFixed(2)} / RM {Number(metrics?.total_sales || 0).toFixed(2)}
                </p>
                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Number(metrics?.total_hours || 0).toFixed(1)}h
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {metrics?.active_employees || 0} staff
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </Card>
  );
}
