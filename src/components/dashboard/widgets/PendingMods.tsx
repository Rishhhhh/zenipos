import { memo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Clock, DollarSign, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useWidgetConfig } from '@/hooks/useWidgetConfig';
import { PendingModsConfig } from '@/types/widgetConfigs';
import { cn } from '@/lib/utils';

export default memo(function PendingMods() {
  const navigate = useNavigate();
  const { config } = useWidgetConfig<PendingModsConfig>('pending-mods');

  const { data: pendingMods = [], isLoading, refetch } = useQuery({
    queryKey: ['pending-mods-widget', config.maxItems, config.sortBy],
    queryFn: async () => {
      let query = supabase.from('order_modifications').select('*').eq('approval_status', 'pending').eq('approval_required', true);
      if (config.sortBy === 'wastage') {
        query = query.order('wastage_cost', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      query = query.limit(config.maxItems);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: config.refreshInterval * 1000,
  });

  const getWastageBadgeVariant = useCallback((cost: number) => {
    if (cost >= 10) return 'destructive';
    if (cost >= 5) return 'default';
    return 'secondary';
  }, []);

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleNavigateToPendingMods = useCallback(() => {
    navigate('/admin/pending-modifications');
  }, [navigate]);

  return (
    <Card className={cn("glass-card flex flex-col w-[360px] h-[300px]", config.compactMode ? "p-3" : "p-4")}>
      <div className={cn("flex items-center justify-between", config.compactMode ? "mb-2" : "mb-3")}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h3 className={cn("font-semibold", config.compactMode ? "text-sm" : "text-base")}>Pending Approvals</h3>
          {pendingMods.length > 0 && <Badge variant="destructive" className="text-xs">{pendingMods.length}</Badge>}
        </div>
        <Button onClick={handleRefetch} variant="ghost" size="sm" className="h-8 w-8 p-0"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <div className={cn("flex-1 overflow-y-auto min-h-0", config.compactMode ? "space-y-1.5" : "space-y-2")}>
        {isLoading ? (
          <>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className={cn("w-full rounded", config.compactMode ? "h-[40px]" : "h-[48px]")} />)}</>
        ) : pendingMods.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm text-center">No pending approvals</p>
          </div>
        ) : (
          pendingMods.map((mod: any) => (
            <button key={mod.id} onClick={handleNavigateToPendingMods} className={cn("w-full text-left rounded-lg border border-warning/20 bg-warning/5 transition-all hover:bg-warning/10 hover:border-warning/30", config.compactMode ? "p-2 min-h-[40px]" : "p-2.5 min-h-[48px]")}>
              {config.compactMode ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize line-clamp-1">{mod.modification_type}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(mod.created_at), { addSuffix: true })}</span>
                  </div>
                  {config.showWastageCost && mod.wastage_cost > 0 && <Badge variant={getWastageBadgeVariant(mod.wastage_cost)} className="text-xs whitespace-nowrap"><DollarSign className="h-3 w-3 mr-0.5" />{mod.wastage_cost.toFixed(2)}</Badge>}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium capitalize">{mod.modification_type} Request</p>
                    {config.showWastageCost && mod.wastage_cost > 0 && <Badge variant={getWastageBadgeVariant(mod.wastage_cost)} className="text-xs">RM {mod.wastage_cost.toFixed(2)}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">Order: {mod.order_id?.substring(0, 8)}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(mod.created_at), { addSuffix: true })}</div>
                </>
              )}
            </button>
          ))
        )}
      </div>
    </Card>
  );
});
