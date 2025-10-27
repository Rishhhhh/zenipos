import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ModifierManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [modifierDialogOpen, setModifierDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['modifier_groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modifier_groups')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: modifiers } = useQuery({
    queryKey: ['modifiers', selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) return [];
      const { data, error } = await supabase
        .from('modifiers')
        .select('*')
        .eq('group_id', selectedGroupId)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedGroupId,
  });

  const saveGroupMutation = useMutation({
    mutationFn: async (group: any) => {
      if (group.id) {
        const { error } = await supabase
          .from('modifier_groups')
          .update(group)
          .eq('id', group.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('modifier_groups')
          .insert(group);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifier_groups'] });
      toast({ title: 'Modifier group saved' });
      setGroupDialogOpen(false);
      setEditingGroup(null);
    },
  });

  const saveModifierMutation = useMutation({
    mutationFn: async (modifier: any) => {
      const { error } = await supabase
        .from('modifiers')
        .insert(modifier);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifiers'] });
      toast({ title: 'Modifier added' });
      setModifierDialogOpen(false);
    },
  });

  const handleGroupSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    saveGroupMutation.mutate({
      id: editingGroup?.id,
      name: formData.get('name'),
      min_selections: parseInt(formData.get('min_selections') as string) || 0,
      max_selections: parseInt(formData.get('max_selections') as string) || 1,
    });
  };

  const handleModifierSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    saveModifierMutation.mutate({
      group_id: selectedGroupId,
      name: formData.get('name'),
      price: parseFloat(formData.get('price') as string) || 0,
    });
  };

  return (
    <div className="kiosk-layout p-8 pb-32 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Modifier Management</h1>
            <p className="text-muted-foreground mt-2">Manage modifier groups and options</p>
          </div>
          <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingGroup(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingGroup ? 'Edit Group' : 'New Modifier Group'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleGroupSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Group Name*</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Size, Add-ons, Temperature"
                    defaultValue={editingGroup?.name}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_selections">Min Selections</Label>
                    <Input
                      id="min_selections"
                      name="min_selections"
                      type="number"
                      min="0"
                      defaultValue={editingGroup?.min_selections || 0}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_selections">Max Selections</Label>
                    <Input
                      id="max_selections"
                      name="max_selections"
                      type="number"
                      min="1"
                      defaultValue={editingGroup?.max_selections || 1}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setGroupDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveGroupMutation.isPending}>
                    {saveGroupMutation.isPending ? 'Saving...' : 'Save Group'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups List */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Modifier Groups</h2>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {groupsLoading ? (
                  <p>Loading...</p>
                ) : groups?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No groups yet</p>
                ) : (
                  groups?.map((group: any) => (
                    <Card
                      key={group.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedGroupId === group.id ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                      }`}
                      onClick={() => setSelectedGroupId(group.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{group.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Min: {group.min_selections} | Max: {group.max_selections}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGroup(group);
                            setGroupDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Modifiers List */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {selectedGroupId ? 'Modifiers' : 'Select a group'}
              </h2>
              {selectedGroupId && (
                <Dialog open={modifierDialogOpen} onOpenChange={setModifierDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Modifier
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Modifier</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleModifierSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="modifier_name">Name*</Label>
                        <Input
                          id="modifier_name"
                          name="name"
                          placeholder="e.g., Large, Extra Cheese"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="price">Additional Price (RM)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue="0"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setModifierDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saveModifierMutation.isPending}>
                          {saveModifierMutation.isPending ? 'Adding...' : 'Add Modifier'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            <ScrollArea className="h-[600px]">
              {!selectedGroupId ? (
                <div className="text-center text-muted-foreground py-12">
                  Select a modifier group to view its options
                </div>
              ) : modifiers?.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  No modifiers in this group. Add your first modifier.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modifiers?.map((modifier: any) => (
                    <Card key={modifier.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{modifier.name}</h3>
                          {modifier.price > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <DollarSign className="h-3 w-3" />
                              <span>+RM {modifier.price.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
