import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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

  // Single consolidated effect for branch selection
  useEffect(() => {
    console.log('[BranchContext] 🔄 Branch selection effect triggered:', {
      isLoading,
      branchesCount: branches.length,
      selectedBranchId,
      queryError: queryError ? 'Error present' : 'No error',
      branches: branches.map(b => ({ id: b.id, name: b.name, code: b.code }))
    });
    
    // Reset error on every run
    setError(null);

    // Wait for query to complete
    if (isLoading) {
      console.log('[BranchContext] ⏳ Still loading, waiting...');
      setIsReady(false);
      return;
    }

    // Handle query errors - DON'T set ready
    if (queryError) {
      console.error('[BranchContext] ❌ Query error detected:', {
        error: queryError,
        message: (queryError as any)?.message,
        code: (queryError as any)?.code,
        details: (queryError as any)?.details,
        hint: (queryError as any)?.hint
      });
      setError('query_failed');
      setIsReady(false); // ← CRITICAL: Stay unready on error
      return;
    }

    // Handle no branches case
    if (!branches || branches.length === 0) {
      console.error('[BranchContext] ⚠️ No branches available');
      setError('no_branches');
      setIsReady(true); // OK to be ready here - no data is valid state
      return;
    }

    // Branch selection logic - only runs if we have branches
    if (!selectedBranchId) {
      console.log('[BranchContext] 🎯 No branch selected, determining selection...');
      
      // Priority 1: Main Branch (always prefer this)
      const mainBranch = branches.find(b => b.code === 'MAIN');
      if (mainBranch) {
        console.log('[BranchContext] ✅ Auto-selecting Main Branch:', {
          id: mainBranch.id,
          name: mainBranch.name,
          code: mainBranch.code
        });
        setSelectedBranchId(mainBranch.id);
        localStorage.setItem(STORAGE_KEY, mainBranch.id);
        setIsReady(true);
        return;
      }

      // Priority 2: Previously stored branch (if valid)
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'all' || branches.some(b => b.id === stored))) {
        console.log('[BranchContext] 📌 Restoring from localStorage:', stored);
        setSelectedBranchId(stored);
        setIsReady(true);
        return;
      }

      // Priority 3: Single branch - auto-select it
      if (branches.length === 1) {
        console.log('[BranchContext] 🔵 Single branch, auto-selecting:', branches[0].name);
        setSelectedBranchId(branches[0].id);
        localStorage.setItem(STORAGE_KEY, branches[0].id);
        setIsReady(true);
        return;
      }

      // Priority 4: Multiple branches - default to 'all'
      console.log('[BranchContext] 🌐 Multiple branches, defaulting to "all"');
      setSelectedBranchId('all');
      localStorage.setItem(STORAGE_KEY, 'all');
      setIsReady(true);
    } else {
      // Already have a selection, just mark as ready
      console.log('[BranchContext] ✓ Branch already selected:', selectedBranchId);
      setIsReady(true);
    }
  }, [branches, isLoading, queryError, selectedBranchId]);

  const selectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    localStorage.setItem(STORAGE_KEY, branchId);
  };

  // Get current branch
  const currentBranch = branches.find(b => b.id === selectedBranchId) || null;
  const hasMultipleBranches = branches.length > 1;

  // Add error UI for query failures
  if (error === 'query_failed') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cannot Load Branches</AlertTitle>
          <AlertDescription>
            There was an error connecting to the database. This may be due to:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Database permissions issue</li>
              <li>Network connectivity problem</li>
              <li>Invalid authentication token</li>
            </ul>
            <div className="mt-4 text-sm">
              Try <button 
                onClick={() => window.location.href = '/login'}
                className="underline font-medium"
              >
                logging out
              </button> and back in, or contact support if the issue persists.
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Add UI for no branches case
  if (error === 'no_branches' && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Branches Available</AlertTitle>
          <AlertDescription>
            Your organization doesn't have any active branches set up yet. 
            Please contact your organization owner to create a branch.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
