// @ts-nocheck - Types will auto-regenerate after purchase_orders migration
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBranch } from '@/contexts/BranchContext';
import { PurchaseOrderModal } from '@/components/admin/PurchaseOrderModal';

export default function PurchaseOrders() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const { currentBranch } = useBranch();

  const { data: purchaseOrders, refetch } = useQuery({
    queryKey: ['purchase_orders', currentBranch?.id, selectedStatus],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      
      // @ts-ignore - Types will update after migration
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name),
          purchase_order_items(
            id,
            quantity,
            unit_cost,
            total_cost,
            inventory_items(name, unit)
          )
        `)
        .eq('branch_id', currentBranch.id)
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentBranch?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-muted/20 text-muted-foreground';
      case 'submitted':
        return 'bg-warning/20 text-warning';
      case 'approved':
        return 'bg-primary/20 text-primary';
      case 'received':
        return 'bg-success/20 text-success';
      case 'cancelled':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted';
    }
  };

  const handleStatusUpdate = async (poId: string, newStatus: string) => {
    const updateData: any = { status: newStatus };
    
    if (newStatus === 'submitted') {
      updateData.submitted_at = new Date().toISOString();
    } else if (newStatus === 'approved') {
      updateData.approved_at = new Date().toISOString();
    } else if (newStatus === 'received') {
      updateData.received_at = new Date().toISOString();
    }

    // @ts-ignore - Types will update after migration
    const { error } = await supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', poId);

    if (!error) {
      refetch();
    }
  };

  return (
    <div className="kiosk-layout p-8 pb-32 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground mt-2">Manage inventory purchase orders</p>
          </div>
          <Button onClick={() => { setSelectedPO(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Purchase Order
          </Button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6">
          {['all', 'draft', 'submitted', 'approved', 'received', 'cancelled'].map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>

        {/* Purchase Orders List */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-4">
            {!purchaseOrders || purchaseOrders.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Purchase Orders</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first purchase order to start managing inventory procurement
                </p>
                <Button onClick={() => { setSelectedPO(null); setModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Purchase Order
                </Button>
              </Card>
            ) : (
              purchaseOrders.map((po) => (
                  <Card key={po.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{po.order_number}</h3>
                          <Badge className={getStatusColor(po.status)}>{po.status}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p><strong>Supplier:</strong> {po.suppliers?.name}</p>
                          <p><strong>Items:</strong> {po.purchase_order_items?.length || 0}</p>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Created: {new Date(po.created_at).toLocaleDateString()}</span>
                          </div>
                          {po.expected_delivery && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Expected: {new Date(po.expected_delivery).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${po.total_amount.toFixed(2)}</p>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedPO(po); setModalOpen(true); }}>View</Button>
                          {po.status === 'draft' && (
                            <>
                              <Button size="sm" onClick={() => handleStatusUpdate(po.id, 'submitted')}>Submit</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(po.id, 'cancelled')}>Cancel</Button>
                            </>
                          )}
                          {po.status === 'submitted' && (
                            <>
                              <Button size="sm" onClick={() => handleStatusUpdate(po.id, 'approved')}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(po.id, 'cancelled')}>Cancel</Button>
                            </>
                          )}
                          {po.status === 'approved' && (
                            <Button size="sm" onClick={() => handleStatusUpdate(po.id, 'received')}>Mark Received</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
            )}
          </div>
        </ScrollArea>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Draft</p>
            <p className="text-2xl font-bold">
              {purchaseOrders?.filter((po) => po.status === 'draft').length || 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Pending Approval</p>
            <p className="text-2xl font-bold">
              {purchaseOrders?.filter((po) => po.status === 'submitted').length || 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold">
              {purchaseOrders?.filter((po) => po.status === 'approved').length || 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">
              ${purchaseOrders?.reduce((sum, po) => sum + po.total_amount, 0).toFixed(2) || '0.00'}
            </p>
          </Card>
        </div>

        <PurchaseOrderModal 
          open={modalOpen}
          onOpenChange={setModalOpen}
          purchaseOrder={selectedPO}
          onSuccess={() => {
            refetch();
            setModalOpen(false);
            setSelectedPO(null);
          }}
        />
      </div>
    </div>
  );
}
