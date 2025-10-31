import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface EightySixListPanelProps {
  branchId?: string;
  compact?: boolean;
}

export function EightySixListPanel({ branchId, compact = false }: EightySixListPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active 86 items
  const { data: eightySixItems = [], isLoading } = useQuery({
    queryKey: ['eighty-six-items', branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_eighty_six_items', {
        branch_id_param: branchId || null,
      });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds as fallback
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('eighty-six-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'eighty_six_items',
        },
        (payload) => {
          console.log('86 list update:', payload);
          queryClient.invalidateQueries({ queryKey: ['eighty-six-items'] });
          queryClient.invalidateQueries({ queryKey: ['menu-items'] });
          
          // Show toast notification for new 86's
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'Item 86\'d',
              description: 'A menu item has been marked as out of stock',
            });
          } else if (payload.eventType === 'UPDATE' && !(payload.new as any).active) {
            toast({
              title: 'Item Restored',
              description: 'A menu item is now back in stock',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  // Restore item mutation
  const restoreItem = useMutation({
    mutationFn: async (eightySixId: string) => {
      const { error } = await supabase.rpc('restore_eighty_six_item', {
        eighty_six_id_param: eightySixId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Item Restored',
        description: 'Item is now back in stock',
      });
      queryClient.invalidateQueries({ queryKey: ['eighty-six-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Restore',
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (eightySixItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            All Items Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No items are currently marked as 86'd
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          86 List ({eightySixItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={compact ? 'h-64' : 'h-96'}>
          <div className="space-y-3">
            {eightySixItems.map((item: any) => (
              <div
                key={item.id}
                className="p-3 border rounded-lg bg-warning/5 hover:bg-warning/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{item.menu_item_name}</h4>
                      {item.auto_generated && (
                        <Badge variant="outline" className="text-xs">
                          Auto
                        </Badge>
                      )}
                    </div>
                    {item.menu_item_category && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {item.menu_item_category}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.reason}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restoreItem.mutate(item.id)}
                    disabled={restoreItem.isPending}
                  >
                    {restoreItem.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Restore'
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {item.estimated_return_at && (
                    <div>
                      Back: {format(new Date(item.estimated_return_at), 'h:mm a')}
                    </div>
                  )}
                  {item.created_by_name && (
                    <div>By: {item.created_by_name}</div>
                  )}
                </div>

                {item.alternative_items && item.alternative_items.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs font-medium mb-1">Suggested Alternatives:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.alternative_items.map((altId: string) => (
                        <Badge key={altId} variant="secondary" className="text-xs">
                          Alt Available
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
