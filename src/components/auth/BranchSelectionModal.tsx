import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Crown, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Branch {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
}

interface BranchSelectionModalProps {
  branches: Branch[];
  onSelect: (branchId: string) => void;
  open: boolean;
}

export function BranchSelectionModal({ branches, onSelect, open }: BranchSelectionModalProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const isMainBranch = (branch: Branch) => 
    branch.code?.toUpperCase() === 'MAIN' || 
    branch.name.toLowerCase().includes('main');

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId);
    // Delay slightly for visual feedback
    setTimeout(() => {
      onSelect(branchId);
    }, 150);
  };

  return (
    <Dialog open={open}>
      <DialogContent 
        className="sm:max-w-2xl bg-background/95 backdrop-blur-xl border-border/50"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Select Your Branch
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose which branch you're working at today
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {branches.map((branch, index) => {
            const isMain = isMainBranch(branch);
            const isSelected = selectedBranchId === branch.id;
            
            return (
              <Card
                key={branch.id}
                onClick={() => handleBranchSelect(branch.id)}
                className={cn(
                  "p-6 cursor-pointer transition-all duration-200",
                  "hover:scale-105 hover:shadow-lg hover:border-primary/50",
                  "animate-[fade-in_0.3s_ease-out]",
                  isSelected && "border-primary bg-primary/5 scale-105",
                  isMain && "border-warning/50 bg-warning/5"
                )}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isMain ? (
                      <Crown className="h-5 w-5 text-warning" />
                    ) : (
                      <Building2 className="h-5 w-5 text-primary" />
                    )}
                    <h3 className="font-semibold text-lg">{branch.name}</h3>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary animate-in fade-in zoom-in" />
                  )}
                </div>

                {branch.code && (
                  <Badge 
                    variant={isMain ? "default" : "outline"} 
                    className={cn(
                      "mb-2",
                      isMain && "bg-warning/20 text-warning border-warning/30"
                    )}
                  >
                    {branch.code}
                  </Badge>
                )}

                {branch.address && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {branch.address}
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            🔒 You can only log in to branches where you're assigned as an employee
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
