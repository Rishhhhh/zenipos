import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  pin: z.string().min(4, 'PIN must be at least 4 characters'),
  role: z.enum(['cashier', 'manager', 'admin', 'kitchen']),
  active: z.boolean(),
  hire_date: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: any;
}

export function EmployeeModal({ open, onOpenChange, employee }: EmployeeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      pin: '',
      role: 'cashier',
      active: true,
      hire_date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        name: employee.name,
        email: employee.email || '',
        phone: employee.phone || '',
        pin: '', // Don't populate PIN for security
        role: employee.user_roles?.[0]?.role || 'cashier',
        active: employee.active,
        hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        pin: '',
        role: 'cashier',
        active: true,
        hire_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [employee, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: EmployeeFormValues) => {
      // Hash PIN via edge function
      const { data: pinData, error: pinError } = await supabase.functions.invoke('validate-manager-pin', {
        body: { pin: values.pin, action: 'hash' },
      });

      if (pinError) throw pinError;
      const hashedPin = pinData.hash;

      if (employee) {
        // Update existing employee
        const updates: any = {
          name: values.name,
          email: values.email || null,
          phone: values.phone || null,
          active: values.active,
          hire_date: values.hire_date || null,
        };

        // Only update PIN if provided
        if (values.pin) {
          updates.pin = hashedPin;
        }

        const { error } = await supabase
          .from('employees')
          .update(updates)
          .eq('id', employee.id);

        if (error) throw error;

        // Update role
        await supabase
          .from('user_roles')
          .delete()
          .eq('employee_id', employee.id);

        if (employee.user_id) {
          await supabase.from('user_roles').insert({
            user_id: employee.user_id,
            employee_id: employee.id,
            role: values.role,
          });
        }
      } else {
        // Create new employee
        const { data: newEmployee, error } = await supabase
          .from('employees')
          .insert({
            name: values.name,
            email: values.email || null,
            phone: values.phone || null,
            pin: hashedPin,
            active: values.active,
            hire_date: values.hire_date || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Create user role (if needed later)
        // For now, employees can clock in with just PIN
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: employee ? 'Employee Updated' : 'Employee Created',
        description: 'Employee saved successfully',
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Employee name" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="email@example.com" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+60123456789" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN {employee && '(leave blank to keep current)'}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="6-digit PIN" maxLength={6} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hire_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hire Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
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
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {employee ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
