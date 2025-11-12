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

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  branding: {
    name: string;
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
  };
}

interface OrgSession {
  organizationId: string;
  organizationName: string;
  slug: string;
  sessionToken: string;
  loginTime: number;
  expiresAt: number;
  branches: Array<{
    id: string;
    name: string;
    code: string;
    address?: string;
  }>;
}

interface EmployeeSession {
  organizationId: string;
  employeeId: string;
  employeeName: string;
  role: 'owner' | 'manager' | 'staff';
  shiftId?: string;
  loginTime: number;
  expiresAt: number;
  rememberMe: boolean;
}

interface AuthContextType {
  // Organization-level
  organization: Organization | null;
  isOrganizationAuthenticated: boolean;
  organizationLogin: (email: string, password: string) => Promise<void>;
  organizationLogout: () => Promise<void>;
  
  // Employee-level
  employee: Employee | null;
  role: 'owner' | 'manager' | 'staff' | null;
  isEmployeeAuthenticated: boolean;
  employeeLogin: (pin: string, rememberMe: boolean) => Promise<void>;
  employeeLogout: () => Promise<void>;
  
  // Combined state
  isFullyAuthenticated: boolean;
  isAuthenticated: boolean; // Legacy - maps to isEmployeeAuthenticated
  isLoading: boolean;
  shiftId: string | null;
  login: (pin: string, rememberMe: boolean) => Promise<void>; // Legacy - maps to employeeLogin
  logout: () => Promise<void>; // Legacy - maps to employeeLogout
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ORG_SESSION_KEY = 'pos_org_session';
const EMPLOYEE_SESSION_KEY = 'pos_employee_session';
const ORG_SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
const EMPLOYEE_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export function AuthProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shiftId, setShiftId] = useState<string | null>(null);

  // Session restoration and auth state management
  useEffect(() => {
    const restoreSessions = async () => {
      try {
        // Step 1: Check organization session
        const orgStored = localStorage.getItem(ORG_SESSION_KEY);
        if (orgStored) {
          const orgSession: OrgSession = JSON.parse(orgStored);
          if (Date.now() <= orgSession.expiresAt) {
            setOrganization({
              id: orgSession.organizationId,
              name: orgSession.organizationName,
              slug: orgSession.slug,
              branding: {
                name: orgSession.organizationName,
              }
            });

            // Step 2: Check employee session (only if org is valid)
            const empStored = localStorage.getItem(EMPLOYEE_SESSION_KEY);
            if (empStored) {
              const empSession: EmployeeSession = JSON.parse(empStored);
              // Validate employee session matches current org and not expired
              if (
                Date.now() <= empSession.expiresAt &&
                empSession.organizationId === orgSession.organizationId
              ) {
                setEmployee({
                  id: empSession.employeeId,
                  name: empSession.employeeName,
                  role: empSession.role,
                });
                setShiftId(empSession.shiftId || null);
              } else {
                localStorage.removeItem(EMPLOYEE_SESSION_KEY);
              }
            }
          } else {
            // Org session expired, clear both
            localStorage.removeItem(ORG_SESSION_KEY);
            localStorage.removeItem(EMPLOYEE_SESSION_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to restore sessions:', error);
        localStorage.removeItem(ORG_SESSION_KEY);
        localStorage.removeItem(EMPLOYEE_SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await restoreSessions();
        } else if (event === 'SIGNED_OUT') {
          setOrganization(null);
          setEmployee(null);
          setShiftId(null);
          localStorage.removeItem(ORG_SESSION_KEY);
          localStorage.removeItem(EMPLOYEE_SESSION_KEY);
        }
      }
    );

    // Initial session restoration
    restoreSessions();

    return () => subscription.unsubscribe();
  }, []);

  const organizationLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('organization-login', {
        body: { email, password },
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Login failed');
      }

      // Set Supabase auth session
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      // Create organization session
      const orgSession: OrgSession = {
        organizationId: data.organizationId,
        organizationName: data.branding?.name || data.slug,
        slug: data.slug,
        sessionToken: data.sessionToken,
        loginTime: Date.now(),
        expiresAt: Date.now() + ORG_SESSION_DURATION,
        branches: data.branches || [],
      };

      localStorage.setItem(ORG_SESSION_KEY, JSON.stringify(orgSession));

      setOrganization({
        id: data.organizationId,
        name: data.branding?.name || data.slug,
        slug: data.slug,
        logoUrl: data.branding?.logoUrl,
        primaryColor: data.branding?.primaryColor,
        accentColor: data.branding?.accentColor,
        branding: data.branding || { name: data.slug },
      });

      toast.success(`Welcome to ${data.branding?.name || data.slug}!`);
    } catch (error: any) {
      console.error('Organization login error:', error);
      const message = error.message || 'Login failed. Please try again.';
      toast.error(message);
      throw error;
    }
  };

  const organizationLogout = async () => {
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

      // Sign out from Supabase Auth (full logout)
      await supabase.auth.signOut();

      // Clear both sessions
      localStorage.removeItem(ORG_SESSION_KEY);
      localStorage.removeItem(EMPLOYEE_SESSION_KEY);

      setOrganization(null);
      setEmployee(null);
      setShiftId(null);

      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Organization logout error:', error);
      toast.error('Error logging out');
    }
  };

  const employeeLogin = async (pin: string, rememberMe: boolean) => {
    try {
      // Check organization session exists
      if (!organization) {
        throw new Error('Organization session expired. Please login again.');
      }

      const { data, error } = await supabase.functions.invoke('employee-login', {
        body: { 
          pin,
          organizationId: organization.id
        },
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Login failed');
      }

      const employeeData: Employee = data.employee;

      // Validate employee belongs to current organization
      if (data.organizationId && data.organizationId !== organization.id) {
        throw new Error('Access denied. Please contact your manager.');
      }

      // Set Supabase session if provided
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      // ✅ SECURITY: Prioritize user_roles over employees.role to prevent privilege escalation
      let effectiveRole = employeeData.role;
      
      if (data.user?.id) {
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!roleError && userRole?.role) {
          effectiveRole = userRole.role as 'owner' | 'manager' | 'staff';
          console.log(`✅ Role from user_roles: ${effectiveRole} (employee.role: ${employeeData.role})`);
        } else {
          console.log(`⚠️ Falling back to employee.role: ${employeeData.role}`);
        }
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

      // Create employee session with verified role
      const empSession: EmployeeSession = {
        organizationId: organization.id,
        employeeId: employeeData.id,
        employeeName: employeeData.name,
        role: effectiveRole, // ✅ Use verified role from user_roles
        shiftId: shift?.id,
        loginTime: Date.now(),
        expiresAt: Date.now() + EMPLOYEE_SESSION_DURATION,
        rememberMe,
      };

      localStorage.setItem(EMPLOYEE_SESSION_KEY, JSON.stringify(empSession));

      setEmployee(employeeData);
      setShiftId(shift?.id || null);

      toast.success(`Welcome back, ${employeeData.name}!`);
    } catch (error: any) {
      console.error('Employee login error:', error);
      toast.error(error.message || 'Invalid PIN. Please try again.');
      throw error;
    }
  };

  const employeeLogout = async () => {
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

      // Clear employee session only (preserve org session)
      localStorage.removeItem(EMPLOYEE_SESSION_KEY);
      setEmployee(null);
      setShiftId(null);

      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Employee logout error:', error);
      toast.error('Error logging out');
    }
  };

  const isOrganizationAuthenticated = !!organization;
  const isEmployeeAuthenticated = !!employee;
  const isFullyAuthenticated = isOrganizationAuthenticated && isEmployeeAuthenticated;

  return (
    <AuthContext.Provider
      value={{
        // Organization-level
        organization,
        isOrganizationAuthenticated,
        organizationLogin,
        organizationLogout,
        
        // Employee-level
        employee,
        role: employee?.role || null,
        isEmployeeAuthenticated,
        employeeLogin,
        employeeLogout,
        
        // Combined state
        isFullyAuthenticated,
        isAuthenticated: isEmployeeAuthenticated, // Legacy
        isLoading,
        shiftId,
        
        // Legacy methods
        login: employeeLogin,
        logout: employeeLogout,
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
