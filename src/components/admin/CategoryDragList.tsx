import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, Plus, Pencil, Trash2,
  Utensils, Coffee, Wine, Pizza, Salad, Soup, 
  Cake, IceCream, Beer, Sandwich 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CategoryEditModal } from './CategoryEditModal';

const ICON_MAP: Record<string, any> = {
  Utensils, Coffee, Wine, Pizza, Salad, Soup, Cake, IceCream, Beer, Sandwich
};

const getIconComponent = (iconName?: string) => {
  const Icon = ICON_MAP[iconName || 'Utensils'] || Utensils;
  return <Icon className="h-4 w-4" />;
};

interface Category {
  id: string;
  name: string;
  sort_order: number;
  color?: string;
  icon?: string;
}

interface CategoryDragListProps {
  categories: Category[];
  selectedCategoryId?: string;
  onSelectCategory: (categoryId: string) => void;
  onAddCategory: () => void;
}

interface SortableCategoryProps {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  itemCount: number;
}

function SortableCategory({
  category,
  isSelected,
  onClick,
  onEdit,
  onDelete,
  itemCount,
}: SortableCategoryProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 flex items-center gap-2 transition-colors ${
        isSelected ? 'bg-accent border-primary' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 cursor-pointer" onClick={onClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: category.color || '#8B5CF6' }}
            />
            {getIconComponent(category.icon)}
            <span className="font-medium">{category.name}</span>
          </div>
          <Badge variant="secondary" className="ml-2">
            {itemCount}
          </Badge>
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}

export function CategoryDragList({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
}: CategoryDragListProps) {
  const [items, setItems] = useState(categories);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Sync local items state with categories prop
  useEffect(() => {
    setItems(categories);
  }, [categories]);

  // Fetch item counts per category
  const { data: itemCounts = {} } = useQuery({
    queryKey: ['categoryItemCounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('category_id')
        .eq('archived', false);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((item) => {
        if (item.category_id) {
          counts[item.category_id] = (counts[item.category_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      try {
        const updates = newItems.map((item, index) => ({
          id: item.id,
          sort_order: (index + 1) * 10,
        }));

        for (const update of updates) {
          await supabase
            .from('menu_categories')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id);
        }

        queryClient.invalidateQueries({ queryKey: ['categories'] });
        toast({
          title: 'Categories reordered',
          description: 'Category order updated successfully',
        });
      } catch (error) {
        console.error('Failed to update category order:', error);
        toast({
          title: 'Update failed',
          description: 'Failed to update category order',
          variant: 'destructive',
        });
        setItems(categories);
      }
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    const itemCount = itemCounts[deletingCategory.id] || 0;
    
    if (itemCount > 0) {
      toast({
        title: 'Cannot delete category',
        description: `This category has ${itemCount} item(s). Please reassign or delete them first.`,
        variant: 'destructive',
      });
      setDeletingCategory(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', deletingCategory.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categoryItemCounts'] });
      toast({
        title: 'Category deleted',
        description: 'Category has been deleted successfully',
      });
      setDeletingCategory(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Categories</h3>
        <Button size="sm" onClick={onAddCategory}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => setActiveId(event.active.id as string)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                isSelected={selectedCategoryId === category.id}
                onClick={() => onSelectCategory(category.id)}
                onEdit={() => setEditingCategory(category)}
                onDelete={() => setDeletingCategory(category)}
                itemCount={itemCounts[category.id] || 0}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <CategoryEditModal
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        category={editingCategory}
      />

      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? 
              {itemCounts[deletingCategory?.id || ''] > 0 && (
                <span className="text-destructive font-semibold">
                  {' '}This category has {itemCounts[deletingCategory?.id || '']} item(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
