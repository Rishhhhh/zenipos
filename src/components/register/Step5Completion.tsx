import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { RegistrationData } from '@/hooks/useRegistrationWizard';
import { PinConfirmationModal } from './PinConfirmationModal';

interface Step5Props {
  data: Partial<RegistrationData>;
  onNavigateToDashboard: () => void;
}

export function Step5Completion({ data, onNavigateToDashboard }: Step5Props) {
  const [showPinModal, setShowPinModal] = useState(true);

  const handlePinConfirmed = () => {
    setShowPinModal(false);
    // Store in localStorage temporarily
    localStorage.setItem('tempRegistrationPin', data.defaultPin || '');
    // Trigger navigation
    onNavigateToDashboard();
  };

  return (
    <>
      <PinConfirmationModal
        open={showPinModal}
        pin={data.defaultPin || ''}
        email={data.email || ''}
        organizationName={data.restaurantName || ''}
        onConfirm={handlePinConfirmed}
      />
      
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-2">Welcome to ZeniPOS!</h2>
          <p className="text-muted-foreground">
            Your organization <strong>{data.restaurantName}</strong> has been set up successfully.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-left space-y-2">
          <h4 className="font-semibold text-sm">Next Steps:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Confirm you've saved your PIN in the popup</li>
            <li>Log in with your email and password</li>
            <li>Enter your PIN to access the POS</li>
            <li>Configure your menu and settings</li>
            <li>Start taking orders!</li>
          </ol>
        </div>
      </div>
    </>
  );
}
