import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTablesWithOrders, getTodayMetrics } from '@/lib/queries/tableQueries';
import { TableGrid } from '@/components/tables/TableGrid';
import { TableOrderDetails } from '@/components/tables/TableOrderDetails';
import { TablePaymentModal } from '@/components/tables/TablePaymentModal';
import { TableHistoryPanel } from '@/components/tables/TableHistoryPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, DollarSign, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function TableManagement() {
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);

  // Query tables with orders
  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: getTablesWithOrders,
    refetchInterval: 3000, // Fallback polling every 3s
  });

  // Query today's metrics
  const { data: metrics } = useQuery({
    queryKey: ['today-metrics'],
    queryFn: getTodayMetrics,
    refetchInterval: 30000, // Refresh every 30s
  });

  // Realtime subscriptions
  useEffect(() => {
    const tablesChannel = supabase
      .channel('tables-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tables'] });
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: 'status=in.(delivered,paid)'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tables'] });
          queryClient.invalidateQueries({ queryKey: ['today-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['recent-completed-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tablesChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [queryClient]);

  const handleTableClick = (tableId: string) => {
    const table = tables?.find((t: any) => t.id === tableId);
    setSelectedTable(table);
  };

  const handlePayment = () => {
    setShowPayment(true);
  };

  const totalTables = tables?.length || 0;
  const occupiedTables = tables?.filter((t: any) => t.current_order)?.length || 0;
  const occupancyRate = totalTables > 0 ? (occupiedTables / totalTables * 100).toFixed(0) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Table Management</h1>
          <p className="text-muted-foreground">Monitor table status and process payments</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['tables'] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Occupancy</p>
                <p className="text-2xl font-bold">{occupancyRate}%</p>
                <p className="text-xs text-muted-foreground">
                  {occupiedTables}/{totalTables} tables
                </p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold">RM {metrics?.totalRevenue.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Awaiting Payment</p>
                <p className="text-2xl font-bold">{metrics?.awaitingPayment || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-warning opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Turnover</p>
                <p className="text-2xl font-bold">{metrics?.avgTurnoverMinutes || 0}m</p>
              </div>
              <Clock className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <TableGrid
            tables={tables || []}
            isLoading={isLoading}
            onTableClick={handleTableClick}
          />
        </div>

        <div>
          <TableHistoryPanel />
        </div>
      </div>

      {/* Modals */}
      {selectedTable && (
        <>
          <TableOrderDetails
            open={!!selectedTable && !showPayment}
            onOpenChange={(open) => !open && setSelectedTable(null)}
            table={selectedTable}
            onPayment={handlePayment}
          />

          {selectedTable.current_order && (
            <TablePaymentModal
              open={showPayment}
              onOpenChange={setShowPayment}
              order={selectedTable.current_order}
              table={selectedTable}
              onSuccess={() => {
                setShowPayment(false);
                setSelectedTable(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
