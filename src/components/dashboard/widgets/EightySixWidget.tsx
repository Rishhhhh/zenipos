import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useWidgetConfig } from '@/hooks/useWidgetConfig';
import { EightySixConfig } from '@/types/widgetConfigs';
import { EightySixBadge } from '@/components/ui/eighty-six-badge';

export function EightySixWidget() {
  const navigate = useNavigate();
  const { config } = useWidgetConfig<EightySixConfig>('eighty-six');
  const maxItems = config.maxItems || 3;

  const { data: eightySixItems = [], isLoading } = useQuery({
    queryKey: ['eighty-six-items-widget'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_eighty_six_items');
      if (error) throw error;
      return (data || []).slice(0, maxItems);
    },
    refetchInterval: (config.refreshInterval || 30) * 1000,
  });

  return (
    <Card className="glass-card p-3 w-[240px] h-[240px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h3 className="font-semibold text-xs">86 List</h3>
        </div>
        {eightySixItems.length > 0 && (
          <Badge variant="destructive" className="h-5 text-[10px] px-1.5">
            {eightySixItems.length}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-xs text-muted-foreground">Loading...</div>
        </div>
      ) : eightySixItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <AlertTriangle className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-xs font-medium">All Available</p>
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto">
            {eightySixItems.map((item: any) => (
              <div
                key={item.id}
                className="p-2 bg-warning/5 rounded-md border border-warning/20 hover:bg-warning/10 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium line-clamp-1 flex-1">
                    {item.menu_item_name}
                  </p>
                  <EightySixBadge size="sm" showIcon={false} />
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 h-7 text-xs"
            onClick={() => navigate('/admin/eighty-six')}
          >
            Manage
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </>
      )}
    </Card>
  );
}
