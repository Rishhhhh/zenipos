import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function SimulationCleanupPanel() {
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);

  // Query simulated data count
  const { data: counts, refetch } = useQuery({
    queryKey: ['simulated-data-counts'],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('metadata->>simulated', 'true');

      return {
        orders: count || 0,
      };
    },
    refetchInterval: 10000, // Check every 10 seconds
  });

  const handleCleanup = async () => {
    setIsClearing(true);
    try {
      // Call the function directly using postgrest
      const { data, error } = await supabase
        .rpc('cleanup_simulated_orders' as any);
      
      if (error) throw error;
      
      const result = Array.isArray(data) ? data[0] : data;
      toast({
        title: '🧹 Simulated Data Removed',
        description: (
          <div className="space-y-1 text-sm">
            <div>• Orders: {result?.deleted_orders || 0}</div>
            <div>• Items: {result?.deleted_items || 0}</div>
            <div>• Payments: {result?.deleted_payments || 0}</div>
            <div className="text-xs text-muted-foreground mt-2">
              Completed in {result?.execution_time_ms || 0}ms
            </div>
          </div>
        ),
      });
      
      refetch();
    } catch (error) {
      toast({
        title: 'Cleanup Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const hasSimulatedData = (counts?.orders || 0) > 0;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Simulation Data Cleanup
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Remove test orders created by the simulation engine
          </p>
        </div>
        <Badge variant={hasSimulatedData ? 'destructive' : 'secondary'}>
          {counts?.orders || 0} simulated orders
        </Badge>
      </div>

      {hasSimulatedData ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Simulated data detected</p>
              <p className="text-muted-foreground">
                Found {counts?.orders} test orders. These should be removed before using real data.
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" disabled={isClearing}>
                <Trash2 className="mr-2 h-4 w-4" />
                {isClearing ? 'Removing...' : 'Remove All Simulated Data'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Simulation Data Removal</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>{counts?.orders} simulated orders</li>
                    <li>All associated order items</li>
                    <li>All associated payments</li>
                  </ul>
                  <p className="mt-3 font-semibold">
                    Real orders will NOT be affected. Only orders with metadata.simulated = true will be removed.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanup}>
                  Yes, Remove Simulated Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-600 font-medium">
            No simulated data found. Database is clean! ✨
          </p>
        </div>
      )}
    </Card>
  );
}
