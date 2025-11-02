import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Users, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface LaborCostWidgetProps {
  branchId?: string;
  targetPercentage?: number;
}

export function LaborCostWidget({ branchId, targetPercentage = 25 }: LaborCostWidgetProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['labor-metrics', branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_labor_metrics', {
        branch_id_param: branchId || null,
      });
      if (error) throw error;
      return data?.[0];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Labor Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const laborPercentage = Number(metrics?.labor_percentage || 0);
  const isOverBudget = laborPercentage > targetPercentage;
  const variance = laborPercentage - targetPercentage;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Labor Cost</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Labor Percentage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {laborPercentage.toFixed(1)}%
                </span>
                {isOverBudget ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{variance.toFixed(1)}%
                  </Badge>
                ) : (
                  <Badge variant="default" className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {variance.toFixed(1)}%
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                Target: {targetPercentage}%
              </span>
            </div>
            <Progress 
              value={laborPercentage} 
              max={targetPercentage * 1.5}
              className="h-2"
            />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <DollarSign className="h-3 w-3" />
                <span>Labor Cost</span>
              </div>
              <p className="text-lg font-semibold">
                RM {Number(metrics?.total_labor_cost || 0).toFixed(2)}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <DollarSign className="h-3 w-3" />
                <span>Sales</span>
              </div>
              <p className="text-lg font-semibold">
                RM {Number(metrics?.total_sales || 0).toFixed(2)}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
                <span>Hours Worked</span>
              </div>
              <p className="text-lg font-semibold">
                {Number(metrics?.total_hours || 0).toFixed(1)}h
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Users className="h-3 w-3" />
                <span>Active Staff</span>
              </div>
              <p className="text-lg font-semibold">
                {metrics?.active_employees || 0}
              </p>
            </div>
          </div>

          {/* Overtime Alert */}
          {Number(metrics?.overtime_hours || 0) > 0 && (
            <div className="flex items-center gap-2 p-2 bg-warning/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <div>
                <p className="text-xs font-medium">Overtime Alert</p>
                <p className="text-xs text-muted-foreground">
                  {Number(metrics.overtime_hours).toFixed(1)}h overtime today
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
