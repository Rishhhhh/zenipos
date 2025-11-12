import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { RegistrationData } from '@/hooks/useRegistrationWizard';

interface Step1Props {
  data: Partial<RegistrationData>;
  onUpdate: (updates: Partial<RegistrationData>) => void;
  onNext: () => void;
}

export function Step1AccountCreation({ data, onUpdate, onNext }: Step1Props) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain a number';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsValidating(true);

    const newErrors: Record<string, string> = {};

    // Validation
    if (!data.restaurantName?.trim()) newErrors.restaurantName = 'Restaurant name is required';
    if (!data.ownerName?.trim()) newErrors.ownerName = 'Owner name is required';
    
    if (!data.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!data.phone?.trim()) newErrors.phone = 'Phone number is required';
    
    const passwordError = validatePassword(data.password || '');
    if (passwordError) newErrors.password = passwordError;
    
    if (data.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!data.termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    // Check email uniqueness
    if (data.email && !newErrors.email) {
      try {
        const { data: existingOrg, error } = await supabase
          .from('organizations')
          .select('id')
          .eq('login_email', data.email)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking email:', error);
        } else if (existingOrg) {
          newErrors.email = 'Email already registered';
        }
      } catch (error) {
        console.error('Error checking email uniqueness:', error);
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsValidating(false);
      return;
    }

    setIsValidating(false);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="restaurantName">Restaurant Name *</Label>
        <Input
          id="restaurantName"
          value={data.restaurantName || ''}
          onChange={(e) => onUpdate({ restaurantName: e.target.value })}
          placeholder="e.g., Golden Dragon Restaurant"
          className="bg-background/50"
        />
        {errors.restaurantName && <p className="text-sm text-danger mt-1">{errors.restaurantName}</p>}
      </div>

      <div>
        <Label htmlFor="ownerName">Owner Name *</Label>
        <Input
          id="ownerName"
          value={data.ownerName || ''}
          onChange={(e) => onUpdate({ ownerName: e.target.value })}
          placeholder="e.g., John Tan"
          className="bg-background/50"
        />
        {errors.ownerName && <p className="text-sm text-danger mt-1">{errors.ownerName}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={data.email || ''}
          onChange={(e) => onUpdate({ email: e.target.value })}
          placeholder="owner@restaurant.com"
          className="bg-background/50"
        />
        {errors.email && <p className="text-sm text-danger mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          value={data.phone || ''}
          onChange={(e) => onUpdate({ phone: e.target.value })}
          placeholder="+60 12-345 6789"
          className="bg-background/50"
        />
        {errors.phone && <p className="text-sm text-danger mt-1">{errors.phone}</p>}
      </div>

      <div>
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          value={data.password || ''}
          onChange={(e) => onUpdate({ password: e.target.value })}
          placeholder="Min 8 characters, 1 uppercase, 1 number"
          className="bg-background/50"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Must be at least 8 characters with uppercase, lowercase, and number
        </p>
        {errors.password && <p className="text-sm text-danger mt-1">{errors.password}</p>}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          className="bg-background/50"
        />
        {errors.confirmPassword && <p className="text-sm text-danger mt-1">{errors.confirmPassword}</p>}
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="terms"
          checked={data.termsAccepted || false}
          onCheckedChange={(checked) => onUpdate({ termsAccepted: checked as boolean })}
        />
        <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
          I agree to the <span className="text-primary underline">Terms & Conditions</span> and <span className="text-primary underline">Privacy Policy</span>
        </Label>
      </div>
      {errors.terms && <p className="text-sm text-danger">{errors.terms}</p>}

      <Button type="submit" className="w-full mt-6" disabled={isValidating}>
        {isValidating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validating...
          </>
        ) : (
          'Continue to Restaurant Details'
        )}
      </Button>
    </form>
  );
}