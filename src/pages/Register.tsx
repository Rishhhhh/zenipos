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

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      console.log('Starting organization signup...');
      
      // Step 1: Create organization + owner
      const { data: signupData, error: signupError } = await supabase.functions.invoke(
        'organization-signup',
        {
          body: {
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
          }
        }
      );

      if (signupError) {
        console.error('Signup error:', signupError);
        throw new Error(signupError.message || 'Failed to create organization');
      }

      console.log('Signup response:', signupData);
      
      const { organizationId, slug, setupToken, defaultPin } = signupData;

      if (!organizationId || !defaultPin) {
        throw new Error('Invalid response from signup function');
      }

      // Update local data with org info
      updateData({ organizationId, defaultPin, slug });

      // Step 2-5: Complete wizard steps via setup-wizard function
      console.log('Starting setup wizard...');
      
      // Step 2: Branches
      if (data.branches && data.branches.length > 0) {
        await supabase.functions.invoke('organization-setup-wizard', {
          body: {
            organizationId,
            step: 2,
            data: { branches: data.branches },
          },
          headers: {
            Authorization: `Bearer ${setupToken}`,
          }
        });
      }

      // Step 3: Employees
      if (data.employees && data.employees.length > 0) {
        await supabase.functions.invoke('organization-setup-wizard', {
          body: {
            organizationId,
            step: 3,
            data: { employees: data.employees },
          },
          headers: {
            Authorization: `Bearer ${setupToken}`,
          }
        });
      }

      // Step 5: Mark onboarding complete
      await supabase.functions.invoke('organization-setup-wizard', {
        body: {
          organizationId,
          step: 5,
          data: {},
        },
        headers: {
          Authorization: `Bearer ${setupToken}`,
        }
      });

      console.log('Registration completed successfully!');

      // Clear progress
      clearProgress();
      sessionStorage.removeItem('admin_authenticated');

      // Show success
      toast.success('Organization registered successfully!');
      
      // Navigate to completion step
      nextStep();
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
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