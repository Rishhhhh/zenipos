import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useModalManager } from '@/hooks/useModalManager';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShiftHistoryPanel } from '@/components/admin/ShiftHistoryPanel';
import {
  Users,
  Plus,
  Edit,
  UserX,
  UserCheck,
  Search,
  Clock,
} from 'lucide-react';

export default function EmployeeManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openModal } = useModalManager();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          user_roles (
            role
          )
        `)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('employees')
        .update({ active: !active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Employee Updated',
        description: 'Employee status changed successfully',
      });
    },
  });

  const filteredEmployees = employees?.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
          <p className="text-muted-foreground">Manage staff, roles, and time tracking</p>
        </div>
        <Button onClick={() => openModal('employee', {})}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredEmployees?.map(employee => (
                <Card
                  key={employee.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedEmployeeId === employee.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedEmployeeId(employee.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        employee.active ? 'bg-success/20' : 'bg-muted'
                      }`}>
                        <Users className={`h-6 w-6 ${
                          employee.active ? 'text-success' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{employee.name}</h3>
                          {!employee.active && (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                        <div className="flex gap-2 mt-1">
                          {employee.user_roles?.map((ur: any, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              {ur.role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal('employee', { employee });
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActive.mutate({ id: employee.id, active: employee.active });
                        }}
                      >
                        {employee.active ? (
                          <UserX className="h-4 w-4 text-warning" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-success" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        <div>
          {selectedEmployeeId ? (
            <ShiftHistoryPanel employeeId={selectedEmployeeId} />
          ) : (
            <Card className="p-12 text-center">
              <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select an Employee</h3>
              <p className="text-muted-foreground text-sm">
                Select an employee to view their shift history
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
