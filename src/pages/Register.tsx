import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPasswordGate } from '@/components/auth/AdminPasswordGate';
import { Step1AccountCreation } from '@/components/register/Step1AccountCreation';
import { Step2RestaurantDetails } from '@/components/register/Step2RestaurantDetails';
import { Step3BranchSetup } from '@/components/register/Step3BranchSetup';
import { Step4EmployeeOnboarding } from '@/components/register/Step4EmployeeOnboarding';
import { Step5Completion } from '@/components/register/Step5Completion';
import { GlassLoginCard } from '@/components/auth/GlassLoginCard';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useRegistrationWizard } from '@/hooks/useRegistrationWizard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Register() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentStep, data, updateData, nextStep, prevStep, clearProgress } = useRegistrationWizard();
  const navigate = useNavigate();

  // Check if admin is already authenticated
  useEffect(() => {
    const authenticated = sessionStorage.getItem('admin_authenticated');
    if (authenticated === 'true') {
      setIsAdminAuthenticated(true);
    }
  }, []);

  // Helper: Retry with exponential backoff
  const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Retry Logic] Attempt ${attempt}/${maxRetries}`);
        return await fn();
      } catch (error: any) {
        lastError = error;
        console.error(`[Retry Logic] Attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10s
          console.log(`[Retry Logic] Waiting ${delay}ms before retry...`);
          toast.info(`Retrying... (${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  };

  // Helper: Add timeout to promises
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs = 30000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  };

  // Helper: Invoke edge function with enhanced logging and error handling
  const invokeEdgeFunction = async (functionName: string, options: any) => {
    console.group(`[Edge Function] ${functionName}`);
    console.log('Request timestamp:', new Date().toISOString());
    console.log('Request payload:', JSON.stringify(options.body, null, 2));
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('Has Anon Key:', !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    
    try {
      const startTime = performance.now();
      
      const { data, error } = await withTimeout(
        supabase.functions.invoke(functionName, options),
        30000
      );
      
      const duration = Math.round(performance.now() - startTime);
      console.log(`Request completed in ${duration}ms`);
      console.log('Response data:', data);
      console.log('Response error:', error);
      
      if (error) {
        console.error(`[Edge Function] ${functionName} error:`, error);
        throw error;
      }
      
      console.groupEnd();
      return { data, error };
    } catch (error: any) {
      console.error(`[Edge Function] ${functionName} exception:`, error);
      console.error('Error stack:', error.stack);
      console.groupEnd();
      throw error;
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    console.log('═══════════════════════════════════════════════════════');
    console.log('[Registration] Starting organization signup process');
    console.log('[Registration] Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════');
    
    try {
      // Verify Supabase configuration
      console.group('[Config Check] Supabase Client Configuration');
      console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', 
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 
        `${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...` : 
        'MISSING'
      );
      console.log('Supabase client initialized:', !!supabase);
      console.groupEnd();

      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
        throw new Error('Supabase configuration is missing. Please check your .env file.');
      }

      toast.loading('Creating your organization...', { id: 'registration' });
      console.log('[Registration] Step 1/5: Creating organization + owner account');
      
      // Step 1: Create organization + owner with retry logic
      const signupPayload = {
        email: data.email,
        password: data.password,
        restaurantName: data.restaurantName,
        ownerName: data.ownerName,
        phone: data.phone,
        businessType: data.businessType,
        address: data.address,
        cuisineTypes: data.cuisineTypes,
        businessHours: data.businessHours,
        timezone: data.timezone,
        currency: data.currency,
      };

      console.log('[Registration] Signup payload prepared:', {
        ...signupPayload,
        password: '***REDACTED***'
      });

      const { data: signupData, error: signupError } = await retryWithBackoff(
        () => invokeEdgeFunction('organization-signup', { body: signupPayload })
      );

      if (signupError) {
        console.error('[Registration] ❌ Signup failed:', signupError);
        console.error('[Registration] Response data:', signupData);
        
        // Extract error message from BOTH error and data
        const errorMessage = signupData?.error || signupError.message || 'Failed to create organization';
        const statusCode = signupError.status || signupError.message?.match(/\d{3}/)?.[0];
        
        console.log('[Registration] Error message:', errorMessage);
        console.log('[Registration] Status code:', statusCode);
        
        // Check for email already registered (409 or 422)
        if (statusCode === 409 || statusCode === 422 || 
            errorMessage.toLowerCase().includes('already registered') ||
            errorMessage.toLowerCase().includes('already exists') ||
            errorMessage.toLowerCase().includes('email address has already been registered')) {
          toast.error('This email is already registered. Please use a different email or try logging in.', {
            duration: 5000
          });
          throw new Error('Email already registered');
        } 
        // Invalid data
        else if (statusCode === 400) {
          toast.error('Invalid registration data. Please check all fields and try again.', {
            duration: 5000
          });
          throw new Error('Invalid registration data');
        } 
        // Timeout
        else if (errorMessage.includes('timeout')) {
          toast.error('Registration is taking longer than expected. Please check your connection and try again.', {
            duration: 5000
          });
          throw new Error('Request timeout');
        } 
        // Generic error with actual message from server
        else {
          toast.error(errorMessage || 'Unable to create organization. Please try again or contact support.', {
            duration: 5000
          });
          throw new Error(errorMessage);
        }
      }

      console.log('[Registration] ✅ Organization created successfully');
      console.log('[Registration] Signup response:', signupData);
      
      const { organizationId, slug, setupToken, defaultPin } = signupData;

      if (!organizationId || !defaultPin) {
        console.error('[Registration] ❌ Invalid signup response:', signupData);
        throw new Error('Invalid response from signup function. Missing organizationId or defaultPin.');
      }

      console.log('[Registration] Organization ID:', organizationId);
      console.log('[Registration] Organization Slug:', slug);
      console.log('[Registration] Default PIN:', defaultPin);

      // Update local data with org info
      updateData({ organizationId, defaultPin, slug });

      toast.success('Organization created successfully!', { id: 'registration' });
      
      // Step 2: Additional Branches (only if more than 1 branch - first one created in Step 1)
      if (data.branches && data.branches.length > 1) {
        toast.info('Setting up additional branches...');
        console.log('[Registration] Step 2/5: Creating additional branches');
        console.log('[Registration] Additional branches to create:', data.branches.slice(1));
        
        await retryWithBackoff(() => 
          invokeEdgeFunction('organization-setup-wizard', {
            body: {
              organizationId,
              step: 2,
              data: { branches: data.branches },
            },
            headers: {
              Authorization: `Bearer ${setupToken}`,
            }
          })
        );
        
        console.log('[Registration] ✅ Branches created successfully');
        toast.success('Branches configured!');
      }

      // Step 3: Additional Employees (owner already created in Step 1)
      if (data.employees && data.employees.length > 0) {
        toast.info('Adding additional employees...');
        console.log('[Registration] Step 3/5: Creating additional employees');
        console.log('[Registration] Additional employees to create:', data.employees);
        
        await retryWithBackoff(() =>
          invokeEdgeFunction('organization-setup-wizard', {
            body: {
              organizationId,
              step: 3,
              data: { employees: data.employees },
            },
            headers: {
              Authorization: `Bearer ${setupToken}`,
            }
          })
        );
        
        console.log('[Registration] ✅ Employees created successfully');
        toast.success('Employees added!');
      }

      // Step 5: Mark onboarding complete
      toast.info('Finalizing setup...');
      console.log('[Registration] Step 5/5: Marking onboarding as complete');
      
      await retryWithBackoff(() =>
        invokeEdgeFunction('organization-setup-wizard', {
          body: {
            organizationId,
            step: 5,
            data: {},
          },
          headers: {
            Authorization: `Bearer ${setupToken}`,
          }
        })
      );

      console.log('[Registration] ✅ Onboarding marked as complete');
      console.log('═══════════════════════════════════════════════════════');
      console.log('[Registration] ✅ Registration completed successfully!');
      console.log('═══════════════════════════════════════════════════════');

      // Clear progress
      clearProgress();
      sessionStorage.removeItem('admin_authenticated');

      // Show success
      toast.success('Organization registered successfully!', {
        description: `Your PIN is: ${defaultPin}. Please save it securely.`,
        duration: 10000,
      });
      
      // Navigate to completion step
      nextStep();
      
    } catch (error: any) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('[Registration] ❌ Registration failed');
      console.error('[Registration] Error:', error);
      console.error('[Registration] Error message:', error.message);
      console.error('[Registration] Error stack:', error.stack);
      console.error('[Registration] Error details:', JSON.stringify(error, null, 2));
      console.error('═══════════════════════════════════════════════════════');
      
      // Provide user-friendly error messages
      const errorMessage = error.message || 'An unexpected error occurred during registration.';
      const isKnownError = errorMessage.includes('already registered') || 
                          errorMessage.includes('Invalid registration') || 
                          errorMessage.includes('timeout');
      
      toast.error('Registration Failed', {
        description: isKnownError 
          ? errorMessage 
          : 'Something went wrong. Please try again or contact support if the issue persists.',
        duration: isKnownError ? 6000 : 8000,
      });
    } finally {
      setIsSubmitting(false);
      console.log('[Registration] Submission state cleared');
    }
  };

  // Step 0: Admin authentication
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <AdminPasswordGate onAuthenticated={() => setIsAdminAuthenticated(true)} />
      </div>
    );
  }

  const stepTitles = [
    'Create Your Account',
    'Restaurant Details',
    'Branch Setup',
    'Employee Onboarding',
    'Welcome to ZeniPOS!'
  ];

  // Steps 1-5: Registration wizard
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-2xl relative z-10">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step, idx) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-colors",
                    currentStep >= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step}
                </div>
                {idx < 4 && (
                  <div 
                    className={cn(
                      "h-1 w-12 mx-2 transition-colors",
                      currentStep > step ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
            <span>Account</span>
            <span>Details</span>
            <span>Branches</span>
            <span>Staff</span>
            <span>Done</span>
          </div>
        </div>

        {/* Step Content */}
        <GlassLoginCard>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {stepTitles[currentStep - 1]}
            </h2>
          </div>

          {currentStep === 1 && (
            <Step1AccountCreation
              data={data}
              onUpdate={updateData}
              onNext={nextStep}
            />
          )}

          {currentStep === 2 && (
            <Step2RestaurantDetails
              data={data}
              onUpdate={updateData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}

          {currentStep === 3 && (
            <Step3BranchSetup
              data={data}
              onUpdate={updateData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}

          {currentStep === 4 && (
            <Step4EmployeeOnboarding
              data={data}
              onUpdate={updateData}
              onNext={handleFinalSubmit}
              onPrev={prevStep}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 5 && (
            <Step5Completion
              data={data}
              onNavigateToDashboard={() => navigate('/auth')}
            />
          )}
        </GlassLoginCard>
      </div>
    </div>
  );
}