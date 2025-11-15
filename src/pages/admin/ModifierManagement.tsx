import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { CategoryAssignmentPanel } from "@/components/admin/CategoryAssignmentPanel";
import { CategoryEditModal } from "@/components/admin/CategoryEditModal";
import { MenuItemModal } from "@/components/admin/MenuItemModal";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ModifierManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("modifiers");
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [modifierDialogOpen, setModifierDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [editingModifier, setEditingModifier] = useState<any>(null);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [menuItemDialogOpen, setMenuItemDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null);
  
  const [deleteGroupDialog, setDeleteGroupDialog] = useState<string | null>(null);
  const [deleteModifierDialog, setDeleteModifierDialog] = useState<string | null>(null);
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState<string | null>(null);
  const [deleteMenuItemDialog, setDeleteMenuItemDialog] = useState<string | null>(null);
  
  const [newGroup, setNewGroup] = useState({ name: "", min_selections: 0, max_selections: 1 });
  const [newModifier, setNewModifier] = useState({ name: "", price: 0 });

  const { data: branchId } = useQuery({
    queryKey: ['userBranch'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('employees').select('branch_id').eq('auth_user_id', user.id).single();
      return data?.branch_id || null;
    },
  });

  const { data: modifierGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ["modifier_groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modifier_groups").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: modifiers, isLoading: modifiersLoading } = useQuery({
    queryKey: ["modifiers", selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) return [];
      const { data, error } = await supabase.from("modifiers").select("*").eq("group_id", selectedGroupId).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedGroupId,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['menu_categories', branchId],
    queryFn: async () => {
      if (!branchId) return [];
      const { data, error } = await supabase.from('menu_categories').select('*, menu_items(count)').eq('branch_id', branchId).order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!branchId,
  });

  const { data: menuItems, isLoading: menuItemsLoading } = useQuery({
    queryKey: ['menu_items', selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return [];
      const { data, error } = await supabase.from('menu_items').select('*').eq('category_id', selectedCategoryId).order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCategoryId,
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
      if (modifier.id) {
        const { error } = await supabase
          .from('modifiers')
          .update(modifier)
          .eq('id', modifier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('modifiers')
          .insert({ ...modifier, group_id: selectedGroupId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifiers', selectedGroupId] });
      toast({ title: 'Modifier saved' });
      setModifierDialogOpen(false);
      setEditingModifier(null);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('modifier_groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifier_groups'] });
      toast({ title: 'Modifier group deleted' });
      setDeleteGroupDialog(null);
    },
  });

  const deleteModifierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('modifiers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifiers', selectedGroupId] });
      toast({ title: 'Modifier deleted' });
      setDeleteModifierDialog(null);
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
      id: editingModifier?.id,
      group_id: selectedGroupId,
      name: formData.get('name'),
      price: parseFloat(formData.get('price') as string) || 0,
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Modifier Management</h1>
        <p className="text-muted-foreground">Manage modifier groups, categories, and menu items</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="modifiers">Modifiers & Assignments</TabsTrigger>
          <TabsTrigger value="categories">Categories & Menu Items</TabsTrigger>
        </TabsList>

        <TabsContent value="modifiers" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Groups List */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>Modifier Groups</CardTitle>
                <CardDescription>Manage your modifier groups here.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {groupsLoading ? (
                      <p>Loading...</p>
                    ) : modifierGroups?.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No groups yet</p>
                    ) : (
                      modifierGroups?.map((group: any) => (
                        <Card
                          key={group.id}
                          className={`p-4 cursor-pointer transition-colors ${selectedGroupId === group.id ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
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
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingGroup(group);
                                  setGroupDialogOpen(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteGroupDialog(group.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
                <Button className="w-full mt-4" onClick={() => { setEditingGroup(null); setGroupDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Group
                </Button>
              </CardContent>
            </Card>

            {/* Middle Column: Assigned Categories */}
            <CategoryAssignmentPanel
              selectedGroupId={selectedGroupId}
              selectedGroupName={modifierGroups?.find(g => g.id === selectedGroupId)?.name || ''}
            />

            {/* Right Column: Modifiers List */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>Modifiers</CardTitle>
                <CardDescription>Manage modifiers for the selected group.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  {selectedGroupId ? (
                    <Button onClick={() => { setEditingModifier(null); setModifierDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Modifier
                    </Button>
                  ) : (
                    <p className="text-muted-foreground">Select a group to add modifiers.</p>
                  )}
                </div>
                <ScrollArea className="h-[400px]">
                  {!selectedGroupId ? (
                    <div className="text-center text-muted-foreground py-12">
                      Select a modifier group to view its options
                    </div>
                  ) : modifiersLoading ? (
                    <div className="text-center text-muted-foreground py-12">
                      Loading modifiers...
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
                                  <span>+RM {modifier.price.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingModifier(modifier);
                                  setModifierDialogOpen(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteModifierDialog(modifier.id);
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
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categories List */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>Menu Categories</CardTitle>
                <CardDescription>Manage your menu categories here.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {categoriesLoading ? (
                      <p>Loading categories...</p>
                    ) : categories?.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No categories yet</p>
                    ) : (
                      categories?.map((category: any) => (
                        <Card
                          key={category.id}
                          className={`p-4 cursor-pointer transition-colors ${selectedCategoryId === category.id ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                            }`}
                          onClick={() => setSelectedCategoryId(category.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{category.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {category.menu_items?.count} items
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCategory(category);
                                  setCategoryDialogOpen(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteCategoryDialog(category.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
                <Button className="w-full mt-4" onClick={() => { setEditingCategory(null); setCategoryDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </CardContent>
            </Card>

            {/* Menu Items List */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle>Menu Items</CardTitle>
                <CardDescription>Manage menu items for the selected category.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  {selectedCategoryId ? (
                    <Button onClick={() => { setEditingMenuItem(null); setMenuItemDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Menu Item
                    </Button>
                  ) : (
                    <p className="text-muted-foreground">Select a category to add menu items.</p>
                  )}
                </div>
                <ScrollArea className="h-[400px]">
                  {!selectedCategoryId ? (
                    <div className="text-center text-muted-foreground py-12">
                      Select a category to view its menu items
                    </div>
                  ) : menuItemsLoading ? (
                    <div className="text-center text-muted-foreground py-12">
                      Loading menu items...
                    </div>
                  ) : menuItems?.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      No menu items in this category. Add your first item.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {menuItems?.map((item: any) => (
                        <Card key={item.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{item.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                Price: RM {item.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMenuItem(item);
                                  setMenuItemDialogOpen(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteMenuItemDialog(item.id);
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
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Group' : 'New Modifier Group'}</DialogTitle>
            <DialogDescription>
              {editingGroup ? 'Edit the details of the modifier group.' : 'Create a new modifier group.'}
            </DialogDescription>
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
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setGroupDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveGroupMutation.isPending}>
                {saveGroupMutation.isPending ? 'Saving...' : 'Save Group'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={modifierDialogOpen} onOpenChange={setModifierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModifier ? 'Edit Modifier' : 'New Modifier'}</DialogTitle>
            <DialogDescription>
              {editingModifier ? 'Edit the details of the modifier.' : 'Create a new modifier.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleModifierSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name*</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Large, Extra Cheese"
                defaultValue={editingModifier?.name}
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
                defaultValue={editingModifier?.price || 0}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setModifierDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveModifierMutation.isPending}>
                {saveModifierMutation.isPending ? 'Saving...' : 'Save Modifier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CategoryEditModal
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
        branchId={branchId || ''}
      />

      <MenuItemModal
        open={menuItemDialogOpen}
        onOpenChange={setMenuItemDialogOpen}
        item={editingMenuItem}
        categoryId={selectedCategoryId || ''}
        categories={categories || []}
        branchId={branchId || ''}
      />

      <AlertDialog open={deleteGroupDialog !== null} onOpenChange={(open) => !open && setDeleteGroupDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the group and remove all its modifiers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteGroupDialog(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleteGroupMutation.isPending} onClick={() => {
              deleteGroupMutation.mutate(deleteGroupDialog as string);
            }}>
              {deleteGroupMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteModifierDialog !== null} onOpenChange={(open) => !open && setDeleteModifierDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the modifier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteModifierDialog(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleteModifierMutation.isPending} onClick={() => {
              deleteModifierMutation.mutate(deleteModifierDialog as string);
            }}>
              {deleteModifierMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteCategoryDialog !== null} onOpenChange={(open) => !open && setDeleteCategoryDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category and remove all its menu items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteCategoryDialog(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteMenuItemDialog !== null} onOpenChange={(open) => !open && setDeleteMenuItemDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the menu item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteMenuItemDialog(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
