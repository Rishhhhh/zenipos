import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useWidgetConfig } from '@/hooks/useWidgetConfig';
import { LaborCostConfig } from '@/types/widgetConfigs';
import { Sparkline } from '@/components/ui/sparkline';

interface LaborCostWidgetProps {
  branchId?: string;
}

export function LaborCostWidget({ branchId }: LaborCostWidgetProps) {
  const { config } = useWidgetConfig<LaborCostConfig>('labor-cost');
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['labor-metrics', branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_labor_metrics', {
        branch_id_param: branchId || null,
      });
      if (error) throw error;
      return data?.[0];
    },
    refetchInterval: config.refreshInterval * 1000,
  });

  // Fetch sparkline data (last 8 hours)
  const { data: sparklineData } = useQuery({
    queryKey: ['labor-sparkline', branchId],
    queryFn: async () => {
      const hours = Array.from({ length: 8 }, (_, i) => {
        const date = new Date();
        date.setHours(date.getHours() - (7 - i));
        return date;
      });

      const percentages = await Promise.all(
        hours.map(async (hour) => {
          const { data } = await supabase.rpc('calculate_labor_metrics', {
            branch_id_param: branchId || null,
          });
          return Number(data?.[0]?.labor_percentage || 0);
        })
      );

      return percentages;
    },
    refetchInterval: config.refreshInterval * 1000,
    enabled: config.showSparkline,
  });

  if (isLoading) {
    return (
      <Card className="glass-card p-3 w-[240px] h-[240px] flex flex-col">
        <Skeleton className="w-full h-full rounded-lg" />
      </Card>
    );
  }

  const laborPercentage = Number(metrics?.labor_percentage || 0);
  const isOverBudget = laborPercentage > config.targetPercentage;
  const variance = laborPercentage - config.targetPercentage;

  return (
    <Card className="glass-card p-3 w-[240px] h-[240px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-xs">Labor Cost</h3>
        <Badge 
          variant={isOverBudget ? "destructive" : "default"} 
          className="text-xs h-5 px-1.5"
        >
          {isOverBudget ? (
            <TrendingUp className="h-3 w-3 mr-0.5" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-0.5" />
          )}
          {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
        </Badge>
      </div>

      {/* Main Metric */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="text-center mb-3">
          <div className="text-4xl font-bold text-primary mb-1">
            {laborPercentage.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            of sales
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>0%</span>
            <span className="font-medium">Target: {config.targetPercentage}%</span>
            <span>{config.targetPercentage * 1.5}%</span>
          </div>
          <Progress 
            value={laborPercentage} 
            max={config.targetPercentage * 1.5}
            className="h-2"
          />
        </div>

        {/* Sparkline */}
        {config.showSparkline && sparklineData && (
          <div className={`w-full h-12 ${isOverBudget ? 'text-destructive' : 'text-primary'}`}>
            <Sparkline 
              data={sparklineData}
              width={200}
              height={48}
            />
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Cost</p>
          <p className="text-sm font-semibold">
            RM {Number(metrics?.total_labor_cost || 0).toFixed(0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Staff</p>
          <p className="text-sm font-semibold">
            {metrics?.active_employees || 0}
          </p>
        </div>
      </div>
    </Card>
  );
}
