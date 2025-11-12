import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import type { RegistrationData } from '@/hooks/useRegistrationWizard';

interface Step3Props {
  data: Partial<RegistrationData>;
  onUpdate: (updates: Partial<RegistrationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step3BranchSetup({ data, onUpdate, onNext, onPrev }: Step3Props) {
  const branches = data.branches || [{ name: 'Main Branch', code: 'MAIN' }];

  const addBranch = () => {
    onUpdate({
      branches: [...branches, { name: '', code: '', address: '' }]
    });
  };

  const removeBranch = (index: number) => {
    if (branches.length > 1) {
      onUpdate({
        branches: branches.filter((_, i) => i !== index)
      });
    }
  };

  const updateBranch = (index: number, field: string, value: string) => {
    const updated = [...branches];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ branches: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {branches.map((branch, index) => (
          <div key={index} className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                {index === 0 ? 'Main Branch' : `Branch ${index + 1}`}
              </h3>
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBranch(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div>
              <Label>Branch Name *</Label>
              <Input
                value={branch.name}
                onChange={(e) => updateBranch(index, 'name', e.target.value)}
                placeholder="e.g., Main Branch, Branch 2"
                className="bg-background/50"
                required
              />
            </div>

            <div>
              <Label>Branch Code *</Label>
              <Input
                value={branch.code}
                onChange={(e) => updateBranch(index, 'code', e.target.value.toUpperCase())}
                placeholder="e.g., MAIN, BR2"
                className="bg-background/50"
                required
              />
            </div>

            <div>
              <Label>Address (Optional)</Label>
              <Input
                value={branch.address || ''}
                onChange={(e) => updateBranch(index, 'address', e.target.value)}
                placeholder="Branch address if different from main"
                className="bg-background/50"
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addBranch}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Branch
      </Button>

      <div className="flex items-center gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue to Employee Setup
        </Button>
      </div>
    </form>
  );
}