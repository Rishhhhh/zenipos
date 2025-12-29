import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface ActiveShift {
  id: string;
  clockInAt: Date;
  branchId: string | null;
  status: string;
  tillSessionId: string | null;
  employeeId: string;
  employeeName?: string;
}

interface ShiftContextType {
  activeShift: ActiveShift | null;
  isLoading: boolean;
  shiftElapsed: string; // "HH:MM" format
  refreshShift: () => Promise<void>;
  setActiveShift: (shift: ActiveShift | null) => void;
  clearShift: () => void;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export function ShiftProvider({ children }: { children: ReactNode }) {
  const { employee } = useAuth();
  const queryClient = useQueryClient();
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shiftElapsed, setShiftElapsed] = useState('00:00');

  // Format elapsed time as HH:MM
  const formatElapsed = useCallback((startTime: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }, []);

  // Fetch active shift from database
  const refreshShift = useCallback(async () => {
    if (!employee?.id) {
      setActiveShift(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the get_active_shift RPC to check for active shifts
      const { data, error } = await supabase.rpc('get_active_shift', {
        employee_id_param: employee.id
      });

      if (error) {
        console.error('[ShiftContext] Error fetching active shift:', error);
        setActiveShift(null);
      } else if (data && data.length > 0) {
        const shift = data[0];
        console.log('[ShiftContext] Found active shift:', shift.shift_id);
        setActiveShift({
          id: shift.shift_id,
          clockInAt: new Date(shift.clock_in_at),
          branchId: shift.branch_id,
          status: shift.status,
          tillSessionId: shift.till_session_id,
          employeeId: employee.id,
          employeeName: employee.name,
        });
      } else {
        console.log('[ShiftContext] No active shift found');
        setActiveShift(null);
      }
    } catch (err) {
      console.error('[ShiftContext] Unexpected error:', err);
      setActiveShift(null);
    } finally {
      setIsLoading(false);
    }
  }, [employee?.id, employee?.name]);

  // Clear shift (on clock out)
  const clearShift = useCallback(() => {
    setActiveShift(null);
    setShiftElapsed('00:00');
    queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
  }, [queryClient]);

  // Load active shift on mount and when employee changes
  useEffect(() => {
    refreshShift();
  }, [refreshShift]);

  // Update elapsed time every minute
  useEffect(() => {
    if (!activeShift?.clockInAt) {
      setShiftElapsed('00:00');
      return;
    }

    // Initial update
    setShiftElapsed(formatElapsed(activeShift.clockInAt));

    // Update every minute
    const interval = setInterval(() => {
      setShiftElapsed(formatElapsed(activeShift.clockInAt));
    }, 60000);

    return () => clearInterval(interval);
  }, [activeShift?.clockInAt, formatElapsed]);

  // Auto-refresh shift status periodically (every 30 seconds)
  useEffect(() => {
    if (!employee?.id) return;

    const interval = setInterval(() => {
      refreshShift();
    }, 30000);

    return () => clearInterval(interval);
  }, [employee?.id, refreshShift]);

  // Listen for shift changes via Supabase Realtime
  useEffect(() => {
    if (!employee?.id) return;

    const channel = supabase
      .channel('shift-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shifts',
          filter: `employee_id=eq.${employee.id}`,
        },
        (payload) => {
          console.log('[ShiftContext] Shift change detected:', payload.eventType);
          refreshShift();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employee?.id, refreshShift]);

  return (
    <ShiftContext.Provider
      value={{
        activeShift,
        isLoading,
        shiftElapsed,
        refreshShift,
        setActiveShift,
        clearShift,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (context === undefined) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
}
