import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GlassLoginCard } from '@/components/auth/GlassLoginCard';
import { AnimatedPinPad } from '@/components/auth/AnimatedPinPad';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ZeniPOSLogo } from '@/components/layout/ZeniPOSLogo';
import { BranchSelectionModal } from '@/components/auth/BranchSelectionModal';
import { toast } from 'sonner';

export default function Login() {
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<any[]>([]);
  const { 
    employeeLogin, 
    isEmployeeAuthenticated, 
    isOrganizationAuthenticated,
    organization,
    organizationLogout 
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to org login if no org session
  useEffect(() => {
    if (!isOrganizationAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isOrganizationAuthenticated, navigate]);

  // Branch selection logic - runs after org authentication
  useEffect(() => {
    if (!isOrganizationAuthenticated || !organization) return;

    // Get branches from org session
    const orgSession = localStorage.getItem('pos_org_session');
    if (!orgSession) return;

    const session = JSON.parse(orgSession);
    const branches = session.branches || [];

    console.log('[Login] Branch check:', {
      count: branches.length,
      branches: branches.map((b: any) => b.name)
    });

    if (branches.length === 0) {
      // No branches - redirect to setup wizard
      console.log('[Login] No branches found, redirecting to setup');
      toast.warning('Branch setup required', {
        description: 'Please set up at least one branch to continue'
      });
      navigate('/setup/branches');
    } else if (branches.length === 1) {
      // Single branch - auto-select
      console.log('[Login] Single branch detected, auto-selecting:', branches[0].name);
      sessionStorage.setItem('pos_selected_branch_for_pin', branches[0].id);
      toast.success(`Branch: ${branches[0].name}`, {
        description: 'Automatically selected your branch'
      });
      // Continue to PIN entry (current flow)
    } else {
      // Multiple branches - show selector
      console.log('[Login] Multiple branches detected, showing selector');
      setAvailableBranches(branches);
      setShowBranchSelector(true);
    }
  }, [isOrganizationAuthenticated, organization, navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isEmployeeAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isEmployeeAuthenticated, navigate, location]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === 5 && !isSubmitting) {
      handleSubmit();
    }
  }, [pin]);

  const handleSubmit = async () => {
    if (pin.length !== 5 || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      await employeeLogin(pin, rememberMe);
      // Navigation handled by AuthContext and useEffect above
    } catch (err: any) {
      setError(err.message || 'Invalid PIN');
      // Shake animation on error
      const card = document.querySelector('.glass-card');
      card?.classList.add('animate-[shake_0.5s_ease-in-out]');
      setTimeout(() => {
        card?.classList.remove('animate-[shake_0.5s_ease-in-out]');
      }, 500);
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-danger/10 via-transparent to-transparent" />
      
      {/* Theme Toggle */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <GlassLoginCard>
        {/* Logo & Branding - Responsive sizing */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8 animate-[fade-in_0.8s_ease-out]">
          {organization?.logoUrl ? (
            <div className="inline-flex items-center justify-center mb-2 sm:mb-4">
              <img 
                src={organization.logoUrl} 
                alt={organization.name} 
                className="h-12 sm:h-16 md:h-20 object-contain"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center mb-2 sm:mb-4">
              <ZeniPOSLogo variant="full" theme="auto" className="h-12 sm:h-16 md:h-20" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
            {organization?.name || (
              <>
                <span className="text-foreground">ZENI</span>
                <span className="text-primary">POS</span>
              </>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground tracking-widest">ZERO ERROR</p>
          <p className="text-sm text-muted-foreground mt-2">
            {showBranchSelector ? 'Select your branch' : 'Enter your PIN to continue'}
          </p>
        </div>

        {/* PIN Pad - Responsive spacing */}
        <div className="animate-[fade-in_1s_ease-out_0.2s_both]">
          <AnimatedPinPad
            value={pin}
            onChange={setPin}
            maxLength={5}
            disabled={isSubmitting}
          />
        </div>

        {/* Remember Me - Responsive spacing */}
        <div className="flex items-center gap-2 mt-4 sm:mt-6 justify-center animate-[fade-in_1s_ease-out_0.4s_both]">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            disabled={isSubmitting}
          />
          <Label
            htmlFor="remember"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Remember this device
          </Label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm text-center animate-[shake_0.5s_ease-in-out]">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isSubmitting && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Validating PIN...</span>
          </div>
        )}

        {/* Switch Organization */}
        <div className="mt-6 pt-6 border-t border-border/20 text-center animate-[fade-in_1s_ease-out_0.6s_both]">
          <button
            onClick={organizationLogout}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Not {organization?.name}? <span className="underline">Switch Organization</span>
          </button>
        </div>
      </GlassLoginCard>

      {/* Branch Selection Modal */}
      {showBranchSelector && (
        <BranchSelectionModal
          branches={availableBranches}
          open={showBranchSelector}
          onSelect={(branchId) => {
            sessionStorage.setItem('pos_selected_branch_for_pin', branchId);
            const selectedBranch = availableBranches.find(b => b.id === branchId);
            toast.success(`Branch selected: ${selectedBranch?.name}`);
            setShowBranchSelector(false);
          }}
        />
      )}
    </div>
  );
}
