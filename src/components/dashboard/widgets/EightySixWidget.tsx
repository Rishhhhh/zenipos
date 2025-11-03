import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useWidgetConfig } from '@/hooks/useWidgetConfig';
import { EightySixConfig } from '@/types/widgetConfigs';
import { cn } from '@/lib/utils';
import { EightySixBadge } from '@/components/ui/eighty-six-badge';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function EightySixWidget() {
  const { config } = useWidgetConfig<EightySixConfig>('eighty-six');
  const navigate = useNavigate();

  const { data: eightySixItems = [], isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['eighty-six-items-widget', config.maxItems],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_eighty_six_items');
      if (error) throw error;
      return (data || []).slice(0, config.maxItems);
    },
    refetchInterval: config.refreshInterval * 1000,
  });

  const lastUpdated = formatDistanceToNow(dataUpdatedAt, { addSuffix: true });

  return (
    <Card className={cn(
      "glass-card flex flex-col w-[240px] h-[240px]",
      config.compactMode ? "p-2.5" : "p-3"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between",
        config.compactMode ? "mb-2" : "mb-3"
      )}>
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn(
            "text-warning",
            config.compactMode ? "h-3.5 w-3.5" : "h-4 w-4"
          )} />
          <h3 className={cn(
            "font-semibold",
            config.compactMode ? "text-sm" : "text-base"
          )}>
            {config.compactMode ? "86" : "86 List"}
          </h3>
          {eightySixItems.length > 0 && (
            <Badge variant="destructive" className={cn(
              config.compactMode ? "text-xs h-4 px-1.5" : "text-sm h-5 px-2"
            )}>
              {eightySixItems.length}
            </Badge>
          )}
        </div>
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
        "flex-1 min-h-0",
        config.showLastUpdated ? "mb-2" : ""
      )}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className={cn(
                "w-full rounded",
                config.compactMode ? "h-[40px]" : "h-[48px]"
              )} />
            ))}
          </div>
        ) : eightySixItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Package className={cn(
              "mb-2 opacity-50",
              config.compactMode ? "h-8 w-8" : "h-10 w-10"
            )} />
            <p className={cn(
              "text-center",
              config.compactMode ? "text-xs" : "text-sm"
            )}>
              All items available
            </p>
          </div>
        ) : (
          <div className={cn(
            "space-y-2 overflow-y-auto",
            config.compactMode ? "max-h-[172px]" : "max-h-[164px]"
          )}>
            {eightySixItems.map((item: any) => (
              <button
                key={item.id}
                onClick={() => navigate('/admin/eighty-six')}
                className={cn(
                  "w-full flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 transition-all hover:bg-destructive/10 hover:border-destructive/30",
                  config.compactMode ? "px-2.5 py-2 h-[40px]" : "px-3 py-2.5 h-[48px]"
                )}
              >
                <p className={cn(
                  "font-medium line-clamp-1 text-left flex-1 mr-2",
                  config.compactMode ? "text-[13px]" : "text-sm"
                )}>
                  {item.menu_item_name}
                </p>
                <EightySixBadge 
                  size={config.compactMode ? "sm" : "default"}
                  showIcon={false}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Last Updated Footer */}
      {config.showLastUpdated && !isLoading && (
        <div className="pt-2 border-t border-border/30">
          <p className={cn(
            "text-muted-foreground text-center",
            config.compactMode ? "text-[10px]" : "text-[11px]"
          )}>
            ⏰ Updated {lastUpdated}
          </p>
        </div>
      )}
    </Card>
  );
}
