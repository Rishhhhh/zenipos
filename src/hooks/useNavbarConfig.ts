import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OrganizationSettings {
  speed_mode?: boolean;
  navbar_modules?: string[];
  [key: string]: any;
}

// Default modules for normal mode (all available)
export const DEFAULT_NAVBAR_MODULES = [
  'pos',
  'tables',
  'kds',
  'inventory',
  'reports',
  'admin',
  'changelog',
  'docs',
  'expo',
];

// Speed mode fixed modules (only 4)
export const SPEED_MODE_MODULES = ['pos', 'tables', 'cashbook', 'admin'];

/**
 * Hook to manage navbar module configuration
 * In Speed Mode: Fixed to 4 modules (POS, Tables, Cashbook, Admin)
 * In Normal Mode: User can customize which modules appear
 */
export function useNavbarConfig() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  // Fetch organization settings including navbar_modules
  const { data: settings, isLoading } = useQuery({
    queryKey: ['organization-settings', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      
      const { data, error } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organization.id)
        .single();
      
      if (error) throw error;
      return (data?.settings || {}) as OrganizationSettings;
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Update navbar modules mutation
  const updateModulesMutation = useMutation({
    mutationFn: async (modules: string[]) => {
      if (!organization?.id) throw new Error('No organization ID');

      const { data: current, error: fetchError } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organization.id)
        .single();

      if (fetchError) throw fetchError;

      const updatedSettings = {
        ...(current?.settings as object || {}),
        navbar_modules: modules,
      };

      const { error } = await supabase
        .from('organizations')
        .update({ settings: updatedSettings })
        .eq('id', organization.id);

      if (error) throw error;
      return modules;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] });
      toast.success('Navbar configuration saved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update navbar configuration');
    },
  });

  const speedMode = settings?.speed_mode ?? false;
  
  // In speed mode, use fixed modules; otherwise use saved or default
  const navbarModules = speedMode 
    ? SPEED_MODE_MODULES 
    : (settings?.navbar_modules || DEFAULT_NAVBAR_MODULES);

  return {
    navbarModules,
    speedMode,
    isLoading,
    updateNavbarModules: (modules: string[]) => updateModulesMutation.mutate(modules),
    isUpdating: updateModulesMutation.isPending,
    // For normal mode customization
    savedModules: settings?.navbar_modules || DEFAULT_NAVBAR_MODULES,
  };
}
