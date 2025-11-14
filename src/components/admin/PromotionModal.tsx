import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GlassModal } from '@/components/modals/GlassModal';
import { useBranch } from '@/contexts/BranchContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromotionPreview } from './PromotionPreview';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Promotion = Tables<'promotions'>;

const promotionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  type: z.enum(['BUY_X_GET_Y', 'PERCENT_OFF', 'TIME_RANGE_DISCOUNT', 'HAPPY_HOUR']),
  active: z.boolean().default(true),
  priority: z.number().min(0).max(100),
  stackable: z.boolean().default(false),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  // Dynamic rule fields
  discount_percent: z.number().min(0).max(100).optional(),
  min_amount: z.number().min(0).optional(),
  buy_quantity: z.number().min(1).optional(),
  get_quantity: z.number().min(1).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  days: z.string().optional(), // Comma-separated days
});

type PromotionFormValues = z.infer<typeof promotionSchema>;

interface PromotionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion?: Promotion | null;
}

export function PromotionModal({
  open,
  onOpenChange,
  promotion,
}: PromotionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedBranchId } = useBranch();
  const [activeTab, setActiveTab] = useState('form');

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'PERCENT_OFF',
      active: true,
      priority: 0,
      stackable: false,
    },
  });

  const watchType = form.watch('type');

  useEffect(() => {
    if (promotion) {
      const rules = promotion.rules as any;
      form.reset({
        name: promotion.name,
        description: promotion.description || '',
        type: promotion.type,
        active: promotion.active,
        priority: promotion.priority,
        stackable: promotion.stackable,
        start_date: promotion.start_date ? new Date(promotion.start_date).toISOString().split('T')[0] : '',
        end_date: promotion.end_date ? new Date(promotion.end_date).toISOString().split('T')[0] : '',
        discount_percent: rules.discount_percent,
        min_amount: rules.min_amount,
        buy_quantity: rules.buy_quantity,
        get_quantity: rules.get_quantity,
        start_time: rules.start_time,
        end_time: rules.end_time,
        days: rules.days ? rules.days.join(',') : '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        type: 'PERCENT_OFF',
        active: true,
        priority: 0,
        stackable: false,
      });
    }
  }, [promotion, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: PromotionFormValues) => {
      // Validate branch selection
      if (!selectedBranchId || selectedBranchId === 'all') {
        throw new Error('Please select a specific branch to create a promotion');
      }

      // Build rules object based on type
      let rules: any = {};
      
      switch (values.type) {
        case 'PERCENT_OFF':
          rules = {
            discount_percent: values.discount_percent || 0,
            min_amount: values.min_amount || 0,
          };
          break;
        case 'BUY_X_GET_Y':
          rules = {
            buy_quantity: values.buy_quantity || 2,
            get_quantity: values.get_quantity || 1,
            discount_type: 'cheapest_free',
          };
          break;
        case 'TIME_RANGE_DISCOUNT':
          rules = {
            discount_percent: values.discount_percent || 0,
            days: values.days ? values.days.split(',').map(Number) : undefined,
            start_time: values.start_time,
            end_time: values.end_time,
          };
          break;
        case 'HAPPY_HOUR':
          rules = {
            discount_percent: values.discount_percent || 0,
            start_time: values.start_time,
            end_time: values.end_time,
          };
          break;
      }

      const data = {
        name: values.name,
        description: values.description || null,
        type: values.type,
        active: values.active,
        priority: values.priority,
        stackable: values.stackable,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        rules,
        branch_id: selectedBranchId,
      };

      if (promotion) {
        const { error } = await supabase
          .from('promotions')
          .update(data)
          .eq('id', promotion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast({
        title: promotion ? 'Promotion updated' : 'Promotion created',
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save promotion',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: PromotionFormValues) => {
    saveMutation.mutate(values);
  };

  return (
    <GlassModal 
      open={open} 
      onOpenChange={onOpenChange}
      title={`${promotion ? 'Edit Promotion' : 'Create Promotion'}`}
      size="xl"
      variant="default"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Happy Hour Special" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="20% off all orders from 9-11 PM" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select promotion type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PERCENT_OFF">Percent Off</SelectItem>
                    <SelectItem value="BUY_X_GET_Y">Buy X Get Y</SelectItem>
                    <SelectItem value="TIME_RANGE_DISCOUNT">Time Range Discount</SelectItem>
                    <SelectItem value="HAPPY_HOUR">Happy Hour</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dynamic fields based on type */}
          {(watchType === 'PERCENT_OFF' || watchType === 'TIME_RANGE_DISCOUNT' || watchType === 'HAPPY_HOUR') && (
            <FormField
              control={form.control}
              name="discount_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Percentage</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder="20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchType === 'PERCENT_OFF' && (
            <FormField
              control={form.control}
              name="min_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Amount (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder="50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchType === 'BUY_X_GET_Y' && (
            <>
              <FormField
                control={form.control}
                name="buy_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buy Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="get_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Get Quantity Free</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {(watchType === 'TIME_RANGE_DISCOUNT' || watchType === 'HAPPY_HOUR') && (
            <>
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" placeholder="21:00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" placeholder="23:00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {watchType === 'TIME_RANGE_DISCOUNT' && (
            <FormField
              control={form.control}
              name="days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Days (0=Sun, 6=Sat, comma-separated)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0,6" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority (0-100, higher = first)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Active</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stackable"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Stackable with other promotions</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : promotion ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Form>
    </GlassModal>
  );
}
