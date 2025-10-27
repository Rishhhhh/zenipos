import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DemoModeConfig {
  enabled: boolean;
  seed: number | null;
  generated_at?: string;
  cleared_at?: string;
}

export function useDemoMode() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['system-config', 'demo_mode'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'demo_mode')
        .single();

      if (error) throw error;
      return (data?.value || { enabled: false, seed: null }) as unknown as DemoModeConfig;
    },
  });

  const toggleDemoMode = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('system_config')
        .update({
          value: { enabled, seed: enabled ? 42 : null },
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'demo_mode');

      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      toast({
        title: enabled ? 'Demo Mode Enabled' : 'Demo Mode Disabled',
        description: enabled 
          ? 'Demo data simulation is now active' 
          : 'System switched to production mode',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to toggle demo mode',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    demoMode: config?.enabled || false,
    isLoading,
    toggleDemoMode: toggleDemoMode.mutate,
    isToggling: toggleDemoMode.isPending,
  };
}
