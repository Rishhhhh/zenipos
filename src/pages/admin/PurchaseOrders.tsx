import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PurchaseOrders() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('active', true);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Mock purchase orders data (you would create a purchase_orders table)
  const mockPurchaseOrders = [
    {
      id: '1',
      po_number: 'PO-2024-001',
      supplier_name: suppliers?.[0]?.name || 'Supplier A',
      status: 'pending',
      total_amount: 1250.00,
      created_at: new Date().toISOString(),
      expected_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/20 text-warning';
      case 'approved':
        return 'bg-primary/20 text-primary';
      case 'received':
        return 'bg-success/20 text-success';
      case 'cancelled':
        return 'bg-danger/20 text-danger';
      default:
        return 'bg-muted';
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Purchase Order
          </Button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'approved', 'received', 'cancelled'].map((status) => (
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
            {mockPurchaseOrders.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Purchase Orders</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first purchase order to start managing inventory procurement
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Purchase Order
                </Button>
              </Card>
            ) : (
              mockPurchaseOrders
                .filter((po) => selectedStatus === 'all' || po.status === selectedStatus)
                .map((po) => (
                  <Card key={po.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{po.po_number}</h3>
                          <Badge className={getStatusColor(po.status)}>{po.status}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p><strong>Supplier:</strong> {po.supplier_name}</p>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Created: {new Date(po.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Expected: {new Date(po.expected_delivery).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${po.total_amount.toFixed(2)}</p>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline">View</Button>
                          {po.status === 'pending' && (
                            <>
                              <Button size="sm">Approve</Button>
                              <Button size="sm" variant="destructive">Cancel</Button>
                            </>
                          )}
                          {po.status === 'approved' && (
                            <Button size="sm">Mark Received</Button>
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
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">
              {mockPurchaseOrders.filter((po) => po.status === 'pending').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold">
              {mockPurchaseOrders.filter((po) => po.status === 'approved').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Received</p>
            <p className="text-2xl font-bold">
              {mockPurchaseOrders.filter((po) => po.status === 'received').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">
              ${mockPurchaseOrders.reduce((sum, po) => sum + po.total_amount, 0).toFixed(2)}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
