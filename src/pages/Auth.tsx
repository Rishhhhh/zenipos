import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GlassLoginCard } from '@/components/auth/GlassLoginCard';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { ZeniPOSLogo } from '@/components/layout/ZeniPOSLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { organizationLogin, isOrganizationAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isOrganizationAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isOrganizationAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await organizationLogin(email, password);
      // Navigation handled by useEffect above
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
      // Shake animation on error
      const card = document.querySelector('.glass-card');
      card?.classList.add('animate-[shake_0.5s_ease-in-out]');
      setTimeout(() => {
        card?.classList.remove('animate-[shake_0.5s_ease-in-out]');
      }, 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
      
      {/* Theme Toggle */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <GlassLoginCard>
        {/* Logo & Branding - Responsive sizing */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8 animate-[fade-in_0.8s_ease-out]">
          <div className="inline-flex items-center justify-center mb-2 sm:mb-4">
            <ZeniPOSLogo variant="full" theme="auto" className="h-12 sm:h-16 md:h-20" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="text-foreground">ZENI</span>
            <span className="text-primary">POS</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground tracking-widest">ZERO ERROR</p>
          <p className="text-sm text-muted-foreground mt-2 sm:mt-4">Organization Login</p>
        </div>

        {/* Login Form - Responsive spacing */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 animate-[fade-in_1s_ease-out_0.2s_both]">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="restaurant@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="bg-background/50"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="bg-background/50"
              autoComplete="current-password"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !email || !password}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login to Organization'
            )}
          </Button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm text-center animate-[shake_0.5s_ease-in-out]">
            {error}
          </div>
        )}

        {/* Contact Info */}
        <div className="mt-6 pt-6 border-t border-border/20 text-center text-xs text-muted-foreground animate-[fade-in_1s_ease-out_0.4s_both]">
          <p>Don't have an account?</p>
          <a href="/register" className="text-primary hover:underline mt-1 inline-block">
            Register a new organization
          </a>
        </div>
      </GlassLoginCard>
    </div>
  );
}
