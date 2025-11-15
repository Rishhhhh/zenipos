import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Check } from 'lucide-react';
import { CategoryAssignmentDialog } from './CategoryAssignmentDialog';

interface CategoryAssignmentPanelProps {
  selectedGroupId: string | null;
  selectedGroupName: string;
}

export function CategoryAssignmentPanel({
  selectedGroupId,
  selectedGroupName,
}: CategoryAssignmentPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch assigned categories with item counts
  const { data: assignedCategories = [], isLoading } = useQuery({
    queryKey: ['assigned-categories-detail', selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) return [];

      const { data, error } = await supabase
        .from('category_modifier_groups')
        .select(`
          category_id,
          sort_order,
          menu_categories!inner (
            id,
            name,
            menu_items(count)
          )
        `)
        .eq('modifier_group_id', selectedGroupId)
        .order('sort_order');

      if (error) throw error;

      return data.map(item => ({
        id: item.menu_categories.id,
        name: item.menu_categories.name,
        item_count: item.menu_categories.menu_items?.[0]?.count || 0,
        sort_order: item.sort_order,
      }));
    },
    enabled: !!selectedGroupId,
  });

  if (!selectedGroupId) {
    return (
      <Card className="p-8 flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Select a modifier group to view assigned categories</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Assigned Categories</h2>
          <p className="text-sm text-muted-foreground">
            Categories that will show this modifier group
          </p>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-12">
              Loading assigned categories...
            </div>
          ) : assignedCategories.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              No categories assigned yet
            </div>
          ) : (
            <div className="space-y-2">
              {assignedCategories.map((category) => (
                <Card
                  key={category.id}
                  className="p-4"
                >
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{category.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {category.item_count} {category.item_count === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <Button 
          className="w-full mt-4" 
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Assign Categories
        </Button>
      </Card>

      <CategoryAssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        modifierGroupId={selectedGroupId}
        modifierGroupName={selectedGroupName}
      />
    </>
  );
}
