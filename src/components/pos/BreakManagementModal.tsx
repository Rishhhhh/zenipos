import { useState } from 'react';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Coffee, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface BreakManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string;
  employeeId: string;
}

export function BreakManagementModal({ 
  open, 
  onOpenChange, 
  shiftId,
  employeeId 
}: BreakManagementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [breakType, setBreakType] = useState<'paid' | 'unpaid'>('unpaid');

  // Check for active break
  const { data: activeBreak, isLoading } = useQuery({
    queryKey: ['active-break', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_break', {
        employee_id_param: employeeId,
      });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: open,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const startBreak = useMutation({
    mutationFn: async (type: 'paid' | 'unpaid') => {
      const { data, error } = await supabase.rpc('start_break', {
        shift_id_param: shiftId,
        break_type_param: type,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Break Started',
        description: 'Your break time is now being tracked.',
      });
      queryClient.invalidateQueries({ queryKey: ['active-break'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Start Break',
        description: error.message,
      });
    },
  });

  const endBreak = useMutation({
    mutationFn: async (breakId: string) => {
      const { error } = await supabase.rpc('end_break', {
        break_id_param: breakId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Break Ended',
        description: 'Welcome back! Your break time has been logged.',
      });
      queryClient.invalidateQueries({ queryKey: ['active-break'] });
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to End Break',
        description: error.message,
      });
    },
  });

  const handleStartBreak = () => {
    startBreak.mutate(breakType);
  };

  const handleEndBreak = () => {
    if (activeBreak?.break_id) {
      endBreak.mutate(activeBreak.break_id);
    }
  };

  if (isLoading) {
    return (
      <GlassModal open={open} onOpenChange={onOpenChange} title="Break Management">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </GlassModal>
    );
  }

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title="Break Management"
      description={activeBreak ? 'Your break is active' : 'Start your break'}
      size="md"
    >
      {activeBreak ? (
        <div className="space-y-6">
          <div className="flex items-center justify-center p-6 bg-accent/10 rounded-lg">
            <div className="text-center">
              <Coffee className="h-12 w-12 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground mb-1">Break Active</p>
              <p className="text-2xl font-bold">
                {formatDistanceToNow(new Date(activeBreak.start_at), { addSuffix: false })}
              </p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {activeBreak.break_type} Break
              </p>
            </div>
          </div>

          <Button
            onClick={handleEndBreak}
            disabled={endBreak.isPending}
            className="w-full"
            size="lg"
          >
            {endBreak.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            End Break
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label>Break Type</Label>
            <RadioGroup value={breakType} onValueChange={(v) => setBreakType(v as 'paid' | 'unpaid')}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="unpaid" id="unpaid" />
                <Label htmlFor="unpaid" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Unpaid Break</p>
                      <p className="text-xs text-muted-foreground">Time is deducted from shift</p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="paid" id="paid" />
                <Label htmlFor="paid" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Paid Break</p>
                      <p className="text-xs text-muted-foreground">Time is included in shift</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            onClick={handleStartBreak}
            disabled={startBreak.isPending}
            className="w-full"
            size="lg"
          >
            {startBreak.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Start Break
          </Button>
        </div>
      )}
    </GlassModal>
  );
}
