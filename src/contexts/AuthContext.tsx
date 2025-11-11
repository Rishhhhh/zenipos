import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Employee {
  id: string;
  name: string;
  email?: string;
  role: 'owner' | 'manager' | 'staff';
  branch_id?: string;
}

interface POSSession {
  employeeId: string;
  employeeName: string;
  role: 'owner' | 'manager' | 'staff';
  shiftId?: string;
  loginTime: number;
  expiresAt: number;
  rememberMe: boolean;
}

interface AuthContextType {
  employee: Employee | null;
  role: 'owner' | 'manager' | 'staff' | null;
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

  // Restore session on mount and listen to auth changes
  useEffect(() => {
    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Restore employee data from localStorage
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              const localSession: POSSession = JSON.parse(stored);
              if (Date.now() <= localSession.expiresAt) {
                setEmployee({
                  id: localSession.employeeId,
                  name: localSession.employeeName,
                  role: localSession.role,
                });
                setShiftId(localSession.shiftId || null);
              } else {
                localStorage.removeItem(STORAGE_KEY);
              }
            } catch (error) {
              console.error('Failed to restore session:', error);
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setEmployee(null);
          setShiftId(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    );

    // Timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Auth initialization timeout - forcing load');
      setIsLoading(false);
    }, 5000);

    // Check for existing Supabase session on mount
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('❌ Supabase auth error:', error);
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
        
        if (session) {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              const localSession: POSSession = JSON.parse(stored);
              if (Date.now() <= localSession.expiresAt) {
                setEmployee({
                  id: localSession.employeeId,
                  name: localSession.employeeName,
                  role: localSession.role,
                });
                setShiftId(localSession.shiftId || null);
              } else {
                localStorage.removeItem(STORAGE_KEY);
              }
            } catch (error) {
              console.error('Failed to restore session:', error);
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error('❌ Fatal auth error:', error);
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
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
      const authSession = data.session;

      // Set Supabase session (enables RLS policies with auth.uid())
      if (authSession) {
        await supabase.auth.setSession({
          access_token: authSession.access_token,
          refresh_token: authSession.refresh_token,
        });
      }

      // Create shift record
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .insert({
          employee_id: employeeData.id,
          user_id: data.user?.id || employeeData.id,
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

      // Sign out from Supabase Auth
      await supabase.auth.signOut();

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
