import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Store } from 'lucide-react';

interface BranchSelectorProps {
  value: string | null;
  onChange: (branchId: string) => void;
  showAll?: boolean;
}

export function BranchSelector({ value, onChange, showAll = true }: BranchSelectorProps) {
  const { data: branches, isLoading } = useQuery({
    queryKey: ['user-branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select(`
          *,
          organizations(name)
        `)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="h-10 w-64 animate-pulse bg-muted rounded" />;
  }

  return (
    <Select value={value || 'all'} onValueChange={onChange}>
      <SelectTrigger className="w-64">
        <Store className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Select Branch" />
      </SelectTrigger>
      <SelectContent>
        {showAll && (
          <SelectItem value="all">All Branches</SelectItem>
        )}
        {branches?.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name} {branch.code && `(${branch.code})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
