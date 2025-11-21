import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface TillReconciliationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

export function TillReconciliationDialog({
  open,
  onOpenChange,
  sessionId,
}: TillReconciliationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch session details
  const { data: session, isLoading } = useQuery({
    queryKey: ['till-session-detail', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('till_sessions')
        .select(`
          *,
          employee:employees(name),
          shift:shifts(*)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!sessionId,
  });

  // Fetch till ledger entries
  const { data: ledgerEntries } = useQuery({
    queryKey: ['till-ledger-entries', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('till_ledger')
        .select(`
          *,
          order:orders(id),
          payment:payments(method, amount)
        `)
        .eq('till_session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open && !!sessionId,
  });

  // Approve reconciliation mutation
  const approveReconciliation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('till_sessions')
        .update({ status: 'reconciled' })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Reconciliation Approved',
        description: 'Till session has been marked as reconciled',
      });
      queryClient.invalidateQueries({ queryKey: ['till-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['till-session-detail', sessionId] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: error.message,
      });
    },
  });

  const exportReport = () => {
    if (!session || !ledgerEntries) return;

    const csvData = ledgerEntries.map(entry => ({
      Time: format(new Date(entry.created_at), 'yyyy-MM-dd HH:mm:ss'),
      Type: entry.transaction_type,
      Amount: entry.amount,
      OrderID: entry.order_id || '-',
      PaymentMethod: entry.payment?.method || '-',
    }));

    const csv = [
      `Till Session Report - ${session.employee?.name}`,
      `Opened: ${format(new Date(session.opened_at), 'yyyy-MM-dd HH:mm')}`,
      session.closed_at ? `Closed: ${format(new Date(session.closed_at), 'yyyy-MM-dd HH:mm')}` : 'Status: Open',
      `Opening Float: RM ${session.opening_float}`,
      `Expected Cash: RM ${session.expected_cash}`,
      session.actual_cash ? `Actual Cash: RM ${session.actual_cash}` : '',
      session.variance ? `Variance: RM ${session.variance}` : '',
      '',
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `till-session-${sessionId.substring(0, 8)}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <GlassModal open={open} onOpenChange={onOpenChange} title="Loading..." size="lg">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </GlassModal>
    );
  }

  if (!session) return null;

  const variance = Number(session.variance || 0);
  const hasVariance = Math.abs(variance) > 5;

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title="Till Session Reconciliation"
      description={`${session.employee?.name} - ${format(new Date(session.opened_at), 'MMM dd, yyyy HH:mm')}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Session Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">Opening Float</p>
            <p className="text-lg font-bold">RM {Number(session.opening_float || 0).toFixed(2)}</p>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">Expected Cash</p>
            <p className="text-lg font-bold text-primary">RM {Number(session.expected_cash || 0).toFixed(2)}</p>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">Actual Cash</p>
            <p className="text-lg font-bold">RM {Number(session.actual_cash || 0).toFixed(2)}</p>
          </div>
          <div className={`bg-muted/30 p-3 rounded-lg ${hasVariance ? 'border-2 border-destructive' : ''}`}>
            <p className="text-xs text-muted-foreground">Variance</p>
            <p className={`text-lg font-bold ${hasVariance ? 'text-destructive' : ''}`}>
              {variance > 0 ? '+' : ''}RM {Math.abs(variance).toFixed(2)}
              {variance > 0 ? ' (Over)' : variance < 0 ? ' (Short)' : ''}
            </p>
          </div>
        </div>

        {/* Variance Reason */}
        {session.variance_reason && (
          <div className="bg-destructive/10 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-1">Variance Reason:</p>
            <p className="text-sm">{session.variance_reason}</p>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between">
          <Badge variant={
            session.status === 'open' ? 'default' :
            session.status === 'reconciled' ? 'default' :
            'secondary'
          } className={session.status === 'reconciled' ? 'bg-green-500 hover:bg-green-600' : ''}>
            {session.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Transaction List */}
        <div>
          <h3 className="font-semibold mb-3">Transaction History ({ledgerEntries?.length || 0})</h3>
          <div className="border rounded-lg max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Payment Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerEntries && ledgerEntries.length > 0 ? (
                  ledgerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">
                        {format(new Date(entry.created_at), 'HH:mm:ss')}
                      </TableCell>
                      <TableCell className="capitalize text-sm">
                        {entry.transaction_type.replace('_', ' ')}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${entry.amount < 0 ? 'text-destructive' : ''}`}>
                        {entry.amount > 0 ? '+' : ''}RM {Number(entry.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.order_id ? entry.order_id.substring(0, 8) : '-'}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {entry.payment?.method || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No transactions recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Actions */}
        {session.status === 'closed' && (
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              className="flex-1"
              onClick={() => approveReconciliation.mutate()}
              disabled={approveReconciliation.isPending}
            >
              {approveReconciliation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Reconciliation
            </Button>
          </div>
        )}
      </div>
    </GlassModal>
  );
}
