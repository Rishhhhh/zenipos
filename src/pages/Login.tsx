import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GlassLoginCard } from '@/components/auth/GlassLoginCard';
import { AnimatedPinPad } from '@/components/auth/AnimatedPinPad';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Brain, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function Login() {
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

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
      await login(pin, rememberMe);
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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-danger/20 border border-danger/30 mb-4 animate-[shimmer_3s_ease-in-out_infinite]">
            <Brain className="h-10 w-10 text-danger" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Restaurant POS</h1>
          <p className="text-muted-foreground">Enter your PIN to continue</p>
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

        {/* Test Credentials */}
        <div className="mt-6 pt-6 border-t border-border/20 text-center text-xs text-muted-foreground animate-[fade-in_1s_ease-out_0.6s_both]">
          <p>Test PIN: <span className="font-mono font-semibold text-foreground">12345</span></p>
          <p className="mt-1">Available roles: Cashier, Manager, Admin</p>
        </div>
      </GlassLoginCard>
    </div>
  );
}
