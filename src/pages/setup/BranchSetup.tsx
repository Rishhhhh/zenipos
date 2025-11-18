import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassLoginCard } from '@/components/auth/GlassLoginCard';
import { Building2, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Branch {
  name: string;
  code: string;
  address?: string;
  phone?: string;
}

export default function BranchSetup() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([
    { name: 'Main Branch', code: 'MAIN', address: '', phone: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Get organization info from localStorage
  const orgSession = localStorage.getItem('pos_org_session');
  const organization = orgSession ? JSON.parse(orgSession) : null;

  const addBranch = () => {
    setBranches([
      ...branches,
      { name: '', code: '', address: '', phone: '' },
    ]);
  };

  const removeBranch = (index: number) => {
    if (branches.length > 1) {
      setBranches(branches.filter((_, i) => i !== index));
    }
  };

  const updateBranch = (index: number, field: keyof Branch, value: string) => {
    const updated = [...branches];
    updated[index] = { ...updated[index], [field]: value };
    setBranches(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!organization?.organizationId) {
        throw new Error('Organization session not found. Please login again.');
      }

      console.log('[Branch Setup] Submitting branches:', {
        organizationId: organization.organizationId,
        branchCount: branches.length,
        branches: branches.map((b) => ({ name: b.name, code: b.code })),
      });

      // Call organization-setup-wizard edge function (Step 2: Branch Setup)
      const { data, error: functionError } = await supabase.functions.invoke(
        'organization-setup-wizard',
        {
          body: {
            organizationId: organization.organizationId,
            step: 2,
            data: { branches },
          },
        }
      );

      if (functionError) {
        console.error('[Branch Setup] Edge function error:', functionError);
        throw functionError;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create branches');
      }

      console.log('[Branch Setup] ✅ Branches created successfully:', data);

      toast.success('Branches created successfully!', {
        description: `${branches.length} branch(es) set up for your organization`,
      });

      // Wait 2 seconds then redirect to auth page
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (err: any) {
      console.error('[Branch Setup] Error:', err);
      setError(err.message || 'Failed to create branches. Please try again.');
      toast.error('Branch setup failed', {
        description: err.message || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        <GlassLoginCard>
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 mb-4">
              <Building2 className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Session Expired</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your organization session has expired. Please login again.
              </p>
            </div>
            <Button onClick={() => navigate('/auth')} variant="outline" className="w-full">
              Back to Login
            </Button>
          </div>
        </GlassLoginCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />

      <GlassLoginCard className="max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Branch Setup Required</h1>
            <p className="text-muted-foreground">
              Set up at least one branch for <strong>{organization.organizationName}</strong>
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Branch Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {branches.map((branch, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-muted/30 space-y-3"
                >
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
                        disabled={isSubmitting}
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
                      placeholder="e.g., Main Branch, Downtown Location"
                      className="bg-background/50"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label>Branch Code *</Label>
                    <Input
                      value={branch.code}
                      onChange={(e) =>
                        updateBranch(index, 'code', e.target.value.toUpperCase())
                      }
                      placeholder="e.g., MAIN, DT01"
                      className="bg-background/50"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label>Address (Optional)</Label>
                    <Input
                      value={branch.address || ''}
                      onChange={(e) => updateBranch(index, 'address', e.target.value)}
                      placeholder="Branch physical address"
                      className="bg-background/50"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label>Phone (Optional)</Label>
                    <Input
                      value={branch.phone || ''}
                      onChange={(e) => updateBranch(index, 'phone', e.target.value)}
                      placeholder="Branch phone number"
                      className="bg-background/50"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Add Branch Button */}
            <Button
              type="button"
              variant="outline"
              onClick={addBranch}
              className="w-full"
              disabled={isSubmitting}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Branch
            </Button>

            {/* Submit Button */}
            <div className="pt-4 space-y-3">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Branches...
                  </>
                ) : (
                  <>Complete Setup ({branches.length} branch{branches.length !== 1 ? 'es' : ''})</>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/auth')}
                className="w-full"
                disabled={isSubmitting}
              >
                Back to Login
              </Button>
            </div>
          </form>

          {/* Helper Text */}
          <p className="text-xs text-muted-foreground text-center">
            You can add more branches later from the organization settings
          </p>
        </div>
      </GlassLoginCard>
    </div>
  );
}
