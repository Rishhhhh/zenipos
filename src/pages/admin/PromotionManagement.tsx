import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useModalManager } from '@/hooks/useModalManager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { PromotionModal } from '@/components/admin/PromotionModal';
import { Tables } from '@/integrations/supabase/types';

type Promotion = Tables<'promotions'>;

export default function PromotionManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openModal } = useModalManager();

  // Fetch all promotions
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('priority', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Toggle active status
  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('promotions')
        .update({ active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast({ title: 'Promotion status updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update promotion', variant: 'destructive' });
    },
  });

  // Delete promotion
  const deletePromo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast({ title: 'Promotion deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete promotion', variant: 'destructive' });
    },
  });

  const handleEdit = (promo: Promotion) => {
    openModal('promotion', { promotion: promo });
  };

  const handleCreate = () => {
    openModal('promotion', {});
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Promotion Management</h1>
            <p className="text-muted-foreground">Create and manage promotional offers</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Promotion
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading promotions...</div>
        ) : !promotions || promotions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No promotions yet</p>
            <Button onClick={handleCreate}>Create your first promotion</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {promotions.map((promo) => (
              <Card key={promo.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{promo.name}</h3>
                      <Badge variant={promo.active ? 'default' : 'secondary'}>
                        {promo.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{promo.type}</Badge>
                      <Badge variant="outline">Priority: {promo.priority}</Badge>
                      {promo.stackable && (
                        <Badge variant="outline">Stackable</Badge>
                      )}
                    </div>
                    {promo.description && (
                      <p className="text-muted-foreground mb-3">{promo.description}</p>
                    )}
                    <div className="text-sm text-muted-foreground space-y-1">
                      {promo.start_date && (
                        <p>Start: {new Date(promo.start_date).toLocaleDateString()}</p>
                      )}
                      {promo.end_date && (
                        <p>End: {new Date(promo.end_date).toLocaleDateString()}</p>
                      )}
                      <p>Rules: {JSON.stringify(promo.rules)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={promo.active}
                      onCheckedChange={(checked) =>
                        toggleActive.mutate({ id: promo.id, active: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(promo)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this promotion?')) {
                          deletePromo.mutate(promo.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
