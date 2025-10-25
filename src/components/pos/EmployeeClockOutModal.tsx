import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Loader2, LogOut, Clock, ShoppingCart, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface EmployeeClockOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string;
  onSuccess: () => void;
}

export function EmployeeClockOutModal({ open, onOpenChange, shiftId, onSuccess }: EmployeeClockOutModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [breakMinutes, setBreakMinutes] = useState('0');

  const { data: shiftSummary } = useQuery({
    queryKey: ['shift-summary', shiftId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_shift_summary', {
        shift_id_param: shiftId,
      });
      if (error) throw error;
      return data?.[0];
    },
    enabled: open,
  });

  const clockOut = useMutation({
    mutationFn: async () => {
      // Update shift with clock-out time
      const { error: updateError } = await supabase
        .from('shifts')
        .update({
          clock_out_at: new Date().toISOString(),
          break_minutes: parseInt(breakMinutes) || 0,
        })
        .eq('id', shiftId);

      if (updateError) throw updateError;

      // Close shift and calculate summary
      const { error: closeError } = await supabase.rpc('close_shift', {
        shift_id_param: shiftId,
      });

      if (closeError) throw closeError;
    },
    onSuccess: () => {
      toast({
        title: 'Clocked Out',
        description: 'Shift has been closed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Clock Out Failed',
        description: error.message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clock Out</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {shiftSummary && (
            <Card className="p-4 bg-muted">
              <h4 className="font-semibold mb-3">Shift Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Started</span>
                  </div>
                  <span className="font-medium">
                    {new Date(shiftSummary.clock_in).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Orders Processed</span>
                  </div>
                  <span className="font-medium">{shiftSummary.orders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Total Sales</span>
                  </div>
                  <span className="font-medium">RM {shiftSummary.sales?.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          )}

          <div>
            <Label htmlFor="break">Break Time (minutes)</Label>
            <Input
              id="break"
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
              min="0"
              placeholder="0"
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => clockOut.mutate()}
              className="flex-1"
              disabled={clockOut.isPending}
            >
              {clockOut.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Clock Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
