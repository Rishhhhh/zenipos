import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { NFCCardScanner } from '@/components/nfc/NFCCardScanner';
import { NfcIcon, Loader2, Search, Clock, MapPin, CreditCard } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PendingOrder {
  id: string;
  total: number;
  nfc_card_id: string;
  table_id: string | null;
  order_type: string;
  created_at: string;
  nfc_cards: { card_uid: string }[] | { card_uid: string } | null;
  tables: { label: string }[] | { label: string } | null;
}

interface PaymentNFCScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderFound: (order: PendingOrder) => void;
}

export function PaymentNFCScannerModal({
  open,
  onOpenChange,
  onOrderFound,
}: PaymentNFCScannerModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [manualCardUid, setManualCardUid] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Query all pending orders with NFC cards
  const { data: pendingOrders, isLoading } = useQuery({
    queryKey: ['pending-orders-nfc'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          nfc_card_id,
          table_id,
          order_type,
          created_at,
          nfc_cards!orders_nfc_card_id_fkey (card_uid),
          tables (label)
        `)
        .in('status', ['preparing', 'delivered'])
        .not('nfc_card_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as PendingOrder[];
    },
    enabled: open,
  });

  const handleNFCScan = async (tableId: string, cardId?: string) => {
    try {
      setIsSearching(true);

      // Query order by NFC card ID
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          nfc_card_id,
          table_id,
          order_type,
          created_at,
          nfc_cards!orders_nfc_card_id_fkey (card_uid),
          tables (label)
        `)
        .eq('nfc_card_id', cardId)
        .in('status', ['preparing', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          variant: 'destructive',
          title: 'No Order Found',
          description: 'No pending order found for this NFC card',
        });
        return;
      }

      toast({
        title: 'Order Found!',
        description: `Order total: RM ${data.total.toFixed(2)}`,
      });

      onOrderFound(data as PendingOrder);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description: error.message,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualCardUid.trim()) {
      toast({
        variant: 'destructive',
        title: 'Card UID Required',
        description: 'Please enter a card UID to search',
      });
      return;
    }

    try {
      setIsSearching(true);

      // Search by card UID
      const { data: card } = await supabase
        .from('nfc_cards')
        .select('id')
        .eq('card_uid', manualCardUid.trim())
        .maybeSingle();

      if (!card) {
        toast({
          variant: 'destructive',
          title: 'Card Not Found',
          description: 'No NFC card found with this UID',
        });
        return;
      }

      // Query order by card ID
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          nfc_card_id,
          table_id,
          order_type,
          created_at,
          nfc_cards!orders_nfc_card_id_fkey (card_uid),
          tables (label)
        `)
        .eq('nfc_card_id', card.id)
        .in('status', ['preparing', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!order) {
        toast({
          variant: 'destructive',
          title: 'No Order Found',
          description: 'No pending order found for this card',
        });
        return;
      }

      toast({
        title: 'Order Found!',
        description: `Order total: RM ${order.total.toFixed(2)}`,
      });

      onOrderFound(order as PendingOrder);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: error.message,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleOrderSelect = (order: PendingOrder) => {
    onOrderFound(order);
    onOpenChange(false);
  };

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title="Scan Card to Pay"
      size="lg"
      variant="default"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scan">
            <NfcIcon className="h-4 w-4 mr-2" />
            Scan Card
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Search className="h-4 w-4 mr-2" />
            Manual Selection
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Scan Card */}
        <TabsContent value="scan" className="space-y-4">
          <div className="flex flex-col items-center justify-center py-12">
            {/* Pulsing NFC Icon */}
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <NfcIcon className="h-24 w-24 text-primary/30" />
              </div>
              <NfcIcon className="h-24 w-24 text-primary relative z-10" />
            </div>

            <h3 className="text-2xl font-semibold mt-6 mb-2">
              Tap Card on Reader
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Place the customer's NFC card near the reader to retrieve their pending order
            </p>

            {isSearching && (
              <div className="flex items-center gap-2 mt-6 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Searching for order...</span>
              </div>
            )}
          </div>

          {/* Integrate NFCCardScanner */}
          <div className="hidden">
            <NFCCardScanner
              onScanSuccess={handleNFCScan}
              onCancel={() => onOpenChange(false)}
            />
          </div>

          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <p>Or switch to <strong>Manual Selection</strong> to choose from a list</p>
          </div>
        </TabsContent>

        {/* Tab 2: Manual Selection */}
        <TabsContent value="manual" className="space-y-4">
          {/* Manual Card UID Search */}
          <div className="space-y-2">
            <Label htmlFor="manual-uid">Search by Card UID</Label>
            <div className="flex gap-2">
              <Input
                id="manual-uid"
                type="text"
                placeholder="Enter card UID (e.g., TEST-CARD-001)"
                value={manualCardUid}
                onChange={(e) => setManualCardUid(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              />
              <Button
                onClick={handleManualSearch}
                disabled={isSearching || !manualCardUid.trim()}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Pending Orders List */}
          <div className="space-y-2">
            <Label>Pending Orders ({pendingOrders?.length || 0})</Label>
            <ScrollArea className="h-[400px] rounded-md border p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pendingOrders && pendingOrders.length > 0 ? (
                <div className="space-y-3">
                  {pendingOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleOrderSelect(order)}
                      className="w-full p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          {/* Card UID */}
                          <div className="flex items-center gap-2">
                            <NfcIcon className="h-4 w-4 text-primary" />
                            <span className="font-mono text-sm font-medium">
                              {Array.isArray(order.nfc_cards) 
                                ? order.nfc_cards[0]?.card_uid 
                                : order.nfc_cards?.card_uid || 'Unknown Card'}
                            </span>
                          </div>

                          {/* Table/Takeaway */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {order.order_type === 'takeaway' ? (
                              <>
                                <CreditCard className="h-3.5 w-3.5" />
                                <span>Takeaway</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="h-3.5 w-3.5" />
                                <span>
                                  Table {Array.isArray(order.tables)
                                    ? order.tables[0]?.label
                                    : order.tables?.label || 'N/A'}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Time */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(order.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="text-right">
                          <Badge variant="secondary" className="text-base font-semibold">
                            RM {order.total.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <NfcIcon className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground">
                    No pending orders with NFC cards found
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </GlassModal>
  );
}
