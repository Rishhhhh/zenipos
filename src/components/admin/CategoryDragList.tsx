import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface CategoryDragListProps {
  categories: Category[];
  selectedCategoryId?: string;
  onSelectCategory: (categoryId: string) => void;
  onAddCategory: () => void;
}

function SortableCategory({
  category,
  isSelected,
  onClick,
}: {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 flex items-center gap-2 cursor-pointer transition-colors ${
        isSelected ? 'bg-accent border-primary' : ''
      }`}
      onClick={onClick}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="flex-1 font-medium">{category.name}</span>
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

      // Update sort_order in database
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
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                isSelected={selectedCategoryId === category.id}
                onClick={() => onSelectCategory(category.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
