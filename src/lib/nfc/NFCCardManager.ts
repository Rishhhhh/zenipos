import { supabase } from "@/integrations/supabase/client";
import { nfcReader, NFCCardData } from "./NFCReader";
import { toast } from "sonner";

export interface NFCCardRecord {
  id: string;
  card_uid: string;
  table_id: string | null;
  branch_id: string | null;
  status: 'active' | 'lost' | 'damaged' | 'retired';
  security_hash: string;
  issued_at: string;
  last_scanned_at: string | null;
  scan_count: number;
  notes: string | null;
}

export class NFCCardManager {
  /**
   * Encode a new NFC card for a table
   */
  async encodeCard(tableId: string, branchId: string, cardUid: string): Promise<NFCCardRecord> {
    try {
      // Write to physical NFC card
      const securityHash = await nfcReader.writeCard(tableId, branchId);

      // Save to database
      const { data, error } = await supabase
        .from('nfc_cards')
        .insert({
          card_uid: cardUid,
          table_id: tableId,
          branch_id: branchId,
          security_hash: securityHash,
          status: 'active' as const
        })
        .select()
        .single();

      if (error) throw error;

      // Update table reference
      await supabase
        .from('tables')
        .update({ nfc_card_id: data.id })
        .eq('id', tableId);

      toast.success("NFC card encoded and assigned successfully");
      return data as NFCCardRecord;
    } catch (error: any) {
      console.error("Card encoding error:", error);
      toast.error(error.message || "Failed to encode NFC card");
      throw error;
    }
  }

  /**
   * Scan and verify an NFC card
   */
  async scanAndVerify(): Promise<{ tableId: string; isValid: boolean }> {
    try {
      const card = await nfcReader.scanCard();
      
      // Verify card data
      const isValid = await nfcReader.verifyCard(card.data);
      
      if (!isValid) {
        toast.error("Invalid NFC card");
        return { tableId: card.data.table_id, isValid: false };
      }

      // Log scan in database
      const { data: tableId, error } = await supabase
        .rpc('log_nfc_scan', { card_uid_param: card.serialNumber });

      if (error) {
        toast.error("Card not found or inactive");
        throw error;
      }

      toast.success("Card scanned successfully");
      return { tableId: tableId || card.data.table_id, isValid: true };
    } catch (error: any) {
      console.error("Card scan error:", error);
      toast.error(error.message || "Failed to scan NFC card");
      throw error;
    }
  }

  /**
   * Update card status (lost, damaged, retired)
   */
  async updateCardStatus(
    cardId: string, 
    status: 'active' | 'lost' | 'damaged' | 'retired',
    notes?: string
  ): Promise<void> {
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (notes) updateData.notes = notes;

      const { error } = await supabase
        .from('nfc_cards')
        .update(updateData)
        .eq('id', cardId);

      if (error) throw error;

      // If retiring/losing card, unlink from table
      if (status !== 'active') {
        await supabase
          .from('tables')
          .update({ nfc_card_id: null })
          .eq('nfc_card_id', cardId);
      }

      toast.success(`Card marked as ${status}`);
    } catch (error: any) {
      console.error("Status update error:", error);
      toast.error("Failed to update card status");
      throw error;
    }
  }

  /**
   * Assign card to a different table
   */
  async reassignCard(cardId: string, newTableId: string): Promise<void> {
    try {
      // Remove old assignment
      await supabase
        .from('tables')
        .update({ nfc_card_id: null })
        .eq('nfc_card_id', cardId);

      // Update card
      const { error } = await supabase
        .from('nfc_cards')
        .update({ 
          table_id: newTableId,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId);

      if (error) throw error;

      // Set new assignment
      await supabase
        .from('tables')
        .update({ nfc_card_id: cardId })
        .eq('id', newTableId);

      toast.success("Card reassigned successfully");
    } catch (error: any) {
      console.error("Reassignment error:", error);
      toast.error("Failed to reassign card");
      throw error;
    }
  }

  /**
   * Get all cards for a branch
   */
  async getCards(branchId?: string): Promise<NFCCardRecord[]> {
    try {
      let query = supabase
        .from('nfc_cards')
        .select('*')
        .order('issued_at', { ascending: false });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as NFCCardRecord[];
    } catch (error) {
      console.error("Error fetching cards:", error);
      return [];
    }
  }

  /**
   * Delete a card record
   */
  async deleteCard(cardId: string): Promise<void> {
    try {
      // Unlink from table first
      await supabase
        .from('tables')
        .update({ nfc_card_id: null })
        .eq('nfc_card_id', cardId);

      const { error } = await supabase
        .from('nfc_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      toast.success("Card deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete card");
      throw error;
    }
  }
}

export const nfcCardManager = new NFCCardManager();
