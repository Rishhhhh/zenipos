import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GlassModal } from '@/components/modals/GlassModal';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Utensils, Coffee, Wine, Pizza, Salad, Soup, 
  Cake, IceCream, Beer, Sandwich 
} from 'lucide-react';

const ICON_OPTIONS = [
  { value: 'Utensils', label: 'Utensils', Icon: Utensils },
  { value: 'Coffee', label: 'Coffee', Icon: Coffee },
  { value: 'Wine', label: 'Wine', Icon: Wine },
  { value: 'Pizza', label: 'Pizza', Icon: Pizza },
  { value: 'Salad', label: 'Salad', Icon: Salad },
  { value: 'Soup', label: 'Soup', Icon: Soup },
  { value: 'Cake', label: 'Cake', Icon: Cake },
  { value: 'IceCream', label: 'Ice Cream', Icon: IceCream },
  { value: 'Beer', label: 'Beer', Icon: Beer },
  { value: 'Sandwich', label: 'Sandwich', Icon: Sandwich },
];

const COLOR_PRESETS = [
  '#8B5CF6', '#10B981', '#F97316', '#A855F7', 
  '#3B82F6', '#EAB308', '#EC4899', '#14B8A6'
];

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  icon: z.string().min(1, 'Please select an icon'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  sort_order: number;
  color?: string;
  icon?: string;
}

interface CategoryEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}

export function CategoryEditModal({
  open,
  onOpenChange,
  category,
}: CategoryEditModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color: '#8B5CF6',
      icon: 'Utensils',
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        color: category.color || '#8B5CF6',
        icon: category.icon || 'Utensils',
      });
    }
  }, [category, form]);

  const onSubmit = async (values: CategoryFormValues) => {
    if (!category) return;

    try {
      const { error } = await supabase
        .from('menu_categories')
        .update({ 
          name: values.name,
          color: values.color,
          icon: values.icon,
        })
        .eq('id', category.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Category updated',
        description: 'Category name has been updated successfully',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update category',
        variant: 'destructive',
      });
    }
  };

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Category"
      size="sm"
      variant="default"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Name</FormLabel>
                <FormControl>
                  <Input placeholder="Beverages" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="color" 
                      {...field} 
                      className="w-20 h-10"
                    />
                    <div className="flex gap-1">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Icon</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-5 gap-2">
                    {ICON_OPTIONS.map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        className={`p-3 rounded border-2 flex flex-col items-center gap-1 transition-all ${
                          field.value === value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{label}</span>
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Form>
    </GlassModal>
  );
}
