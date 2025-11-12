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
  selectBranch: (branchId: string) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const STORAGE_KEY = 'pos_selected_branch';

export function BranchProvider({ children }: { children: ReactNode }) {
  const { organization } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['user-branches', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data: branchIds, error: rpcError } = await supabase.rpc('get_user_branches', {
        _user_id: (await supabase.auth.getUser()).data.user?.id
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
  });

  // Restore from localStorage or auto-select on mount
  useEffect(() => {
    if (!branches || branches.length === 0) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && branches.some(b => b.id === stored || stored === 'all')) {
      setSelectedBranchId(stored);
    } else if (branches.length === 1) {
      // Auto-select if only 1 branch
      setSelectedBranchId(branches[0].id);
      localStorage.setItem(STORAGE_KEY, branches[0].id);
    } else {
      // Default to 'all' for multi-branch orgs
      setSelectedBranchId('all');
      localStorage.setItem(STORAGE_KEY, 'all');
    }
  }, [branches]);

  const selectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    localStorage.setItem(STORAGE_KEY, branchId);
  };

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
