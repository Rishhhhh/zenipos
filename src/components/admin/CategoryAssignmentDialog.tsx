import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Search, CheckSquare, Square } from 'lucide-react';

interface CategoryAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modifierGroupId: string;
  modifierGroupName: string;
}

export function CategoryAssignmentDialog({
  open,
  onOpenChange,
  modifierGroupId,
  modifierGroupName,
}: CategoryAssignmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  // Fetch all categories with item counts
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-with-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select(`
          id,
          name,
          sort_order,
          menu_items(count)
        `)
        .order('sort_order');

      if (error) throw error;
      return data.map(cat => ({
        id: cat.id,
        name: cat.name,
        sort_order: cat.sort_order,
        item_count: cat.menu_items?.[0]?.count || 0,
      }));
    },
    enabled: open,
  });

  // Fetch currently assigned categories
  const { data: assignedCategories = [] } = useQuery({
    queryKey: ['assigned-categories', modifierGroupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_modifier_groups')
        .select('category_id')
        .eq('modifier_group_id', modifierGroupId);

      if (error) throw error;
      return data.map(d => d.category_id);
    },
    enabled: open && !!modifierGroupId,
  });

  // Sync selected categories when data loads
  useMemo(() => {
    if (assignedCategories.length > 0) {
      setSelectedCategories(new Set(assignedCategories));
    }
  }, [assignedCategories]);

  // Save assignments mutation
  const saveAssignments = useMutation({
    mutationFn: async (categoryIds: string[]) => {
      // Delete existing assignments
      const { error: deleteError } = await supabase
        .from('category_modifier_groups')
        .delete()
        .eq('modifier_group_id', modifierGroupId);

      if (deleteError) throw deleteError;

      // Insert new assignments
      if (categoryIds.length > 0) {
        const assignments = categoryIds.map((categoryId, index) => ({
          category_id: categoryId,
          modifier_group_id: modifierGroupId,
          sort_order: index,
        }));

        const { error: insertError } = await supabase
          .from('category_modifier_groups')
          .insert(assignments);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assigned-categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-modifiers'] });
      toast({ title: 'Category assignments saved successfully' });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error saving assignments:', error);
      toast({
        title: 'Failed to save assignments',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(cat => cat.name.toLowerCase().includes(query));
  }, [categories, searchQuery]);

  // Calculate total impact
  const totalImpact = useMemo(() => {
    const selectedCats = categories.filter(cat => selectedCategories.has(cat.id));
    const totalItems = selectedCats.reduce((sum, cat) => sum + cat.item_count, 0);
    return {
      categoryCount: selectedCategories.size,
      itemCount: totalItems,
    };
  }, [selectedCategories, categories]);

  const handleToggleCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  const handleSelectAll = () => {
    const allVisible = new Set(filteredCategories.map(cat => cat.id));
    setSelectedCategories(allVisible);
  };

  const handleClearAll = () => {
    setSelectedCategories(new Set());
  };

  const handleSave = () => {
    saveAssignments.mutate(Array.from(selectedCategories));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Categories to "{modifierGroupName}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select All / Clear All */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={filteredCategories.length === 0}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={selectedCategories.size === 0}
            >
              <Square className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          {/* Category list */}
          <ScrollArea className="h-[400px] border rounded-md p-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading categories...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {searchQuery ? 'No categories match your search' : 'No categories available'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => handleToggleCategory(category.id)}
                  >
                    <Checkbox
                      checked={selectedCategories.has(category.id)}
                      onCheckedChange={() => handleToggleCategory(category.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {category.item_count} {category.item_count === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Impact summary */}
          <div className="bg-muted p-3 rounded-md">
            <div className="text-sm font-medium">
              {totalImpact.categoryCount} {totalImpact.categoryCount === 1 ? 'category' : 'categories'},{' '}
              {totalImpact.itemCount} {totalImpact.itemCount === 1 ? 'item' : 'items'} affected
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveAssignments.isPending}>
            {saveAssignments.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
