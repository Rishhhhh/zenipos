import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { APP_CONFIG } from '@/lib/config';

interface Branch {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  active: boolean;
  organization_id: string;
}

interface BranchContextType {
  selectedBranchId: string | null;
  branches: Branch[];
  currentBranch: Branch | null;
  hasMultipleBranches: boolean;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  selectBranch: (branchId: string) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const STORAGE_KEY = 'pos_selected_branch';

// BYPASS MODE: Default branch for auth bypass
const DEFAULT_BRANCH: Branch = {
  id: 'default-branch-id',
  name: 'Main Branch',
  code: 'MAIN',
  organization_id: 'bypass-org-id',
  active: true,
  address: null,
  phone: null,
};

export function BranchProvider({ children }: { children: ReactNode }) {
  const { organization } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoCreateAttempted, setAutoCreateAttempted] = useState(false);

  const { data: branches = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['user-branches', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      // Get auth user
      const { data: authUser } = await supabase.auth.getUser();
      
      // Fallback: If no auth.uid(), fetch branches directly via organization
      if (!authUser?.user?.id) {
        console.warn('[BranchContext] No auth.uid() found, fetching branches via organization owner');
        const { data: branchesData, error: branchError } = await supabase
          .from('branches')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('active', true)
          .order('name');
        
        if (branchError) throw branchError;
        return branchesData as Branch[];
      }

      // Normal flow with auth user
      const { data: branchIds, error: rpcError } = await supabase.rpc('get_user_branches', {
        _user_id: authUser.user.id
      });
      
      if (rpcError) throw rpcError;
      if (!branchIds || branchIds.length === 0) return [];

      const { data: branchesData, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .in('id', branchIds.map((b: any) => b.branch_id))
        .eq('active', true)
        .order('name');

      if (branchError) throw branchError;
      return branchesData as Branch[];
    },
    enabled: !!organization?.id,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // BYPASS MODE: Always use default branch
  useEffect(() => {
    setSelectedBranchId(DEFAULT_BRANCH.id);
    setIsReady(true);
    setError(null);
  }, []);

  // Auto-create branch if needed or use default virtual branch (DISABLED IN BYPASS MODE)
  useEffect(() => {
    if (true) return; // Bypass enabled
    const autoCreateBranch = async () => {
      if (!isLoading && branches.length === 0 && organization?.id && !autoCreateAttempted) {
        setAutoCreateAttempted(true);
        
        // In development mode with REQUIRE_BRANCHES = false, don't block on missing branches
        if (!APP_CONFIG.REQUIRE_BRANCHES) {
          console.log('[BranchContext] Development mode: Using virtual default branch');
          setIsReady(true);
          return;
        }
        
        console.log('[BranchContext] No branches found, attempting auto-creation...');
        
        try {
          const { data: newBranch, error } = await supabase
            .from('branches')
            .insert({
              organization_id: organization.id,
              name: 'Main Branch',
              code: 'MAIN',
              active: true,
            })
            .select()
            .single();

          if (!error && newBranch) {
            console.log('[BranchContext] ✅ Auto-created Main Branch:', newBranch.id);
            refetch();
          } else {
            console.error('[BranchContext] Auto-creation failed:', error);
            setError('no_branches');
            setIsReady(true);
          }
        } catch (err) {
          console.error('[BranchContext] Auto-creation error:', err);
          setError('no_branches');
          setIsReady(true);
        }
      }
    };

    autoCreateBranch();
  }, [isLoading, branches.length, organization?.id, autoCreateAttempted, refetch]);

  // Restore from localStorage or auto-select on mount
  useEffect(() => {
    setError(null);

    if (isLoading) {
      setIsReady(false);
      return;
    }

    // Handle query errors - don't block in development mode
    if (queryError) {
      console.error('[BranchContext] Query error:', queryError);
      if (!APP_CONFIG.REQUIRE_BRANCHES) {
        console.log('[BranchContext] Development mode: Ignoring query error, using default branch');
        setSelectedBranchId('default-branch');
        setIsReady(true);
      } else {
        setError('query_failed');
        setIsReady(true);
      }
      return;
    }

    if (!branches || branches.length === 0) {
      if (!autoCreateAttempted) {
        setIsReady(false);
        return;
      }
      
      // In development mode, use virtual default branch
      if (!APP_CONFIG.REQUIRE_BRANCHES) {
        console.log('[BranchContext] No branches found, using virtual default for development');
        setSelectedBranchId('default-branch');
        setIsReady(true);
        return;
      }
      
      // Auto-creation was attempted but failed
      setError('no_branches');
      setIsReady(true);
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && branches.some(b => b.id === stored || stored === 'all')) {
      setSelectedBranchId(stored);
      setIsReady(true);
    } else if (branches.length === 1) {
      // Auto-select if only 1 branch - immediate and ready
      setSelectedBranchId(branches[0].id);
      localStorage.setItem(STORAGE_KEY, branches[0].id);
      setIsReady(true);
    } else {
      // Default to 'all' for multi-branch orgs
      setSelectedBranchId('all');
      localStorage.setItem(STORAGE_KEY, 'all');
      setIsReady(true);
    }
  }, [branches, isLoading, autoCreateAttempted, queryError]);

  const selectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    localStorage.setItem(STORAGE_KEY, branchId);
  };

  // Get current branch or use virtual default in development mode
  const currentBranch = branches.find(b => b.id === selectedBranchId) || 
    (selectedBranchId === 'default-branch' && !APP_CONFIG.REQUIRE_BRANCHES ? {
      id: 'default-branch',
      name: 'Default Branch',
      code: 'DEV',
      address: null,
      phone: null,
      active: true,
      organization_id: organization?.id || 'default-org',
    } : null);
  const hasMultipleBranches = branches.length > 1;

  // BYPASS MODE: Always return default branch
  return (
    <BranchContext.Provider
      value={{
        selectedBranchId: DEFAULT_BRANCH.id,
        branches: [DEFAULT_BRANCH],
        currentBranch: DEFAULT_BRANCH,
        hasMultipleBranches: false,
        isLoading: false,
        isReady: true,
        error: null,
        selectBranch,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
