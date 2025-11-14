import { useEffect } from 'react';
import { GlassModal } from '@/components/modals/GlassModal';
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
import { useBranch } from '@/contexts/BranchContext';

const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  pin: z.string().min(4, 'PIN must be at least 4 characters'),
  role: z.enum(['staff', 'manager', 'owner', 'kitchen']),
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
  const { currentBranch, isReady, isLoading: branchLoading } = useBranch();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      pin: '',
      role: 'staff',
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
        role: employee.user_roles?.[0]?.role || 'staff',
        active: employee.active,
        hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        pin: '',
        role: 'staff',
        active: true,
        hire_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [employee, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: EmployeeFormValues) => {
      if (branchLoading || !isReady) {
        throw new Error('Loading branch information...');
      }

      if (!currentBranch?.id) {
        throw new Error('No branch selected. Please select a branch first.');
      }
      
      // Validate duplicates within branch
      if (values.email) {
        const { data: existingEmail } = await supabase
          .from('employees')
          .select('id')
          .eq('branch_id', currentBranch.id)
          .eq('email', values.email)
          .neq('id', employee?.id || '')
          .maybeSingle();
        
        if (existingEmail) {
          throw new Error('An employee with this email already exists in this branch');
        }
      }
      
      if (values.phone) {
        const { data: existingPhone } = await supabase
          .from('employees')
          .select('id')
          .eq('branch_id', currentBranch.id)
          .eq('phone', values.phone)
          .neq('id', employee?.id || '')
          .maybeSingle();
        
        if (existingPhone) {
          throw new Error('An employee with this phone number already exists in this branch');
        }
      }
      
      // Hash PIN via new edge function
      const { data: pinData, error: pinError } = await supabase.functions.invoke('hash-employee-pin', {
        body: { pin: values.pin },
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
          branch_id: currentBranch.id,
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

        // Update role in user_roles
        await supabase
          .from('user_roles')
          .delete()
          .eq('employee_id', employee.id);

        if (employee.auth_user_id) {
          await supabase.from('user_roles').insert([{
            user_id: employee.auth_user_id,
            employee_id: employee.id,
            role: values.role,
          }]);
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
            branch_id: currentBranch.id,
            role: values.role,
          })
          .select()
          .single();

        if (error) throw error;

        // Create auth user if email provided
        let authUserId = null;
        if (values.email) {
          try {
            // Generate temporary password
            const tempPassword = `${values.pin}${Math.random().toString(36).slice(2, 10)}`;
            
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: values.email,
              password: tempPassword,
              email_confirm: true,
              user_metadata: {
                name: values.name,
                employee_id: newEmployee.id,
              }
            });

            if (!authError && authData.user) {
              authUserId = authData.user.id;
              
              // Link auth_user_id to employee
              await supabase
                .from('employees')
                .update({ auth_user_id: authUserId })
                .eq('id', newEmployee.id);
            }
          } catch (authError) {
            console.warn('Failed to create auth user, employee will be PIN-only:', authError);
          }
        }

        // Create user role
        if (authUserId) {
          await supabase.from('user_roles').insert({
            user_id: authUserId,
            employee_id: newEmployee.id,
            role: values.role,
          });
        }
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
    <GlassModal 
      open={open} 
      onOpenChange={onOpenChange}
      title={`${employee ? 'Edit Employee' : 'Add Employee'} - ${currentBranch?.name || 'Unknown Branch'}`}
      size="md"
      variant="default"
    >
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
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
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
    </GlassModal>
  );
}
