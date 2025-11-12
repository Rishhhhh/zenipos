import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import type { RegistrationData } from '@/hooks/useRegistrationWizard';

interface Step5Props {
  data: Partial<RegistrationData>;
  onNavigateToDashboard: () => void;
}

export function Step5Completion({ data, onNavigateToDashboard }: Step5Props) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <CheckCircle2 className="h-24 w-24 text-success" />
      </div>

      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to ZeniPOS!</h2>
        <p className="text-muted-foreground">
          Your organization <strong className="text-foreground">{data.restaurantName}</strong> has been successfully registered.
        </p>
      </div>

      <div className="p-6 rounded-lg bg-primary/10 border border-primary/20 space-y-4 text-left">
        <h3 className="font-semibold text-foreground">Important Information:</h3>
        
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            <strong>Your Login Email:</strong> {data.email}
          </p>
          <p className="text-sm text-foreground">
            <strong>Organization Slug:</strong> {data.slug}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-background/50 border border-border">
          <p className="text-sm font-semibold text-foreground mb-2">Your Owner PIN:</p>
          <p className="text-3xl font-bold text-primary text-center tracking-wider">
            {data.defaultPin}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          A welcome email with all details has been sent to <strong>{data.email}</strong>
        </p>

        <p className="text-sm text-warning">
          ⚠️ Please save your PIN securely. You can change it after your first login.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Next Steps:</h3>
        <ol className="text-left space-y-2 text-sm text-muted-foreground">
          <li>1. Click "Go to Login" below</li>
          <li>2. Enter your organization email and password</li>
          <li>3. Use your PIN to access the POS system</li>
          <li>4. Complete any remaining setup in the dashboard</li>
        </ol>
      </div>

      <Button onClick={onNavigateToDashboard} className="w-full" size="lg">
        Go to Login
      </Button>
    </div>
  );
}