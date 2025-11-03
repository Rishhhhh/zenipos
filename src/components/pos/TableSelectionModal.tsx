import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ShoppingBag, NfcIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NFCCardScanner } from '@/components/nfc/NFCCardScanner';

interface TableSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (tableId: string | null, orderType: 'dine_in' | 'takeaway', tableLabel?: string | null, nfcCardId?: string | null) => void;
}

export function TableSelectionModal({ open, onOpenChange, onSelect }: TableSelectionModalProps) {
  const { toast } = useToast();
  
  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('label');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-success/20 text-success border-success/30';
      case 'occupied':
        return 'bg-danger/20 text-danger border-danger/30';
      case 'reserved':
        return 'bg-warning/20 text-warning border-warning/30';
      default:
        return 'bg-muted';
    }
  };

  const handleTableSelect = (tableId: string, status: string, label: string) => {
    if (status !== 'available') {
      toast({
        variant: 'destructive',
        title: 'Table Unavailable',
        description: 'This table is currently occupied or reserved',
      });
      return;
    }
    
    onSelect(tableId, 'dine_in', label);
    onOpenChange(false);
  };

  const handleTakeaway = () => {
    onSelect(null, 'takeaway', null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Select Table or Order Type</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Selection</TabsTrigger>
            <TabsTrigger value="nfc">
              <NfcIcon className="mr-2 h-4 w-4" />
              NFC Scan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6 mt-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              size="lg"
              variant="outline"
              className="h-24"
              onClick={handleTakeaway}
            >
              <div className="flex flex-col items-center gap-2">
                <ShoppingBag className="h-8 w-8" />
                <span className="font-semibold">Takeaway</span>
              </div>
            </Button>
            
            <Card className="p-4 flex items-center justify-center bg-muted/30">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Dine-In</p>
                <p className="text-xs text-muted-foreground mt-1">Select a table below</p>
              </div>
            </Card>
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
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto">
                {tables?.map((table) => (
                  <Card
                    key={table.id}
                    className={`p-4 cursor-pointer transition-all hover:scale-105 ${getStatusColor(table.status)} ${
                      table.status === 'available' ? 'hover:border-primary' : 'cursor-not-allowed opacity-60'
                    }`}
                    onClick={() => handleTableSelect(table.id, table.status, table.label)}
                  >
                    <div className="text-center">
                      <div className="text-xl font-bold mb-2">{table.label}</div>
                      <div className="flex items-center justify-center gap-1 text-xs mb-2">
                        <Users className="h-3 w-3" />
                        <span>{table.seats}</span>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {table.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="nfc" className="mt-4">
          <NFCCardScanner
            onScanSuccess={(tableId, nfcCardId) => {
              // Find table label for this tableId
              const table = tables?.find(t => t.id === tableId);
              onSelect(tableId, 'dine_in', table?.label || null, nfcCardId);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        </TabsContent>
      </Tabs>
      </DialogContent>
    </Dialog>
  );
}
