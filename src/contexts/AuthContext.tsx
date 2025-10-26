import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Employee {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'manager' | 'cashier';
  branch_id?: string;
}

interface POSSession {
  employeeId: string;
  employeeName: string;
  role: 'admin' | 'manager' | 'cashier';
  shiftId?: string;
  loginTime: number;
  expiresAt: number;
  rememberMe: boolean;
}

interface AuthContextType {
  employee: Employee | null;
  role: 'admin' | 'manager' | 'cashier' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  shiftId: string | null;
  login: (pin: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
const STORAGE_KEY = 'pos_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shiftId, setShiftId] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        const session: POSSession = JSON.parse(stored);
        
        // Check if session expired
        if (Date.now() > session.expiresAt) {
          localStorage.removeItem(STORAGE_KEY);
          setIsLoading(false);
          return;
        }

        // Restore employee data
        setEmployee({
          id: session.employeeId,
          name: session.employeeName,
          role: session.role,
        });
        setShiftId(session.shiftId || null);
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (pin: string, rememberMe: boolean) => {
    try {
      // Call employee-login edge function
      const { data, error } = await supabase.functions.invoke('employee-login', {
        body: { pin },
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Login failed');
      }

      const employeeData: Employee = data.employee;

      // Create shift record
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .insert({
          employee_id: employeeData.id,
          clock_in_at: new Date().toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (shiftError) {
        console.error('Failed to create shift:', shiftError);
      }

      // Create session
      const session: POSSession = {
        employeeId: employeeData.id,
        employeeName: employeeData.name,
        role: employeeData.role,
        shiftId: shift?.id,
        loginTime: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION,
        rememberMe,
      };

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

      setEmployee(employeeData);
      setShiftId(shift?.id || null);

      toast.success(`Welcome back, ${employeeData.name}!`);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid PIN. Please try again.');
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clock out shift if exists
      if (shiftId) {
        await supabase
          .from('shifts')
          .update({
            clock_out_at: new Date().toISOString(),
            status: 'completed',
          })
          .eq('id', shiftId);
      }

      // Clear session
      localStorage.removeItem(STORAGE_KEY);
      setEmployee(null);
      setShiftId(null);

      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        employee,
        role: employee?.role || null,
        isAuthenticated: !!employee,
        isLoading,
        shiftId,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
