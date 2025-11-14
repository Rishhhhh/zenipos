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

  // Auto-create branch if needed or auto-select Main Branch
  useEffect(() => {
    const autoCreateBranch = async () => {
      if (!isLoading && branches.length === 0 && organization?.id && !autoCreateAttempted) {
        setAutoCreateAttempted(true);
        
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
      } else if (!isLoading && branches.length > 0 && !selectedBranchId) {
        // Auto-select Main Branch if available
        const mainBranch = branches.find(b => b.code === 'MAIN') || branches[0];
        console.log('[BranchContext] Auto-selecting Main Branch:', mainBranch.id);
        selectBranch(mainBranch.id);
        setIsReady(true);
      } else if (!isLoading) {
        setIsReady(true);
      }
    };

    autoCreateBranch();
  }, [isLoading, branches.length, organization?.id, autoCreateAttempted, refetch, selectedBranchId]);

  // Restore from localStorage or auto-select on mount
  useEffect(() => {
    setError(null);

    if (isLoading) {
      setIsReady(false);
      return;
    }

    // Handle query errors
    if (queryError) {
      console.error('[BranchContext] Query error:', queryError);
      setError('query_failed');
      setIsReady(true);
      return;
    }

    if (!branches || branches.length === 0) {
      if (!autoCreateAttempted) {
        setIsReady(false);
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
