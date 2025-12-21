import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OrganizationSettings {
  speed_mode?: boolean;
  [key: string]: any;
}

/**
 * Hook to manage Speed Mode setting for the organization
 * Speed Mode skips order confirmation and KDS steps for faster checkout
 */
export function useSpeedMode() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  // Fetch organization settings including speed_mode
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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Toggle speed mode mutation
  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!organization?.id) throw new Error('No organization ID');

      // Get current settings first
      const { data: current, error: fetchError } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organization.id)
        .single();

      if (fetchError) throw fetchError;

      // Merge with new speed_mode value
      const updatedSettings = {
        ...(current?.settings as object || {}),
        speed_mode: enabled,
      };

      const { error } = await supabase
        .from('organizations')
        .update({ settings: updatedSettings })
        .eq('id', organization.id);

      if (error) throw error;
      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] });
      toast.success(enabled ? 'Speed Mode enabled' : 'Speed Mode disabled');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update Speed Mode');
    },
  });

  return {
    speedMode: settings?.speed_mode ?? false,
    isLoading,
    toggleSpeedMode: (enabled: boolean) => toggleMutation.mutate(enabled),
    isToggling: toggleMutation.isPending,
  };
}
