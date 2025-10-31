import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateApprovalParams {
  actionType: string;
  actionContext?: any;
  onApproved?: () => void;
  onRejected?: () => void;
}

export function useManagerApproval() {
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);

  const createApprovalMutation = useMutation({
    mutationFn: async ({ actionType, actionContext, employeeId }: CreateApprovalParams & { employeeId: string }) => {
      const { data, error } = await supabase
        .from('approval_requests')
        .insert({
          requested_by: employeeId,
          action_type: actionType,
          action_context: actionContext,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setPendingRequestId(data.id);
      setIsWaitingForApproval(true);
      toast.info('Waiting for manager approval...');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create approval request');
    },
  });

  const requestApproval = async (params: CreateApprovalParams) => {
    // Get current employee
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Not authenticated');
      return null;
    }

    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!employee) {
      toast.error('Employee not found');
      return null;
    }

    return createApprovalMutation.mutateAsync({
      ...params,
      employeeId: employee.id,
    });
  };

  const checkApprovalStatus = async (requestId: string) => {
    const { data, error } = await supabase
      .from('approval_requests')
      .select('status')
      .eq('id', requestId)
      .single();

    if (error) throw error;
    return data.status;
  };

  const waitForApproval = async (
    requestId: string,
    onApproved?: () => void,
    onRejected?: () => void,
    timeout = 300000 // 5 minutes
  ) => {
    return new Promise<boolean>((resolve) => {
      const startTime = Date.now();
      
      const channel = supabase
        .channel(`approval_${requestId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'approval_requests',
            filter: `id=eq.${requestId}`,
          },
          (payload: any) => {
            const newStatus = payload.new.status;
            
            if (newStatus === 'approved') {
              toast.success('Request approved!');
              onApproved?.();
              setIsWaitingForApproval(false);
              setPendingRequestId(null);
              channel.unsubscribe();
              resolve(true);
            } else if (newStatus === 'rejected') {
              toast.error('Request rejected');
              onRejected?.();
              setIsWaitingForApproval(false);
              setPendingRequestId(null);
              channel.unsubscribe();
              resolve(false);
            } else if (newStatus === 'expired') {
              toast.error('Request expired');
              onRejected?.();
              setIsWaitingForApproval(false);
              setPendingRequestId(null);
              channel.unsubscribe();
              resolve(false);
            }
          }
        )
        .subscribe();

      // Timeout handler
      setTimeout(() => {
        if (Date.now() - startTime >= timeout) {
          toast.error('Approval request timed out');
          setIsWaitingForApproval(false);
          setPendingRequestId(null);
          channel.unsubscribe();
          resolve(false);
        }
      }, timeout);
    });
  };

  const cancelWaiting = () => {
    setIsWaitingForApproval(false);
    setPendingRequestId(null);
  };

  return {
    requestApproval,
    waitForApproval,
    checkApprovalStatus,
    isWaitingForApproval,
    pendingRequestId,
    cancelWaiting,
  };
}
