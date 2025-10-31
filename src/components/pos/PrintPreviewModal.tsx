import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Download, Code } from "lucide-react";
import { useState } from "react";
import { generate58mmReceipt, generate80mmKitchenTicket, generateDrinksTicket } from "@/lib/print/receiptGenerator";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Generate receipts
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

  const kitchenTicket = generate80mmKitchenTicket({
    order_id: orderData.orderId,
    order_number: orderData.orderNumber,
    station: 'MAIN KITCHEN',
    items: orderData.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    })),
    subtotal: orderData.subtotal,
    tax: orderData.tax,
    total: orderData.total,
    timestamp: orderData.timestamp,
  });

  const drinksTicket = generateDrinksTicket({
    order_id: orderData.orderId,
    order_number: orderData.orderNumber,
    station: 'DRINKS BAR',
    items: orderData.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    })),
    subtotal: orderData.subtotal,
    tax: orderData.tax,
    total: orderData.total,
    timestamp: orderData.timestamp,
  });

  const handleSendToPrinter = () => {
    console.log('📄 Sending to printer - Customer Receipt:', customerReceipt);
    console.log('🍳 Sending to printer - Kitchen Ticket:', kitchenTicket);
    if (drinksTicket) {
      console.log('🥤 Sending to printer - Drinks Ticket:', drinksTicket);
    }
    
    toast.success("Printed to console (hardware integration pending)");
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

        <Tabs defaultValue="customer" className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="customer">Customer Receipt (58mm)</TabsTrigger>
              <TabsTrigger value="kitchen">Kitchen Ticket (80mm)</TabsTrigger>
              {drinksTicket && (
                <TabsTrigger value="drinks">Drinks Ticket (80mm)</TabsTrigger>
              )}
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

            <TabsContent value="kitchen" className="mt-0 p-6">
              {showRaw ? (
                <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                  {kitchenTicket}
                </pre>
              ) : (
                <div
                  className="bg-white text-black"
                  dangerouslySetInnerHTML={{ __html: kitchenTicket }}
                />
              )}
            </TabsContent>

            {drinksTicket && (
              <TabsContent value="drinks" className="mt-0 p-6">
                {showRaw ? (
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded">
                    {drinksTicket}
                  </pre>
                ) : (
                  <div
                    className="bg-white text-black"
                    dangerouslySetInnerHTML={{ __html: drinksTicket }}
                  />
                )}
              </TabsContent>
            )}
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
