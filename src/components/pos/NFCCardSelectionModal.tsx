import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NfcIcon, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { NFCCardScanner } from '@/components/nfc/NFCCardScanner';
import { formatDistanceToNow } from 'date-fns';

interface NFCCardSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (cardId: string, cardUid: string) => void;
}

interface NFCCard {
  id: string;
  card_uid: string;
  status: string;
  notes: string | null;
  last_scanned_at: string | null;
  scan_count: number;
}

export function NFCCardSelectionModal({ open, onOpenChange, onSelect }: NFCCardSelectionModalProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const { data: nfcCards, isLoading } = useQuery({
    queryKey: ['nfc-cards', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nfc_cards')
        .select('id, card_uid, status, notes, last_scanned_at, scan_count')
        .eq('status', 'active')
        .order('card_uid');
      
      if (error) throw error;
      return data as NFCCard[];
    },
    enabled: open,
  });

  const handleCardSelect = async (cardId: string, cardUid: string) => {
    try {
      setSelectedCard(cardId);
      
      // Increment scan count and update last_scanned_at
      const { error } = await supabase
        .from('nfc_cards')
        .update({ 
          scan_count: (nfcCards?.find(c => c.id === cardId)?.scan_count || 0) + 1,
          last_scanned_at: new Date().toISOString()
        })
        .eq('id', cardId);
      
      if (error) throw error;
      
      // Call parent callback
      onSelect(cardId, cardUid);
      
      // Close modal
      onOpenChange(false);
      
      toast({
        title: "Card Selected",
        description: `Card ${cardUid} selected successfully`,
      });
    } catch (error) {
      console.error('Failed to log scan:', error);
      toast({
        title: "Error",
        description: "Failed to select card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSelectedCard(null);
    }
  };

  const handleNFCScan = async (tableId: string, nfcCardId?: string) => {
    // If nfcCardId is provided, use it; otherwise find by tableId
    const card = nfcCardId 
      ? nfcCards?.find(c => c.id === nfcCardId)
      : nfcCards?.find(c => c.id === tableId);
    
    if (card) {
      await handleCardSelect(card.id, card.card_uid);
    }
  };

  const getCardStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 border-green-500 hover:bg-green-500/20';
      case 'lost':
        return 'bg-red-500/10 border-red-500 hover:bg-red-500/20 cursor-not-allowed opacity-60';
      case 'damaged':
        return 'bg-yellow-500/10 border-yellow-500 hover:bg-yellow-500/20 cursor-not-allowed opacity-60';
      case 'retired':
        return 'bg-gray-500/10 border-gray-500 hover:bg-gray-500/20 cursor-not-allowed opacity-60';
      default:
        return 'bg-muted border-muted';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'lost':
        return 'bg-red-500/20 text-red-700 dark:text-red-400';
      case 'damaged':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      case 'retired':
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <NfcIcon className="h-6 w-6" />
            Select NFC Card
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="select" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Select Card</TabsTrigger>
            <TabsTrigger value="scan">Scan Card</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="flex-1 overflow-y-auto mt-4">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">Loading NFC cards...</p>
                </div>
              </div>
            )}

            {!isLoading && nfcCards?.length === 0 && (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg mb-2">
                  No active NFC cards found
                </p>
                <p className="text-sm text-muted-foreground">
                  Contact your manager to encode new cards
                </p>
              </Card>
            )}

            {!isLoading && nfcCards && nfcCards.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {nfcCards.map((card) => (
                  <Card
                    key={card.id}
                    onClick={() => card.status === 'active' && handleCardSelect(card.id, card.card_uid)}
                    className={`
                      relative cursor-pointer transition-all 
                      hover:scale-105 hover:shadow-xl
                      ${getCardStatusColor(card.status)}
                      border-2 p-4 min-h-[140px]
                      ${selectedCard === card.id ? 'ring-2 ring-primary' : ''}
                      ${card.status !== 'active' ? 'pointer-events-none' : ''}
                    `}
                  >
                    <div className="flex flex-col gap-3 h-full">
                      {/* Header with Status Badge */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <NfcIcon className="h-5 w-5" />
                        </div>
                        <Badge variant="secondary" className={getStatusBadgeColor(card.status)}>
                          {card.status}
                        </Badge>
                      </div>

                      {/* Card UID - Large and Prominent */}
                      <h3 className="text-xl font-bold tracking-tight break-all">
                        {card.card_uid}
                      </h3>

                      {/* Notes/Description */}
                      {card.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                          {card.notes}
                        </p>
                      )}

                      {/* Scan Info */}
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-auto">
                        <span>Scans: {card.scan_count}</span>
                        {card.last_scanned_at && (
                          <span className="truncate">
                            Last: {formatDistanceToNow(new Date(card.last_scanned_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scan" className="flex-1 overflow-y-auto mt-4">
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="max-w-md w-full">
                <NFCCardScanner
                  onScanSuccess={handleNFCScan}
                  onCancel={() => onOpenChange(false)}
                />
                <p className="text-center text-sm text-muted-foreground mt-6">
                  Tap your NFC card on the reader to automatically select it
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
