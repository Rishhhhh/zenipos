import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useDemoDataGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generate = useMutation({
    mutationFn: async (seed: number = 42) => {
      toast({
        title: 'Generating Demo Data',
        description: 'This may take 30-60 seconds...',
      });

      const { data, error } = await supabase.functions.invoke('generate-demo-data', {
        body: { seed },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      toast({
        title: 'Demo Data Generated Successfully! 🎉',
        description: `Created ${data.stats.orders} orders, ${data.stats.menu_items} menu items, ${data.stats.customers} customers`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate demo data',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const clear = useMutation({
    mutationFn: async () => {
      toast({
        title: 'Clearing Demo Data',
        description: 'Removing all demo records...',
      });

      const { data, error } = await supabase.functions.invoke('clear-demo-data');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: 'Demo Data Cleared',
        description: 'All demo records have been removed',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to clear demo data',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    generate: generate.mutate,
    clear: clear.mutate,
    isGenerating: generate.isPending,
    isClearing: clear.isPending,
  };
}
