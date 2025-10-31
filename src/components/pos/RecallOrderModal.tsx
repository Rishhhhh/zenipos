import { useState } from 'react';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface RecallOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  onSuccess?: () => void;
}

export function RecallOrderModal({ 
  open, 
  onOpenChange,
  orderId,
  orderNumber,
  onSuccess 
}: RecallOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');

  const recallOrder = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('recall_order', {
        order_id_param: orderId,
        reason_param: reason,
      });

      if (error) throw error;
      
      // Parse the JSONB response
      const result = data as { success: boolean; error?: string; requires_approval?: boolean; message?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to recall order');
      }
      
      return result;
    },
    onSuccess: (data) => {
      if (data.requires_approval) {
        toast({
          title: 'Recall Request Sent',
          description: 'Waiting for manager approval as items have been started',
        });
      } else {
        toast({
          title: 'Order Recalled',
          description: 'Order has been successfully cancelled',
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['kds-orders'] });
      onOpenChange(false);
      onSuccess?.();
      setReason('');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Recall Failed',
        description: error.message,
      });
    },
  });

  const quickReasons = [
    'Customer changed mind',
    'Wrong order entered',
    'Customer left',
    'Kitchen too busy',
  ];

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title="Recall Order"
      description={`Recall order #${orderNumber}`}
      size="md"
    >
      <form onSubmit={(e) => { e.preventDefault(); recallOrder.mutate(); }} className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Recalling this order will:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Remove it from the KDS queue</li>
              <li>Cancel the order</li>
              <li>Require manager approval if items have been started</li>
              <li>Track wastage for started items</li>
            </ul>
          </div>
        </div>

        <div>
          <Label htmlFor="reason">Reason for Recall *</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this order being recalled?"
            rows={3}
            required
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <p className="text-xs text-muted-foreground w-full mb-1">Quick reasons:</p>
          {quickReasons.map((quickReason) => (
            <Button
              key={quickReason}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReason(quickReason)}
            >
              {quickReason}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setReason('');
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={recallOrder.isPending || !reason}
            className="flex-1"
          >
            {recallOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Recall Order
          </Button>
        </div>
      </form>
    </GlassModal>
  );
}
