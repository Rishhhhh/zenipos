import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export function PendingModsWidget() {
  const navigate = useNavigate();

  const { data: pendingMods = [], isLoading } = useQuery({
    queryKey: ['pending-mods-widget'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_modifications')
        .select('*')
        .eq('approval_status', 'pending')
        .eq('approval_required', true)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
        <AlertTriangle className="h-4 w-4 text-warning" />
      </CardHeader>
      <CardContent>
        {pendingMods.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No pending approvals
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{pendingMods.length}</span>
              <Badge variant="destructive">Needs Approval</Badge>
            </div>

            <div className="space-y-2">
              {pendingMods.map((mod: any) => (
                <div
                  key={mod.id}
                  className="p-2 bg-warning/5 rounded-lg border border-warning/20"
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium capitalize">
                      {mod.modification_type} Request
                    </p>
                    {mod.wastage_cost > 0 && (
                      <span className="text-xs text-destructive font-medium">
                        RM {mod.wastage_cost.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Order: {mod.order_id?.substring(0, 8)}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(mod.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/admin/pending-modifications')}
            >
              Review All Requests
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
