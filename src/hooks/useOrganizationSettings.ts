import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { uploadOrganizationLogo } from '@/lib/storage/organizationLogoUpload';

interface UpdateSettingsRequest {
  name?: string;
  phone?: string;
  address?: string;
  businessType?: string;
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  currentPassword?: string;
  newPassword?: string;
  duitnowQrUrl?: string | null;
  tngQrUrl?: string | null;
}

export function useOrganizationSettings() {
  const { organization, setOrganization } = useAuth();
  const queryClient = useQueryClient();

  // Fetch organization settings
  const { data: settings, isLoading, error, refetch } = useQuery({
    queryKey: ['organization-settings', organization?.id],
    queryFn: async () => {
      if (!organization?.id) throw new Error('No organization ID');
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  // Fetch active sessions
  const { data: sessions } = useQuery({
    queryKey: ['organization-sessions', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('organization_sessions' as any)
        .select('*')
        .eq('organization_id', organization.id)
        .order('last_activity', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!organization?.id,
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData: UpdateSettingsRequest) => {
      const { data, error } = await supabase.functions.invoke(
        'organization-settings-update',
        {
          body: {
            organizationId: organization?.id,
            settings: updateData,
          },
        }
      );
      
      if (error) throw error;
      return data.organization;
    },
    onSuccess: (updatedOrg) => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] });
      toast.success('Settings updated successfully');
      
      // Update AuthContext with new branding
      if (setOrganization) {
        setOrganization({
          id: updatedOrg.id,
          name: updatedOrg.name,
          slug: updatedOrg.slug,
          logoUrl: updatedOrg.logo_url,
          primaryColor: updatedOrg.primary_color,
          accentColor: updatedOrg.accent_color,
          branding: {
            name: updatedOrg.name,
            logoUrl: updatedOrg.logo_url,
            primaryColor: updatedOrg.primary_color,
            accentColor: updatedOrg.accent_color,
          },
        });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!organization?.id) throw new Error('No organization ID');
      const result = await uploadOrganizationLogo(file, organization.id);
      return result.url;
    },
    onSuccess: (url) => {
      updateMutation.mutate({ logoUrl: url });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload logo');
    },
  });

  // Revoke session mutation
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('organization_sessions' as any)
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-sessions'] });
      toast.success('Session revoked successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to revoke session');
    },
  });

  return {
    settings,
    sessions,
    isLoading,
    error,
    refetch,
    updateSettings: updateMutation.mutate,
    uploadLogo: uploadLogoMutation.mutate,
    revokeSession: revokeSessionMutation.mutate,
    isUpdating: updateMutation.isPending || uploadLogoMutation.isPending,
  };
}
