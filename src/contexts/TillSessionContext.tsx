import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranch } from './BranchContext';
import { useAuth } from './AuthContext';

interface TillSession {
  id: string;
  employee_id: string;
  shift_id: string;
  branch_id: string;
  opening_float: number;
  expected_cash: number;
  status: 'open' | 'closed' | 'reconciled';
  opened_at: string;
  closed_at?: string;
}

interface TillSessionContextType {
  activeTillSession: TillSession | null;
  isLoading: boolean;
  openTillSession: (data: {
    employeeId: string;
    shiftId: string;
    openingFloat: number;
    denominations?: any;
  }) => Promise<TillSession>;
  closeTillSession: (data: {
    closingFloat: number;
    actualCash: number;
    variance: number;
    varianceReason?: string;
    denominations?: any;
  }) => Promise<void>;
  recordCashTransaction: (amount: number, type: 'sale' | 'change_given', orderId?: string, paymentId?: string) => Promise<void>;
  getCurrentCashPosition: () => number;
  refreshSession: () => Promise<void>;
}

const TillSessionContext = createContext<TillSessionContextType | undefined>(undefined);

export function TillSessionProvider({ children }: { children: ReactNode }) {
  const { currentBranch } = useBranch();
  const { employee } = useAuth();
  const queryClient = useQueryClient();

  // Fetch active till session for current employee
  const { data: activeTillSession, isLoading, refetch } = useQuery({
    queryKey: ['active-till-session', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return null;

      const { data, error } = await supabase
        .from('till_sessions')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as TillSession | null;
    },
    enabled: !!employee?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const openTillSession = useMutation({
    mutationFn: async (data: {
      employeeId: string;
      shiftId: string;
      openingFloat: number;
      denominations?: any;
    }) => {
      if (!currentBranch?.id) {
        throw new Error('No branch selected');
      }

      const { data: session, error } = await supabase
        .from('till_sessions')
        .insert({
          employee_id: data.employeeId,
          shift_id: data.shiftId,
          branch_id: currentBranch.id,
          opening_float: data.openingFloat,
          expected_cash: data.openingFloat,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return session as TillSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-till-session'] });
      queryClient.invalidateQueries({ queryKey: ['till-sessions'] });
    },
  });

  const closeTillSession = useMutation({
    mutationFn: async (data: {
      closingFloat: number;
      actualCash: number;
      variance: number;
      varianceReason?: string;
      denominations?: any;
    }) => {
      if (!activeTillSession) {
        throw new Error('No active till session');
      }

      const updateData: any = {
        status: 'closed',
        closed_at: new Date().toISOString(),
        closing_float: data.closingFloat,
        actual_cash: data.actualCash,
        variance: data.variance,
      };

      if (data.varianceReason) {
        updateData.variance_reason = data.varianceReason;
      }

      const { error } = await supabase
        .from('till_sessions')
        .update(updateData)
        .eq('id', activeTillSession.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-till-session'] });
      queryClient.invalidateQueries({ queryKey: ['till-sessions'] });
    },
  });

  const recordCashTransaction = useCallback(
    async (amount: number, type: 'sale' | 'change_given', orderId?: string, paymentId?: string) => {
      if (!activeTillSession || !currentBranch?.id) {
        console.warn('[Till Session] Cannot record transaction: No active session or branch');
        return;
      }

      try {
        // Insert transaction into till_ledger
        const { error: ledgerError } = await supabase
          .from('till_ledger')
          .insert({
            till_session_id: activeTillSession.id,
            branch_id: currentBranch.id,
            transaction_type: type,
            amount: type === 'change_given' ? -amount : amount,
            order_id: orderId,
            payment_id: paymentId,
          });

        if (ledgerError) {
          console.error('[Till Session] Failed to insert into till_ledger:', ledgerError);
          throw ledgerError;
        }

        // Update expected_cash in till_session
        const newExpectedCash = activeTillSession.expected_cash + (type === 'change_given' ? -amount : amount);
        
        const { error: updateError } = await supabase
          .from('till_sessions')
          .update({ expected_cash: newExpectedCash })
          .eq('id', activeTillSession.id);

        if (updateError) {
          console.error('[Till Session] Failed to update expected_cash:', updateError);
          throw updateError;
        }

        console.log('[Till Session] Transaction recorded:', { type, amount, newExpectedCash });

        // Refetch session to update local state
        await refetch();
      } catch (error) {
        console.error('[Till Session] Failed to record cash transaction:', error);
      }
    },
    [activeTillSession, currentBranch, refetch]
  );

  const getCurrentCashPosition = useCallback(() => {
    return activeTillSession?.expected_cash || 0;
  }, [activeTillSession]);

  const refreshSession = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <TillSessionContext.Provider
      value={{
        activeTillSession,
        isLoading,
        openTillSession: openTillSession.mutateAsync,
        closeTillSession: closeTillSession.mutateAsync,
        recordCashTransaction,
        getCurrentCashPosition,
        refreshSession,
      }}
    >
      {children}
    </TillSessionContext.Provider>
  );
}

export function useTillSession() {
  const context = useContext(TillSessionContext);
  if (context === undefined) {
    throw new Error('useTillSession must be used within a TillSessionProvider');
  }
  return context;
}
