import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

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

export function BranchProvider({ children }: { children: ReactNode }) {
  const { organization } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: branches = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['user-branches', organization?.id],
    queryFn: async () => {
      console.log('[BranchContext] 🔍 Starting branch query for org:', organization?.id);
      
      if (!organization?.id) {
        console.log('[BranchContext] ❌ No organization ID, returning empty array');
        return [];
      }
      
      // Get auth user
      console.log('[BranchContext] 🔑 Getting auth user...');
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      console.log('[BranchContext] Auth user response:', { 
        userId: authUser?.user?.id, 
        error: authError 
      });
      
      // Fallback: If no auth.uid(), fetch branches directly via organization
      if (!authUser?.user?.id) {
        console.warn('[BranchContext] ⚠️ No auth.uid() found, fetching branches via organization owner');
        console.log('[BranchContext] Fetching branches for org_id:', organization.id);
        
        const { data: branchesData, error: branchError } = await supabase
          .from('branches')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('active', true)
          .order('name');
        
        console.log('[BranchContext] Direct fetch result:', { 
          branches: branchesData, 
          error: branchError,
          errorDetails: branchError ? JSON.stringify(branchError, null, 2) : null
        });
        
        if (branchError) throw branchError;
        return branchesData as Branch[];
      }

      // Normal flow with auth user
      console.log('[BranchContext] 👤 Calling get_accessible_branch_ids for user:', authUser.user.id);
      const { data: branchIds, error: rpcError } = await supabase.rpc('get_accessible_branch_ids', {
        _user_id: authUser.user.id
      });
      
      console.log('[BranchContext] RPC result:', { 
        branchIds, 
        error: rpcError,
        errorDetails: rpcError ? JSON.stringify(rpcError, null, 2) : null
      });
      
      if (rpcError) throw rpcError;
      
      if (!branchIds || branchIds.length === 0) {
        console.log('[BranchContext] ℹ️ No accessible branch IDs found');
        return [];
      }

      const extractedIds = branchIds.map((b: any) => b.branch_id);
      console.log('[BranchContext] 📋 Fetching branches with IDs:', extractedIds);
      
      const { data: branchesData, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .in('id', extractedIds)
        .eq('active', true)
        .order('name');

      console.log('[BranchContext] Branches fetch result:', { 
        branches: branchesData, 
        count: branchesData?.length,
        error: branchError,
        errorDetails: branchError ? JSON.stringify(branchError, null, 2) : null
      });

      if (branchError) throw branchError;
      return branchesData as Branch[];
    },
    enabled: !!organization?.id,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Auto-select first available branch when branches are loaded
  useEffect(() => {
    console.log('[BranchContext] 🔄 Auto-select effect triggered:', {
      isLoading,
      branchesCount: branches.length,
      selectedBranchId,
      branches: branches.map(b => ({ id: b.id, name: b.name, code: b.code }))
    });
    
    if (!isLoading && branches.length > 0 && !selectedBranchId) {
      // Auto-select Main Branch if available, otherwise first branch
      const mainBranch = branches.find(b => b.code === 'MAIN') || branches[0];
      console.log('[BranchContext] ✅ Auto-selecting branch:', {
        id: mainBranch.id,
        name: mainBranch.name,
        code: mainBranch.code
      });
      selectBranch(mainBranch.id);
      setIsReady(true);
    } else if (!isLoading) {
      console.log('[BranchContext] ✓ Setting ready without selection');
      setIsReady(true);
    }
  }, [isLoading, branches.length, selectedBranchId]);

  // Restore from localStorage or auto-select on mount
  useEffect(() => {
    console.log('[BranchContext] 💾 localStorage restore effect triggered:', {
      isLoading,
      branchesCount: branches.length,
      queryError: queryError ? JSON.stringify(queryError, null, 2) : null
    });
    
    setError(null);

    if (isLoading) {
      console.log('[BranchContext] ⏳ Still loading, waiting...');
      setIsReady(false);
      return;
    }

    // Handle query errors
    if (queryError) {
      console.error('[BranchContext] ❌ Query error detected:', {
        error: queryError,
        message: (queryError as any)?.message,
        code: (queryError as any)?.code,
        details: (queryError as any)?.details,
        hint: (queryError as any)?.hint
      });
      setError('query_failed');
      setIsReady(true);
      return;
    }

    if (!branches || branches.length === 0) {
      console.error('[BranchContext] ⚠️ No branches available');
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
  }, [branches, isLoading, queryError]);

  const selectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    localStorage.setItem(STORAGE_KEY, branchId);
  };

  // Get current branch
  const currentBranch = branches.find(b => b.id === selectedBranchId) || null;
  const hasMultipleBranches = branches.length > 1;

  return (
    <BranchContext.Provider
      value={{
        selectedBranchId,
        branches,
        currentBranch,
        hasMultipleBranches,
        isLoading,
        isReady,
        error,
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
