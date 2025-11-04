import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Download, Code, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { generate58mmReceipt, generate80mmKitchenTicket } from "@/lib/print/receiptGenerator";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PrintPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: {
    orderId: string;
    orderNumber: string;
    items: any[];
    subtotal: number;
    tax: number;
    total: number;
    timestamp: Date;
  };
  onSendToPrinter?: () => void;
}

export function PrintPreviewModal({
  open,
  onOpenChange,
  orderData,
  onSendToPrinter,
}: PrintPreviewModalProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [stationTickets, setStationTickets] = useState<Array<{
    stationId: string;
    stationName: string;
    ticket: string;
    items: any[];
  }>>([]);
  const [unroutedItems, setUnroutedItems] = useState<any[]>([]);

  // Fetch order items with station assignments
  useEffect(() => {
    const fetchOrderItemsWithStations = async () => {
      if (!orderData.orderId) return;

      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          *,
          menu_items (
            id,
            name,
            station_id
          ),
          stations (
            id,
            name,
            color
          )
        `)
        .eq('order_id', orderData.orderId);

      if (error) {
        console.error('Failed to fetch order items:', error);
        return;
      }

      // Group items by station
      const stationGroups = new Map<string, any>();
      const unrouted: any[] = [];

      orderItems?.forEach((item: any) => {
        const stationId = item.station_id;
        const stationName = item.stations?.name || 'UNASSIGNED';

        if (!stationId) {
          unrouted.push({
            name: item.menu_items?.name || 'Unknown',
            quantity: item.quantity,
            notes: item.notes,
          });
          return;
        }

        if (!stationGroups.has(stationId)) {
          stationGroups.set(stationId, {
            stationId,
            stationName,
            items: [],
          });
        }

        stationGroups.get(stationId).items.push({
          name: item.menu_items?.name || 'Unknown',
          quantity: item.quantity,
          notes: item.notes,
          modifiers: item.modifiers,
        });
      });

      // Generate tickets for each station
      const tickets = Array.from(stationGroups.values()).map((group) => ({
        stationId: group.stationId,
        stationName: group.stationName,
        items: group.items,
        ticket: generate80mmKitchenTicket({
          order_id: orderData.orderId,
          order_number: orderData.orderNumber,
          station: group.stationName.toUpperCase(),
          items: group.items,
          subtotal: orderData.subtotal,
          tax: orderData.tax,
          total: orderData.total,
          timestamp: orderData.timestamp,
        }),
      }));

      setStationTickets(tickets);
      setUnroutedItems(unrouted);
    };

    if (open) {
      fetchOrderItemsWithStations();
    }
  }, [open, orderData]);

  // Generate customer receipt
  const customerReceipt = generate58mmReceipt({
    order_id: orderData.orderId,
    order_number: orderData.orderNumber,
    items: orderData.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    })),
    subtotal: orderData.subtotal,
    tax: orderData.tax,
    total: orderData.total,
    payment_method: 'Pending',
    timestamp: orderData.timestamp,
  }, {
    restaurantName: 'ZeniPOS Restaurant',
    address: '123 Main St, City',
    cashier: 'Cashier 01',
  });

  const handleSendToPrinter = () => {
    console.log('📄 Sending to printer - Customer Receipt:', customerReceipt);
    stationTickets.forEach((ticket) => {
      console.log(`🍳 Sending to ${ticket.stationName} Station:`, ticket.ticket);
    });
    
    toast.success(`Printed receipt + ${stationTickets.length} station ticket(s)`);
    onSendToPrinter?.();
    onOpenChange(false);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Preview - Order #{orderData.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Review receipts and tickets before sending to printer
          </DialogDescription>
        </DialogHeader>

        {unroutedItems.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {unroutedItems.length} item(s) have no station assignment: {unroutedItems.map(i => i.name).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="customer" className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="customer">Customer Receipt</TabsTrigger>
              {stationTickets.map((ticket) => (
                <TabsTrigger key={ticket.stationId} value={ticket.stationId}>
                  {ticket.stationName}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRaw(!showRaw)}
            >
              <Code className="h-4 w-4 mr-2" />
              {showRaw ? 'Preview' : 'Show HTML'}
            </Button>
          </div>

          <ScrollArea className="h-[500px] border rounded-lg">
            <TabsContent value="customer" className="mt-0 p-6">
              {showRaw ? (
                <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                  {customerReceipt}
                </pre>
              ) : (
                <div
                  className="bg-white text-black"
                  dangerouslySetInnerHTML={{ __html: customerReceipt }}
                />
              )}
            </TabsContent>

            {stationTickets.map((ticket) => (
              <TabsContent key={ticket.stationId} value={ticket.stationId} className="mt-0 p-6">
                {showRaw ? (
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                    {ticket.ticket}
                  </pre>
                ) : (
                  <div
                    className="bg-white text-black"
                    dangerouslySetInnerHTML={{ __html: ticket.ticket }}
                  />
                )}
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>

        <div className="flex gap-2">
          <Button
            onClick={handleSendToPrinter}
            className="flex-1"
          >
            <Printer className="h-4 w-4 mr-2" />
            Send to Printer
          </Button>
          <Button
            variant="outline"
            onClick={() => handleDownload(customerReceipt, `receipt-${orderData.orderNumber}.html`)}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
