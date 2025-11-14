import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useModalManager } from '@/hooks/useModalManager';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { TransferInventoryModal } from '@/components/admin/TransferInventoryModal';
import { useBranch } from '@/contexts/BranchContext';
import { BranchSelector } from '@/components/branch/BranchSelector';
import {
  Package,
  TrendingDown,
  AlertTriangle,
  Plus,
  RefreshCw,
  Brain,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InventoryManagement() {
  usePerformanceMonitor('InventoryManagement');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openModal } = useModalManager();
  const { currentBranch, branches, isLoading: branchLoading, selectBranch, selectedBranchId } = useBranch();
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [itemToTransfer, setItemToTransfer] = useState<any>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory-items', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*, suppliers(name)')
        .eq('branch_id', currentBranch.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!currentBranch?.id,
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ['inventory-low-stock', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      const { data, error } = await supabase.rpc('get_low_stock_items', {
        branch_id_param: currentBranch.id
      });
      if (error) throw error;
      return data;
    },
    enabled: !!currentBranch?.id,
    refetchInterval: 60000,
  });

  const { data: recentMoves } = useQuery({
    queryKey: ['stock-moves', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_moves')
        .select('*, inventory_items(name, unit)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const lowStockCount = lowStockItems?.length || 0;
  const criticalCount = lowStockItems?.filter(item => item.days_until_stockout < 3).length || 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground">Track stock levels and manage ingredients</p>
          </div>
          <div className="flex gap-2">
            <BranchSelector 
              value={selectedBranchId}
              onChange={selectBranch}
              branches={branches}
              isLoading={branchLoading}
              showAll={false}
            />
            <Button onClick={() => openModal('aiForecast', { lowStockItems: lowStockItems || [] })} variant="outline">
              <Brain className="h-4 w-4 mr-2" />
              AI Forecast
            </Button>
            <Button onClick={() => openModal('inventoryItem', {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
              },
            })}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Package className="h-12 w-12 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{items?.length || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-warning">
            <div className="flex items-center gap-4">
              <TrendingDown className="h-12 w-12 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-warning">{lowStockCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-destructive">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Critical (&lt; 3 days)</p>
                <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="items" className="space-y-6">
          <TabsList>
            <TabsTrigger value="items">
              <Package className="h-4 w-4 mr-2" />
              Inventory Items
            </TabsTrigger>
            <TabsTrigger value="movements">
              <RefreshCw className="h-4 w-4 mr-2" />
              Stock Movements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Item</th>
                      <th className="text-left p-3">SKU</th>
                      <th className="text-right p-3">Stock</th>
                      <th className="text-right p-3">Reorder Point</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items?.map(item => {
                      const isLowStock = item.current_qty <= item.reorder_point;
                      const isCritical = lowStockItems?.find(
                        ls => ls.id === item.id && ls.days_until_stockout < 3
                      );
                      
                      return (
                        <tr key={item.id} className="border-b">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">{item.sku}</td>
                          <td className="p-3 text-right">
                            {item.current_qty} {item.unit}
                          </td>
                          <td className="p-3 text-right text-muted-foreground">
                            {item.reorder_point} {item.unit}
                          </td>
                          <td className="p-3">
                            {isCritical ? (
                              <Badge variant="destructive">Critical</Badge>
                            ) : isLowStock ? (
                              <Badge className="bg-warning text-white">Low</Badge>
                            ) : (
                              <Badge variant="default">OK</Badge>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openModal('stockAdjustment', {
                                  item,
                                  onSuccess: () => {
                                    queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
                                    queryClient.invalidateQueries({ queryKey: ['stock-moves'] });
                                  },
                                })}
                              >
                                Adjust
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setItemToTransfer(item);
                                  setTransferModalOpen(true);
                                }}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="movements">
            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Item</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-right p-3">Quantity</th>
                      <th className="text-left p-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMoves?.map(move => (
                      <tr key={move.id} className="border-b">
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(move.created_at).toLocaleString()}
                        </td>
                        <td className="p-3">{move.inventory_items.name}</td>
                        <td className="p-3">
                          <Badge variant="outline">{move.type.replace('_', ' ')}</Badge>
                        </td>
                  <td className={`p-3 text-right font-medium ${
                    Number(move.quantity) > 0 ? 'text-success' : 'text-destructive'
                  }`}>
                          {move.quantity > 0 ? '+' : ''}{move.quantity} {move.inventory_items.unit}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{move.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <TransferInventoryModal
          open={transferModalOpen}
          onOpenChange={setTransferModalOpen}
          item={itemToTransfer}
        />
      </div>
    </div>
  );
}
