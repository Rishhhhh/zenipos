import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function PendingModifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending modifications
  const { data: pendingMods = [], isLoading } = useQuery({
    queryKey: ['pending-modifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_modifications')
        .select(`
          *,
          order:orders(id, status),
          modified_by_emp:employees!order_modifications_modified_by_fkey(name),
          order_item:order_items(menu_item_id, menu_items(name))
        `)
        .eq('approval_status', 'pending')
        .eq('approval_required', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('modifications-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_modifications',
          filter: 'approval_required=eq.true',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pending-modifications'] });
          toast({
            title: 'New Modification Request',
            description: 'A modification is awaiting approval',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  const approveRecall = useMutation({
    mutationFn: async ({ orderId, modId }: { orderId: string; modId: string }) => {
      const { error } = await supabase.rpc('approve_recall', {
        order_id_param: orderId,
        modification_id_param: modId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Recall Approved',
        description: 'Order has been cancelled and wastage logged',
      });
      queryClient.invalidateQueries({ queryKey: ['pending-modifications'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: error.message,
      });
    },
  });

  const rejectModification = useMutation({
    mutationFn: async (modId: string) => {
      const { error } = await supabase
        .from('order_modifications')
        .update({ approval_status: 'rejected' })
        .eq('id', modId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Request Rejected',
        description: 'Modification request has been rejected',
      });
      queryClient.invalidateQueries({ queryKey: ['pending-modifications'] });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pending Modifications</h1>
        <p className="text-muted-foreground">
          Review and approve order modifications and recalls
        </p>
      </div>

      {pendingMods.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
            <p className="text-lg font-medium mb-2">All Caught Up!</p>
            <p className="text-muted-foreground">
              No pending modification requests
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {pendingMods.map((mod: any) => (
              <Card key={mod.id} className="border-warning">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      <div>
                        <CardTitle className="text-lg capitalize">
                          {mod.modification_type} Request
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Order: {mod.order_id?.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-warning border-warning">
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Requested By</p>
                      <p className="font-medium">{mod.modified_by_emp?.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Requested</p>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(mod.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {mod.reason && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Reason</p>
                      <p className="text-sm">{mod.reason}</p>
                    </div>
                  )}

                  {mod.wastage_cost > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Wastage Cost: RM {mod.wastage_cost.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => rejectModification.mutate(mod.id)}
                      disabled={rejectModification.isPending}
                      className="flex-1"
                    >
                      {rejectModification.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() =>
                        approveRecall.mutate({
                          orderId: mod.order_id,
                          modId: mod.id,
                        })
                      }
                      disabled={approveRecall.isPending}
                      className="flex-1"
                    >
                      {approveRecall.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
