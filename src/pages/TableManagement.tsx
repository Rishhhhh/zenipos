import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTablesWithOrders, getTodayMetrics } from '@/lib/queries/tableQueries';
import { TableGrid } from '@/components/tables/TableGrid';
import { TableOrderDetails } from '@/components/tables/TableOrderDetails';
import { TablePaymentModal } from '@/components/tables/TablePaymentModal';
import { TableHistoryPanel } from '@/components/tables/TableHistoryPanel';
import { TableConfigModal } from '@/components/tables/TableConfigModal';
import { ReservationModal } from '@/components/tables/ReservationModal';
import { TableLayoutEditor } from '@/components/tables/TableLayoutEditor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, DollarSign, Clock, Users, NfcIcon, Grid3x3, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrderRealtime } from '@/hooks/useOrderRealtime';
import { PaymentNFCScannerModal } from '@/components/pos/PaymentNFCScannerModal';
import { useToast } from '@/hooks/use-toast';
import { useBranch } from '@/contexts/BranchContext';

export default function TableManagement() {
  useOrderRealtime(); // Enable real-time sync
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentBranch } = useBranch();
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showPaymentNFCScanner, setShowPaymentNFCScanner] = useState(false);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [configTable, setConfigTable] = useState<any>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [layoutMode, setLayoutMode] = useState(false);

  // Query tables with orders
  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: getTablesWithOrders,
    refetchInterval: 3000, // Fallback polling every 3s
  });

  // Query today's metrics
  const { data: metrics } = useQuery({
    queryKey: ['today-metrics', currentBranch?.id],
    queryFn: () => getTodayMetrics(currentBranch!.id),
    enabled: !!currentBranch?.id,
    refetchInterval: 30000, // Refresh every 30s
  });

  // OPTIMIZED: Combined single-channel realtime subscription
  useEffect(() => {
    const handleChange = () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['today-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['recent-completed-orders'] });
    };

    // Single channel for both tables and orders updates
    const channel = supabase
      .channel('table-management-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, handleChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handleChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleTableClick = (tableId: string) => {
    const table = tables?.find((t: any) => t.id === tableId);
    setSelectedTable(table);
  };

  const handlePayment = () => {
    setShowPayment(true);
  };

  const handleSaveConfig = async (updates: any) => {
    if (!configTable) return;
    
    const { error } = await supabase
      .from('tables')
      .update(updates)
      .eq('id', configTable.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save table configuration',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Table configuration saved',
    });

    // Refresh tables
    queryClient.invalidateQueries({ queryKey: ['tables'] });
    setConfigTable(null);
  };

  const totalTables = tables?.length || 0;
  const occupiedTables = tables?.filter((t: any) => {
    // Only count tables with active orders (not paid/cancelled)
    return t.current_order && 
           t.current_order.id && 
           ['pending', 'preparing', 'delivered'].includes(t.current_order.status);
  })?.length || 0;
  const occupancyRate = totalTables > 0 ? (occupiedTables / totalTables * 100).toFixed(0) : 0;

  return (
    <div 
      className="h-full flex flex-col overflow-hidden"
      style={{ height: 'calc(100vh - 60px)' }}
    >
      {/* Header - fixed */}
      <div className="flex-shrink-0 p-4 md:p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Table Management</h1>
            <p className="text-muted-foreground">Monitor table status and process payments</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['tables'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReservationModal(true)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Reservations
            </Button>
            
            <Button
              variant={layoutMode ? "default" : "outline"}
              size="sm"
              onClick={() => setLayoutMode(!layoutMode)}
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              {layoutMode ? 'Exit Layout' : 'Edit Layout'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPaymentNFCScanner(true)}
            >
              <NfcIcon className="h-4 w-4 mr-2" />
              Quick Pay
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards - fixed */}
      <div className="flex-shrink-0 px-4 md:px-6 py-4 border-b">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </div>

      {/* Tables Grid - scrollable */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-4">
        {layoutMode ? (
          <TableLayoutEditor
            tables={tables || []}
            onExit={() => setLayoutMode(false)}
            onSave={() => {
              setLayoutMode(false);
              queryClient.invalidateQueries({ queryKey: ['tables'] });
            }}
          />
        ) : (
          <div className="max-w-[1600px] mx-auto">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading tables...</div>
            ) : (
              <TableGrid
          tables={tables || []}
          isLoading={isLoading}
          onTableClick={handleTableClick}
          onConfigureTable={(tableId) => {
            const table = tables?.find(t => t.id === tableId);
            if (table) setConfigTable(table);
          }}
              />
            )}
          </div>
        )}
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
                setPendingPaymentOrder(null);
                queryClient.invalidateQueries({ queryKey: ['tables'] });
                queryClient.invalidateQueries({ queryKey: ['today-metrics'] });
              }}
            />
          )}
        </>
      )}

      {/* Payment NFC Scanner Modal */}
      <PaymentNFCScannerModal
        open={showPaymentNFCScanner}
        onOpenChange={setShowPaymentNFCScanner}
        onOrderFound={(order) => {
          setPendingPaymentOrder(order);
          setShowPaymentNFCScanner(false);
          
          const orderTable = tables?.find((t: any) => 
            t.current_order?.id === order.id
          );
          
          if (orderTable) {
            setSelectedTable(orderTable);
            setShowPayment(true);
          } else {
            toast({
              title: 'Order Found',
              description: `Takeaway order - RM ${order.total.toFixed(2)}`,
            });
            setShowPaymentModal(true);
          }
        }}
      />

      {/* Standalone Payment Modal for NFC Scanned Orders */}
      {pendingPaymentOrder && !selectedTable && (
        <TablePaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          order={pendingPaymentOrder}
          table={null}
          onSuccess={() => {
            setShowPaymentModal(false);
            setPendingPaymentOrder(null);
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            queryClient.invalidateQueries({ queryKey: ['today-metrics'] });
            toast({
              title: 'Payment Complete',
              description: 'Order paid successfully',
            });
          }}
        />
      )}

      {/* Table Configuration Modal */}
      {configTable && (
        <TableConfigModal
          open={!!configTable}
          onOpenChange={(open) => !open && setConfigTable(null)}
          table={configTable}
          onSave={handleSaveConfig}
        />
      )}
      
      <ReservationModal
        open={showReservationModal}
        onOpenChange={setShowReservationModal}
        tables={tables || []}
      />
    </div>
  );
}
