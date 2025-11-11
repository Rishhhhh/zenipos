import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ShoppingBag, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCartStore } from '@/lib/store/cart';
import { getTablesWithOrders } from '@/lib/queries/tableQueries';
import { getTableStatus } from '@/lib/utils/tableStatus';

interface TableSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (tableId: string | null, orderType: 'dine_in' | 'takeaway', tableLabel?: string | null, nfcCardId?: string | null) => void;
}

export function TableSelectionModal({ open, onOpenChange, onSelect }: TableSelectionModalProps) {
  const { toast } = useToast();
  const { items, table_id: currentTableId, confirmTableChange } = useCartStore();
  const [pendingSelection, setPendingSelection] = useState<{ tableId: string | null; orderType: 'dine_in' | 'takeaway'; label?: string | null; nfcCardId?: string | null } | null>(null);
  
  const hasCartItems = items.length > 0;
  const isChangingTable = currentTableId && hasCartItems;
  
  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables-with-orders'],
    queryFn: getTablesWithOrders,
    enabled: open,
  });

  const handleTableSelect = (table: any, label: string) => {
    const tableStatus = getTableStatus(table);
    
    if (!tableStatus.canAssignOrder) {
      toast({
        variant: 'destructive',
        title: 'Table Unavailable',
        description: tableStatus.label === 'Reserved' 
          ? 'This table is reserved'
          : `This table has an active order (${tableStatus.label})`,
      });
      return;
    }
    
    // Check if cart needs to be cleared
    if (isChangingTable) {
      setPendingSelection({ tableId: table.id, orderType: 'dine_in', label });
      return;
    }
    
    onSelect(table.id, 'dine_in', label);
    onOpenChange(false);
  };

  const handleTakeaway = () => {
    // Check if cart needs to be cleared
    if (isChangingTable) {
      setPendingSelection({ tableId: null, orderType: 'takeaway', label: null });
      return;
    }
    
    onSelect(null, 'takeaway', null);
    onOpenChange(false);
  };

  const handleConfirmChange = () => {
    if (!pendingSelection) return;
    
    // Clear cart and apply new table
    confirmTableChange(pendingSelection.tableId, pendingSelection.orderType, pendingSelection.label);
    
    // Notify parent
    onSelect(pendingSelection.tableId, pendingSelection.orderType, pendingSelection.label, pendingSelection.nfcCardId);
    
    setPendingSelection(null);
    onOpenChange(false);
    
    toast({
      title: 'Cart Cleared',
      description: 'Previous items removed. Starting new order.',
    });
  };

  const handleCancelChange = () => {
    setPendingSelection(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Select Table or Order Type</DialogTitle>
          {isChangingTable && !pendingSelection && (
            <DialogDescription>
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Warning: Changing table will clear your current cart ({items.length} items)
                </AlertDescription>
              </Alert>
            </DialogDescription>
          )}
        </DialogHeader>
        
        {pendingSelection && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Clear cart and switch to {pendingSelection.orderType === 'takeaway' ? 'Takeaway' : `Table ${pendingSelection.label}`}?</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelChange}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={handleConfirmChange}>
                  Clear Cart & Switch
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 mt-4">
          {/* Quick Actions */}
          <div className="flex gap-4 mb-6">
            <Button
              size="lg"
              variant="outline"
              className="flex-1 h-20 hover:bg-accent hover:border-primary"
              onClick={handleTakeaway}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-10 w-10" />
                <div className="text-left">
                  <p className="font-semibold text-lg">Takeaway</p>
                  <p className="text-xs text-muted-foreground">Skip table</p>
                </div>
              </div>
            </Button>
            
            <div className="flex-1 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <div className="text-center">
                <p className="font-semibold text-muted-foreground">Dine-In</p>
                <p className="text-xs text-muted-foreground">Select table below</p>
              </div>
            </div>
          </div>

          {/* Tables Grid */}
          <div>
            <h3 className="font-semibold mb-3">Available Tables</h3>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading tables...</p>
            ) : tables?.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No tables configured. Contact your manager.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-5 md:grid-cols-6 gap-4 max-h-[450px] overflow-y-auto p-1">
                {tables?.map((table) => {
                  const tableStatus = getTableStatus(table);
                  return (
                    <Card
                      key={table.id}
                      className={`p-5 cursor-pointer transition-all hover:scale-110 hover:shadow-xl
                        ${tableStatus.bgColor} ${tableStatus.textColor} ${tableStatus.borderColor}
                        border-2
                        ${tableStatus.canAssignOrder ? '' : 'cursor-not-allowed opacity-60'}
                      `}
                      onClick={() => handleTableSelect(table, table.label)}
                    >
                      <div className="text-center space-y-2">
                        <div className="text-2xl font-bold">{table.label}</div>
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <Users className="h-4 w-4" />
                          <span>{table.seats}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{tableStatus.label}</Badge>
                        {tableStatus.order && (
                          <div className="text-xs mt-2 font-medium">
                            RM {tableStatus.order.total.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
