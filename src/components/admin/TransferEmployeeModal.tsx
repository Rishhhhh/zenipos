import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useBranch } from '@/contexts/BranchContext';
import { ArrowRight } from 'lucide-react';

interface TransferEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: any;
}

export function TransferEmployeeModal({ open, onOpenChange, employee }: TransferEmployeeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { branches } = useBranch();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [reason, setReason] = useState('');

  const availableBranches = branches.filter(b => b.id !== employee?.branch_id);

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!employee || !selectedBranchId) throw new Error('Missing data');

      // Update employee branch
      const { error } = await supabase
        .from('employees')
        .update({ branch_id: selectedBranchId })
        .eq('id', employee.id);

      if (error) throw error;

      // Get current user for audit log
      const { data: { user } } = await supabase.auth.getUser();
      const targetBranch = branches.find(b => b.id === selectedBranchId);

      // Log to audit
      await supabase.from('audit_log').insert({
        actor: user?.id,
        action: 'employee_branch_transfer',
        entity: 'employees',
        entity_id: employee.id,
        diff: {
          employee_name: employee.name,
          from_branch: employee.branch_id,
          to_branch: selectedBranchId,
          to_branch_name: targetBranch?.name,
          reason,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Employee Transferred',
        description: 'Employee has been successfully transferred to the new branch.',
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onOpenChange(false);
      setSelectedBranchId('');
      setReason('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Transfer Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) {
      toast({
        title: 'Missing Information',
        description: 'Please select a target branch',
        variant: 'destructive',
      });
      return;
    }
    transferMutation.mutate();
  };

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Transfer ${employee?.name || 'Employee'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="current-branch">Current Branch</Label>
          <div className="p-2 bg-muted rounded-md text-sm text-muted-foreground">
            {branches.find(b => b.id === employee?.branch_id)?.name || 'Unknown'}
          </div>
        </div>

        <div>
          <Label htmlFor="target-branch">Target Branch *</Label>
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger id="target-branch">
              <SelectValue placeholder="Select target branch" />
            </SelectTrigger>
            <SelectContent>
              {availableBranches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name} {branch.code && `(${branch.code})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="reason">Reason for Transfer</Label>
          <Textarea
            id="reason"
            placeholder="e.g., Covering staff shortage, permanent relocation"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={transferMutation.isPending || !selectedBranchId}
        >
          {transferMutation.isPending ? (
            'Transferring...'
          ) : (
            <>
              <ArrowRight className="h-4 w-4 mr-2" />
              Transfer Employee
            </>
          )}
        </Button>
      </form>
    </GlassModal>
  );
}
