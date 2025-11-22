import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { RegistrationData } from '@/hooks/useRegistrationWizard';

interface Step1Props {
  data: Partial<RegistrationData>;
  onUpdate: (updates: Partial<RegistrationData>) => void;
  onNext: () => void;
  serverError?: string | null;
}

export function Step1AccountCreation({ data, onUpdate, onNext, serverError }: Step1Props) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validFields, setValidFields] = useState<Record<string, boolean>>({});
  const [debugMode, setDebugMode] = useState(false);
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');

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

  const checkEmailUniqueness = async (email: string, retryCount = 0): Promise<boolean> => {
    const maxRetries = 2;
    setEmailCheckStatus('checking');
    
    console.log(`[Registration Debug] Checking email uniqueness: ${email} (Attempt ${retryCount + 1})`);
    
    try {
      // Create a 10-second timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Email check timeout after 10 seconds')), 10000);
      });

      // Race between actual check and timeout
      const checkPromise = supabase
        .from('organizations')
        .select('id')
        .eq('login_email', email)
        .maybeSingle();

      const { data: existingOrg, error } = await Promise.race([
        checkPromise,
        timeoutPromise
      ]) as Awaited<typeof checkPromise>;
      
      if (error && error.code !== 'PGRST116') {
        console.error('[Registration Debug] Email check error:', error);
        
        if (retryCount < maxRetries) {
          console.log(`[Registration Debug] Retrying email check (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return checkEmailUniqueness(email, retryCount + 1);
        }
        
        setEmailCheckStatus('error');
        toast.warning('Could not verify email uniqueness. You may proceed, but the email might already be in use.');
        return true; // Allow to proceed with warning
      }
      
      if (existingOrg) {
        console.log('[Registration Debug] Email already exists in database');
        setEmailCheckStatus('taken');
        return false;
      }
      
      console.log('[Registration Debug] Email is available');
      setEmailCheckStatus('available');
      return true;
    } catch (error) {
      console.error('[Registration Debug] Email check exception:', error);
      
      // Check if it's a timeout error
      if (error instanceof Error && error.message.includes('timeout')) {
        console.warn('[Registration Debug] Email check timed out after 10 seconds');
        setEmailCheckStatus('error');
        toast.warning('Email check is taking too long. You can proceed, but verify your email is correct.');
        return true; // Allow to proceed with warning
      }
      
      if (retryCount < maxRetries) {
        console.log(`[Registration Debug] Retrying email check after exception (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return checkEmailUniqueness(email, retryCount + 1);
      }
      
      setEmailCheckStatus('error');
      toast.warning('Network error. You may proceed, but please ensure your email is unique.');
      return true; // Allow to proceed with warning
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Registration Debug] Starting Step 1 validation');
    console.log('[Registration Debug] Form data:', { 
      restaurantName: data.restaurantName, 
      ownerName: data.ownerName,
      email: data.email,
      phone: data.phone,
      hasPassword: !!data.password,
      termsAccepted: data.termsAccepted
    });
    
    setErrors({});
    setValidFields({});
    setIsValidating(true);

    const newErrors: Record<string, string> = {};
    const newValidFields: Record<string, boolean> = {};

    // Validation with detailed logging
    console.log('[Registration Debug] Validating restaurant name...');
    if (!data.restaurantName?.trim()) {
      newErrors.restaurantName = 'Restaurant name is required';
      console.log('[Registration Debug] ❌ Restaurant name failed');
    } else {
      newValidFields.restaurantName = true;
      console.log('[Registration Debug] ✅ Restaurant name valid');
    }
    
    console.log('[Registration Debug] Validating owner name...');
    if (!data.ownerName?.trim()) {
      newErrors.ownerName = 'Owner name is required';
      console.log('[Registration Debug] ❌ Owner name failed');
    } else {
      newValidFields.ownerName = true;
      console.log('[Registration Debug] ✅ Owner name valid');
    }
    
    console.log('[Registration Debug] Validating email...');
    if (!data.email?.trim()) {
      newErrors.email = 'Email is required';
      console.log('[Registration Debug] ❌ Email is empty');
    } else if (!validateEmail(data.email)) {
      newErrors.email = 'Invalid email format';
      console.log('[Registration Debug] ❌ Email format invalid');
    } else {
      newValidFields.email = true;
      console.log('[Registration Debug] ✅ Email format valid');
    }
    
    console.log('[Registration Debug] Validating phone...');
    if (!data.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
      console.log('[Registration Debug] ❌ Phone failed');
    } else {
      newValidFields.phone = true;
      console.log('[Registration Debug] ✅ Phone valid');
    }
    
    console.log('[Registration Debug] Validating password...');
    const passwordError = validatePassword(data.password || '');
    if (passwordError) {
      newErrors.password = passwordError;
      console.log('[Registration Debug] ❌ Password failed:', passwordError);
    } else {
      newValidFields.password = true;
      console.log('[Registration Debug] ✅ Password valid');
    }
    
    console.log('[Registration Debug] Validating password confirmation...');
    if (data.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      console.log('[Registration Debug] ❌ Password confirmation failed');
    } else {
      newValidFields.confirmPassword = true;
      console.log('[Registration Debug] ✅ Password confirmation valid');
    }
    
    console.log('[Registration Debug] Validating terms acceptance...');
    if (!data.termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions';
      console.log('[Registration Debug] ❌ Terms not accepted');
    } else {
      newValidFields.terms = true;
      console.log('[Registration Debug] ✅ Terms accepted');
    }

    setValidFields(newValidFields);

    // Check email uniqueness if email is valid (skip in dev mode)
    if (data.email && !newErrors.email) {
      const isDev = import.meta.env.VITE_DEV_MODE === 'true';
      
      if (isDev) {
        console.log('[Registration Debug] 🚀 DEV MODE: Skipping email uniqueness check');
        console.log('[Registration Debug] ✅ Email validation bypassed in development');
        newValidFields.email = true;
        setEmailCheckStatus('available');
      } else {
        console.log('[Registration Debug] Checking email uniqueness with backend...');
        const isEmailAvailable = await checkEmailUniqueness(data.email);
        
        if (!isEmailAvailable) {
          newErrors.email = 'Email already registered';
          console.log('[Registration Debug] ❌ Email uniqueness check failed');
          delete newValidFields.email;
        } else {
          console.log('[Registration Debug] ✅ Email uniqueness check passed');
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      console.log('[Registration Debug] Validation failed with errors:', newErrors);
      setErrors(newErrors);
      setIsValidating(false);
      
      // Show toast with first error
      const firstError = Object.values(newErrors)[0];
      toast.error(`Validation Error: ${firstError}`);
      return;
    }

    console.log('[Registration Debug] ✅ All validations passed! Proceeding to next step...');
    toast.success('Step 1 completed successfully!');
    setIsValidating(false);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {import.meta.env.VITE_DEV_MODE === 'true' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            🚀 Development Mode Active - Email validation skipped
          </p>
        </div>
      )}
      
      {/* Debug Mode Toggle - Collapsed by default */}
      <details className="bg-muted/30 rounded-lg overflow-hidden">
        <summary className="flex items-center justify-between p-2 cursor-pointer text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
          <span>🐛 Debug Mode (Show Validation Status)</span>
        </summary>
        <div className="p-3 bg-muted/50 space-y-2 text-xs">
          <h4 className="font-semibold text-sm">Validation Status:</h4>
          <div className="space-y-1">
            {['restaurantName', 'ownerName', 'email', 'phone', 'password', 'confirmPassword', 'terms'].map(field => (
              <div key={field} className="flex items-center gap-2">
                {validFields[field] ? (
                  <CheckCircle2 className="h-3 w-3 text-success" />
                ) : errors[field] ? (
                  <XCircle className="h-3 w-3 text-danger" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                )}
                <span className={validFields[field] ? 'text-success' : errors[field] ? 'text-danger' : ''}>
                  {field}: {validFields[field] ? 'Valid' : errors[field] || 'Not validated'}
                </span>
              </div>
            ))}
            {data.email && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                {emailCheckStatus === 'checking' && <Loader2 className="h-3 w-3 animate-spin" />}
                {emailCheckStatus === 'available' && <CheckCircle2 className="h-3 w-3 text-success" />}
                {emailCheckStatus === 'taken' && <XCircle className="h-3 w-3 text-danger" />}
                {emailCheckStatus === 'error' && <AlertCircle className="h-3 w-3 text-warning" />}
                <span>Email Check: {emailCheckStatus}</span>
              </div>
            )}
          </div>
        </div>
      </details>
      <div>
        <Label htmlFor="restaurantName">Restaurant Name *</Label>
        <div className="relative">
          <Input
            id="restaurantName"
            value={data.restaurantName || ''}
            onChange={(e) => onUpdate({ restaurantName: e.target.value })}
            placeholder="e.g., Golden Dragon Restaurant"
            className="bg-background/50"
          />
          {validFields.restaurantName && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-success" />}
        </div>
        {errors.restaurantName && <p className="text-sm text-danger mt-1">{errors.restaurantName}</p>}
      </div>

      <div>
        <Label htmlFor="ownerName">Owner Name *</Label>
        <div className="relative">
          <Input
            id="ownerName"
            value={data.ownerName || ''}
            onChange={(e) => onUpdate({ ownerName: e.target.value })}
            placeholder="e.g., John Tan"
            className="bg-background/50"
          />
          {validFields.ownerName && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-success" />}
        </div>
        {errors.ownerName && <p className="text-sm text-danger mt-1">{errors.ownerName}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            onChange={(e) => onUpdate({ email: e.target.value })}
            placeholder="owner@restaurant.com"
            className={cn(
              "bg-background/50",
              (errors.email || serverError?.toLowerCase().includes('email')) && "border-danger focus-visible:ring-danger"
            )}
          />
          {emailCheckStatus === 'checking' && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />}
          {emailCheckStatus === 'available' && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-success" />}
          {emailCheckStatus === 'taken' && <XCircle className="absolute right-3 top-3 h-4 w-4 text-danger" />}
          {emailCheckStatus === 'error' && <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-warning" />}
        </div>
        {errors.email && <p className="text-sm text-danger mt-1">{errors.email}</p>}
        {serverError?.toLowerCase().includes('email') && (
          <p className="text-sm text-danger mt-1 font-medium">{serverError}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <div className="relative">
          <Input
            id="phone"
            type="tel"
            value={data.phone || ''}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="+60 12-345 6789"
            className="bg-background/50"
          />
          {validFields.phone && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-success" />}
        </div>
        {errors.phone && <p className="text-sm text-danger mt-1">{errors.phone}</p>}
      </div>

      <div>
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Input
            id="password"
            type="password"
            value={data.password || ''}
            onChange={(e) => onUpdate({ password: e.target.value })}
            placeholder="Min 8 characters, 1 uppercase, 1 number"
            className="bg-background/50"
          />
          {validFields.password && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-success" />}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Must be at least 8 characters with uppercase, lowercase, and number
        </p>
        {errors.password && <p className="text-sm text-danger mt-1">{errors.password}</p>}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="bg-background/50"
          />
          {validFields.confirmPassword && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-success" />}
        </div>
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