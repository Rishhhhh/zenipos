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

export default function Login() {
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-danger/10 via-transparent to-transparent" />
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <GlassLoginCard>
        {/* Logo & Branding */}
        <div className="text-center mb-8 animate-[fade-in_0.8s_ease-out]">
          {organization?.logoUrl ? (
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src={organization.logoUrl} 
                alt={organization.name} 
                className="h-20 object-contain"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center mb-4">
              <ZeniPOSLogo variant="full" theme="auto" className="h-20" />
            </div>
          )}
          <h1 className="text-3xl font-bold mb-2">
            {organization?.name || (
              <>
                <span className="text-foreground">ZENI</span>
                <span className="text-primary">POS</span>
              </>
            )}
          </h1>
          <p className="text-sm text-muted-foreground tracking-widest">ZERO ERROR</p>
          <p className="text-muted-foreground mt-2">Enter your PIN to continue</p>
        </div>

        {/* PIN Pad */}
        <div className="animate-[fade-in_1s_ease-out_0.2s_both]">
          <AnimatedPinPad
            value={pin}
            onChange={setPin}
            maxLength={5}
            disabled={isSubmitting}
          />
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2 mt-6 justify-center animate-[fade-in_1s_ease-out_0.4s_both]">
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
            Remember me for 8 hours
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

        {/* Test Credentials */}
        <div className="mt-4 text-center text-xs text-muted-foreground animate-[fade-in_1s_ease-out_0.6s_both]">
          <p>Test PIN: <span className="font-mono font-semibold text-foreground">12345</span></p>
          <p className="mt-1">Available roles: Staff, Manager, Owner</p>
        </div>
      </GlassLoginCard>
    </div>
  );
}
