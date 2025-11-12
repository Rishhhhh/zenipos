import { useState, useEffect } from 'react';

export interface RegistrationData {
  // Step 1: Account Creation
  restaurantName: string;
  ownerName: string;
  email: string;
  password: string;
  phone: string;
  termsAccepted: boolean;
  
  // Step 2: Restaurant Details
  businessType: string;
  cuisineTypes: string[];
  address: string;
  businessHours: Record<string, { open: string; close: string }>;
  timezone: string;
  currency: string;
  
  // Step 3: Branch Setup
  branches: Array<{ name: string; code: string; address?: string }>;
  
  // Step 4: Employee Onboarding
  employees: Array<{
    name: string;
    email?: string;
    phone?: string;
    role: 'manager' | 'staff';
    branchId: string;
  }>;
  
  // Step 5: Completion
  organizationId?: string;
  defaultPin?: string;
  slug?: string;
}

const DEFAULT_BUSINESS_HOURS = {
  monday: { open: '09:00', close: '22:00' },
  tuesday: { open: '09:00', close: '22:00' },
  wednesday: { open: '09:00', close: '22:00' },
  thursday: { open: '09:00', close: '22:00' },
  friday: { open: '09:00', close: '22:00' },
  saturday: { open: '09:00', close: '22:00' },
  sunday: { open: '09:00', close: '22:00' },
};

export function useRegistrationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<Partial<RegistrationData>>({
    termsAccepted: false,
    currency: 'MYR',
    timezone: 'Asia/Kuala_Lumpur',
    branches: [{ name: 'Main Branch', code: 'MAIN' }],
    employees: [],
    cuisineTypes: [],
    businessHours: DEFAULT_BUSINESS_HOURS,
  });

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('registration_progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if data is not too old (7 days)
        const isRecent = Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000;
        if (isRecent) {
          setData(parsed.data);
          setCurrentStep(parsed.step);
        } else {
          localStorage.removeItem('registration_progress');
        }
      } catch (error) {
        console.error('Failed to parse saved registration progress:', error);
        localStorage.removeItem('registration_progress');
      }
    }
  }, []);

  // Save progress to localStorage on change
  useEffect(() => {
    if (currentStep > 1 || Object.keys(data).length > 0) {
      localStorage.setItem('registration_progress', JSON.stringify({
        step: currentStep,
        data,
        timestamp: Date.now()
      }));
    }
  }, [currentStep, data]);

  const updateData = (updates: Partial<RegistrationData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const clearProgress = () => {
    localStorage.removeItem('registration_progress');
    setData({
      termsAccepted: false,
      currency: 'MYR',
      timezone: 'Asia/Kuala_Lumpur',
      branches: [{ name: 'Main Branch', code: 'MAIN' }],
      employees: [],
      cuisineTypes: [],
      businessHours: DEFAULT_BUSINESS_HOURS,
    });
    setCurrentStep(1);
  };

  return {
    currentStep,
    data,
    updateData,
    nextStep,
    prevStep,
    clearProgress
  };
}