import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/lib/realtime/RealtimeService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApprovalRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApprovalRequestModal({ open, onOpenChange }: ApprovalRequestModalProps) {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['approval-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approval_requests')
        .select(`
          *,
          requested_by_employee:employees!approval_requests_requested_by_fkey(name),
          approved_by_employee:employees!approval_requests_approved_by_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: open,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Real-time subscription using unified service
  useRealtimeTable(
    'approval_requests',
    () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
    },
    { enabled: open }
  );

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, pin }: { requestId: string; pin: string }) => {
      const { data, error } = await supabase.rpc('approve_request_with_pin', {
        request_id_param: requestId,
        pin_param: pin,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Request approved');
      setPin('');
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve request');
      setPin('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, pin }: { requestId: string; pin: string }) => {
      const { data, error } = await supabase.rpc('reject_approval_request', {
        request_id_param: requestId,
        pin_param: pin,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Request rejected');
      setPin('');
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject request');
      setPin('');
    },
  });

  const handleApprove = () => {
    if (!selectedRequest || !pin) {
      toast.error('Please enter PIN');
      return;
    }
    approveMutation.mutate({ requestId: selectedRequest, pin });
  };

  const handleReject = () => {
    if (!selectedRequest || !pin) {
      toast.error('Please enter PIN');
      return;
    }
    rejectMutation.mutate({ requestId: selectedRequest, pin });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      void_item: 'Void Item',
      large_discount: 'Large Discount',
      refund: 'Refund',
      price_override: 'Price Override',
      delete_order: 'Delete Order',
      modify_inventory: 'Modify Inventory',
      close_shift: 'Close Shift',
      access_safe: 'Access Safe',
    };
    return labels[actionType] || actionType;
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Manager Approvals</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Requests ({pendingRequests.length})
              </h3>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedRequest === request.id ? 'border-primary bg-accent' : 'hover:bg-accent/50'
                      }`}
                      onClick={() => setSelectedRequest(request.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getStatusColor(request.status)}>
                              {getActionLabel(request.action_type)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm">
                            Requested by: <span className="font-medium">{request.requested_by_employee?.name}</span>
                          </p>
                          {request.action_context && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {JSON.stringify(request.action_context, null, 2)}
                            </p>
                          )}
                        </div>
                        {new Date(request.expires_at) < new Date() && (
                          <Badge variant="secondary">Expired</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* PIN Input for Selected Request */}
          {selectedRequest && (
            <div className="border rounded-lg p-4 bg-card">
              <Label htmlFor="manager-pin">Manager PIN</Label>
              <Input
                id="manager-pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit PIN"
                className="mt-2 text-center text-2xl tracking-widest"
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleApprove}
                  disabled={pin.length !== 6 || approveMutation.isPending}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={pin.length !== 6 || rejectMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}

          {/* Processed Requests History */}
          {processedRequests.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Recent History
              </h3>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {processedRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-3 bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getStatusColor(request.status)}>
                              {request.status.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{getActionLabel(request.action_type)}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            By: {request.requested_by_employee?.name}
                            {request.approved_by_employee && ` • ${request.status} by: ${request.approved_by_employee.name}`}
                            {` • ${formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {requests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No approval requests
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
