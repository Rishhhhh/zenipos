import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Loader2 } from 'lucide-react';
import type { RegistrationData } from '@/hooks/useRegistrationWizard';

interface Step4Props {
  data: Partial<RegistrationData>;
  onUpdate: (updates: Partial<RegistrationData>) => void;
  onNext: () => Promise<void>;
  onPrev: () => void;
  isSubmitting: boolean;
}

export function Step4EmployeeOnboarding({ data, onUpdate, onNext, onPrev, isSubmitting }: Step4Props) {
  const employees = data.employees || [];
  const branches = data.branches || [];

  const addEmployee = () => {
    onUpdate({
      employees: [...employees, { 
        name: '', 
        email: '', 
        phone: '', 
        role: 'staff' as const,
        branchId: branches[0]?.code || 'MAIN'
      }]
    });
  };

  const removeEmployee = (index: number) => {
    onUpdate({
      employees: employees.filter((_, i) => i !== index)
    });
  };

  const updateEmployee = (index: number, field: string, value: string) => {
    const updated = [...employees];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ employees: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
        <p className="text-sm text-foreground">
          <strong>Note:</strong> The owner account will be created automatically with a secure PIN sent to your email. You can add additional managers and staff here (optional).
        </p>
      </div>

      {employees.length > 0 && (
        <div className="space-y-4">
          {employees.map((employee, index) => (
            <div key={index} className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Employee {index + 1}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEmployee(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <Label>Name *</Label>
                <Input
                  value={employee.name}
                  onChange={(e) => updateEmployee(index, 'name', e.target.value)}
                  placeholder="Employee name"
                  className="bg-background/50"
                  required
                />
              </div>

              <div>
                <Label>Role *</Label>
                <Select
                  value={employee.role}
                  onValueChange={(value) => updateEmployee(index, 'role', value)}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Branch *</Label>
                <Select
                  value={employee.branchId}
                  onValueChange={(value) => updateEmployee(index, 'branchId', value)}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.code} value={branch.code}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Email (Optional)</Label>
                <Input
                  type="email"
                  value={employee.email || ''}
                  onChange={(e) => updateEmployee(index, 'email', e.target.value)}
                  placeholder="employee@example.com"
                  className="bg-background/50"
                />
              </div>

              <div>
                <Label>Phone (Optional)</Label>
                <Input
                  type="tel"
                  value={employee.phone || ''}
                  onChange={(e) => updateEmployee(index, 'phone', e.target.value)}
                  placeholder="+60 12-345 6789"
                  className="bg-background/50"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={addEmployee}
        className="w-full"
        disabled={isSubmitting}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Employee
      </Button>

      <div className="flex items-center gap-4 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onPrev} 
          className="flex-1"
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Organization...
            </>
          ) : (
            'Complete Registration'
          )}
        </Button>
      </div>
    </form>
  );
}