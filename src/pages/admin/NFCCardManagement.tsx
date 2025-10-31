import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NFCCardEncoder } from "@/components/nfc/NFCCardEncoder";
import { 
  NfcIcon, 
  Plus, 
  AlertCircle, 
  Trash2, 
  Edit,
  Ban,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { nfcCardManager } from "@/lib/nfc/NFCCardManager";

export default function NFCCardManagement() {
  const [showEncoder, setShowEncoder] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNotes, setStatusNotes] = useState("");

  const queryClient = useQueryClient();

  // Fetch all NFC cards with table info
  const { data: cards, isLoading } = useQuery({
    queryKey: ['nfc-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nfc_cards')
        .select(`
          *,
          tables (
            id,
            label,
            seats,
            status
          )
        `)
        .order('issued_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Update card status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ cardId, status, notes }: { cardId: string; status: any; notes?: string }) => {
      await nfcCardManager.updateCardStatus(cardId, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfc-cards'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setShowStatusDialog(false);
      setSelectedCard(null);
      setStatusNotes("");
    }
  });

  // Delete card mutation
  const deleteMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await nfcCardManager.deleteCard(cardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfc-cards'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'lost': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'damaged': return 'bg-warning/10 text-warning border-warning/20';
      case 'retired': return 'bg-muted text-muted-foreground border-muted';
      default: return 'bg-muted';
    }
  };

  const handleStatusChange = (card: any) => {
    setSelectedCard(card);
    setNewStatus(card.status);
    setShowStatusDialog(true);
  };

  const submitStatusChange = () => {
    if (!selectedCard || !newStatus) return;
    
    updateStatusMutation.mutate({
      cardId: selectedCard.id,
      status: newStatus as any,
      notes: statusNotes || undefined
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <NfcIcon className="h-8 w-8" />
            NFC Card Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage table NFC cards for quick order access
          </p>
        </div>

        <Button onClick={() => setShowEncoder(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Encode New Card
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cards?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {cards?.filter(c => c.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lost/Damaged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {cards?.filter(c => ['lost', 'damaged'].includes(c.status)).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cards?.reduce((sum, c) => sum + (c.scan_count || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards List */}
      <Card>
        <CardHeader>
          <CardTitle>NFC Cards</CardTitle>
          <CardDescription>
            View and manage all NFC cards in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading cards...</div>
          ) : cards?.length === 0 ? (
            <div className="text-center py-8">
              <NfcIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No NFC cards encoded yet</p>
              <Button onClick={() => setShowEncoder(true)} className="mt-4">
                Encode Your First Card
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cards?.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <NfcIcon className="h-5 w-5 text-primary mt-1" />
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {card.tables?.label || 'Unassigned'}
                        </span>
                        <Badge variant="outline" className={getStatusColor(card.status)}>
                          {card.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <div>Card UID: <code className="bg-muted px-1.5 py-0.5 rounded">{card.card_uid}</code></div>
                        <div>Scans: {card.scan_count} • Last scanned: {card.last_scanned_at ? new Date(card.last_scanned_at).toLocaleString() : 'Never'}</div>
                        {card.notes && <div className="italic">Note: {card.notes}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(card)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Status
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete this NFC card? This cannot be undone.')) {
                          deleteMutation.mutate(card.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Encoder Modal */}
      <NFCCardEncoder
        open={showEncoder}
        onOpenChange={setShowEncoder}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['nfc-cards'] })}
      />

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Card Status</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes about this status change..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitStatusChange} disabled={updateStatusMutation.isPending}>
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
