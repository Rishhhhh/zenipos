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

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  sort_order: number;
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
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
      });
    }
  }, [category, form]);

  const onSubmit = async (values: CategoryFormValues) => {
    if (!category) return;

    try {
      const { error } = await supabase
        .from('menu_categories')
        .update({ name: values.name })
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
