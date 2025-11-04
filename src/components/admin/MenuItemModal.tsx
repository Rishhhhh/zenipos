import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from './ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const menuItemSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  sku: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  station_id: z.string().optional(),
  prep_time_minutes: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  cost: z.coerce.number().min(0).optional(),
  tax_rate: z.coerce.number().min(0).max(100).optional(),
  description: z.string().max(500).optional(),
  image_url: z.string().optional(),
  in_stock: z.boolean(),
});

type MenuItemFormValues = z.infer<typeof menuItemSchema>;

interface MenuItem {
  id: string;
  name: string;
  sku: string | null;
  category_id: string | null;
  station_id: string | null;
  prep_time_minutes: number | null;
  price: number;
  cost: number | null;
  tax_rate: number | null;
  description: string | null;
  image_url: string | null;
  in_stock: boolean;
}

interface MenuItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem;
  categoryId?: string;
  categories: Array<{ id: string; name: string }>;
}

export function MenuItemModal({
  open,
  onOpenChange,
  item,
  categoryId,
  categories,
}: MenuItemModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [imageSrcsets, setImageSrcsets] = useState<{
    srcset_webp?: string;
    srcset_jpeg?: string;
  }>({});

  // Fetch stations
  const { data: stations = [] } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stations')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      sku: '',
      category_id: categoryId || '',
      station_id: '',
      prep_time_minutes: 10,
      price: 0,
      cost: 0,
      tax_rate: 0,
      description: '',
      image_url: '',
      in_stock: true,
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        sku: item.sku || '',
        category_id: item.category_id || '',
        station_id: item.station_id || '',
        prep_time_minutes: item.prep_time_minutes || 10,
        price: Number(item.price),
        cost: item.cost ? Number(item.cost) : 0,
        tax_rate: item.tax_rate ? Number(item.tax_rate) : 0,
        description: item.description || '',
        image_url: item.image_url || '',
        in_stock: item.in_stock,
      });
    } else {
      form.reset({
        name: '',
        sku: '',
        category_id: categoryId || '',
        station_id: '',
        prep_time_minutes: 10,
        price: 0,
        cost: 0,
        tax_rate: 0,
        description: '',
        image_url: '',
        in_stock: true,
      });
    }
  }, [item, categoryId, form]);

  const onSubmit = async (values: MenuItemFormValues) => {
    try {
      if (item) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: values.name,
            sku: values.sku || null,
            category_id: values.category_id,
            station_id: values.station_id || null,
            prep_time_minutes: values.prep_time_minutes || null,
            price: values.price,
            cost: values.cost || null,
            tax_rate: values.tax_rate || null,
            description: values.description || null,
            image_url: values.image_url || null,
            image_srcset_webp: imageSrcsets.srcset_webp || null,
            image_srcset_jpeg: imageSrcsets.srcset_jpeg || null,
            in_stock: values.in_stock,
          })
          .eq('id', item.id);

        if (error) throw error;

        toast({
          title: 'Item updated',
          description: 'Menu item has been updated successfully',
        });
      } else {
        // Create new item
        const { error } = await supabase.from('menu_items').insert({
          name: values.name,
          sku: values.sku || null,
          category_id: values.category_id,
          station_id: values.station_id || null,
          prep_time_minutes: values.prep_time_minutes || null,
          price: values.price,
          cost: values.cost || null,
          tax_rate: values.tax_rate || null,
          description: values.description || null,
          image_url: values.image_url || null,
          image_srcset_webp: imageSrcsets.srcset_webp || null,
          image_srcset_jpeg: imageSrcsets.srcset_jpeg || null,
          in_stock: values.in_stock,
        });

        if (error) throw error;

        toast({
          title: 'Item created',
          description: 'Menu item has been created successfully',
        });
      }

      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save menu item',
        variant: 'destructive',
      });
    }
  };

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title={item ? 'Edit Menu Item' : 'Add Menu Item'}
      size="xl"
      variant="default"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value}
                    onUpload={(result) => {
                      field.onChange(result.url);
                      setImageSrcsets({
                        srcset_webp: result.srcset_webp,
                        srcset_jpeg: result.srcset_jpeg,
                      });
                    }}
                    onDelete={() => {
                      field.onChange('');
                      setImageSrcsets({});
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nasi Lemak" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="NL-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="station_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Station (for KDS routing)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select station" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No Station</SelectItem>
                      {stations.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          {station.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Delicious Malaysian dish..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (RM) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="10.50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost (RM)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="5.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tax_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="6"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prep_time_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prep Time (min)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="in_stock"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Available Today</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Item is available for ordering
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
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
            <Button type="submit">
              {item ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Form>
    </GlassModal>
  );
}
