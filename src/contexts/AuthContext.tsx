import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { APP_CONFIG } from '@/lib/config';

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
  setOrganization: ((org: Organization | null) => void) | null;
  isOrganizationAuthenticated: boolean;
  organizationLogin: (email: string, password: string) => Promise<void>;
  organizationLogout: () => Promise<void>;
  
  // Employee-level
  employee: Employee | null;
  role: 'owner' | 'manager' | 'staff' | null;
  isEmployeeAuthenticated: boolean;
  employeeLogin: (pin: string, rememberMe: boolean) => Promise<void>;
  employeeLogout: () => Promise<void>;
  
  // Super Admin
  isSuperAdmin: boolean;
  isImpersonating: boolean;
  impersonatedOrganization: Organization | null;
  startImpersonation: (orgId: string, reason: string) => Promise<void>;
  endImpersonation: () => Promise<void>;
  
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
const EMPLOYEE_SESSION_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year (permanent when remember me is checked)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedOrganization, setImpersonatedOrganization] = useState<Organization | null>(null);

  // Session restoration and auth state management
  useEffect(() => {
    const restoreSessions = async () => {
      try {
        // DEVELOPMENT MODE: Bypass all auth validation
        if (APP_CONFIG.DEVELOPMENT_MODE) {
          console.log('[Auth] 🛠️ DEVELOPMENT_MODE: Bypassing auth checks');
          
          // Create mock organization for development
          setOrganization({
            id: 'dev-org-id',
            name: 'Development Restaurant',
            slug: 'dev',
            branding: { name: 'Development Restaurant' }
          });
          
          // Create mock employee for development
          setEmployee({
            id: 'dev-emp-id',
            name: 'Dev User',
            role: 'owner'  // Full permissions
          });
          
          setIsLoading(false);
          return;
        }
        
        // PRODUCTION MODE: Step 1: Check organization session
        const orgStored = localStorage.getItem(ORG_SESSION_KEY);
        if (orgStored) {
          const orgSession: OrgSession = JSON.parse(orgStored);
          if (Date.now() <= orgSession.expiresAt) {
            // CRITICAL: Validate that auth.uid() exists for org session
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
              console.warn('[Auth] Organization session exists but no auth.uid() - clearing stale session');
              localStorage.removeItem(ORG_SESSION_KEY);
              localStorage.removeItem(EMPLOYEE_SESSION_KEY);
              setOrganization(null);
              setEmployee(null);
              toast.error('Your session has expired. Please log in again.');
              setIsLoading(false);
              return;
            }

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

    const checkSuperAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'super_admin'
      });

      if (!error && data) {
        setIsSuperAdmin(true);
      }
    };

    const checkImpersonation = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgId } = await supabase.rpc('is_impersonating', {
        _user_id: user.id
      });

      if (orgId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single();

        if (org) {
          setIsImpersonating(true);
          setImpersonatedOrganization({
            id: org.id,
            name: org.name,
            slug: org.slug,
            branding: {
              name: org.name,
              logoUrl: org.logo_url,
              primaryColor: org.primary_color,
              accentColor: org.accent_color,
            }
          });
        }
      }
    };

    // Set up Supabase auth state listener
    // Attempt to refresh auth session on mount
    const refreshAuthSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.warn('[Auth] Failed to refresh session on mount:', error);
          const orgStored = localStorage.getItem(ORG_SESSION_KEY);
          if (orgStored) {
            console.log('[Auth] Clearing stale sessions due to refresh failure');
            localStorage.removeItem(ORG_SESSION_KEY);
            localStorage.removeItem(EMPLOYEE_SESSION_KEY);
            setOrganization(null);
            setEmployee(null);
            toast.error('Session expired. Please log in again.');
          }
        } else if (session) {
          console.log('[Auth] ✅ Session refreshed successfully on mount');
        }
      } catch (err) {
        console.error('[Auth] Session refresh error:', err);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await restoreSessions();
          await checkSuperAdmin();
          await checkImpersonation();
        } else if (event === 'SIGNED_OUT') {
          setOrganization(null);
          setEmployee(null);
          setShiftId(null);
          setIsSuperAdmin(false);
          setIsImpersonating(false);
          setImpersonatedOrganization(null);
          localStorage.removeItem(ORG_SESSION_KEY);
          localStorage.removeItem(EMPLOYEE_SESSION_KEY);
        }
      }
    );

    // Initial session refresh then restoration
    refreshAuthSession().then(() => {
      restoreSessions();
      checkSuperAdmin();
      checkImpersonation();
    });

    return () => subscription.unsubscribe();
  }, []);

  const organizationLogin = async (email: string, password: string) => {
    try {
      console.log('[Organization Login] Attempting login for:', email);
      
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Use raw fetch() to properly extract error messages from non-2xx responses
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/organization-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      console.log('[Organization Login] Response:', {
        status: response.status,
        ok: response.ok,
        success: data?.success,
      });

      // Handle non-2xx responses with specific error messages
      if (!response.ok) {
        const errorMessage = data?.error || `Login failed (${response.status})`;
        console.error('[Auth Error]', {
          status: response.status,
          message: errorMessage,
          email,
          timestamp: new Date().toISOString(),
        });
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'Login failed';
        console.error('[Organization Login] Failed:', errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Sign in the owner via Supabase Auth to establish auth.uid()
      console.log('[Organization Login] Signing in owner via Supabase Auth...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('[Auth Error] Failed to sign in owner:', authError);
        // CRITICAL: Clear org session if auth fails
        localStorage.removeItem(ORG_SESSION_KEY);
        setOrganization(null);
        toast.error('Authentication failed. Please try logging in again.');
        throw new Error('Failed to establish authentication session');
      }
      
      console.log('[Organization Login] ✅ Owner signed in successfully, auth.uid() is now set');

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

      console.log('[Organization Login] Success! Organization:', data.branding?.name || data.slug);
      toast.success(`Welcome to ${data.branding?.name || data.slug}!`);
    } catch (error: any) {
      console.error('[Organization Login] Unexpected error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
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

  const startImpersonation = async (orgId: string, reason: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-impersonate', {
        body: { action: 'start', organizationId: orgId, reason }
      });

      if (error) throw error;

      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (org) {
        setIsImpersonating(true);
        setImpersonatedOrganization({
          id: org.id,
          name: org.name,
          slug: org.slug,
          branding: {
            name: org.name,
            logoUrl: org.logo_url,
            primaryColor: org.primary_color,
            accentColor: org.accent_color,
          }
        });
        toast.success(`Now impersonating ${org.name}`);
      }
    } catch (error: any) {
      console.error('Impersonation start error:', error);
      toast.error(error.message || 'Failed to start impersonation');
      throw error;
    }
  };

  const endImpersonation = async () => {
    try {
      const { error } = await supabase.functions.invoke('super-admin-impersonate', {
        body: { action: 'end' }
      });

      if (error) throw error;

      setIsImpersonating(false);
      setImpersonatedOrganization(null);
      toast.success('Impersonation ended');
    } catch (error: any) {
      console.error('Impersonation end error:', error);
      toast.error(error.message || 'Failed to end impersonation');
      throw error;
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
        setOrganization,
        isOrganizationAuthenticated,
        organizationLogin,
        organizationLogout,
        
        // Employee-level
        employee,
        role: employee?.role || null,
        isEmployeeAuthenticated,
        employeeLogin,
        employeeLogout,
        
        // Super Admin
        isSuperAdmin,
        isImpersonating,
        impersonatedOrganization,
        startImpersonation,
        endImpersonation,
        
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
