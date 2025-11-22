import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Copy, Check, Download } from 'lucide-react';
import { toast } from 'sonner';

interface PinConfirmationModalProps {
  open: boolean;
  pin: string;
  email: string;
  organizationName: string;
  onConfirm: () => void;
}

export function PinConfirmationModal({ 
  open, 
  pin, 
  email, 
  organizationName,
  onConfirm 
}: PinConfirmationModalProps) {
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setPinCopied(true);
    toast.success('PIN copied to clipboard!');
    setTimeout(() => setPinCopied(false), 2000);
  };

  const handleDownloadPin = () => {
    const content = `
ZeniPOS Account Details
======================
Organization: ${organizationName}
Email: ${email}
Owner PIN: ${pin}

⚠️ IMPORTANT: Keep this PIN secure. You will need it to access the POS system.
You can change it after your first login.
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenipos-pin-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('PIN details downloaded!');
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Save Your Owner PIN
          </AlertDialogTitle>
          <AlertDialogDescription>
            This is your <strong>one-time</strong> display of the owner PIN. 
            You will need this to access the POS system.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* PIN Display */}
          <div className="p-6 rounded-lg bg-primary/10 border-2 border-primary">
            <p className="text-sm text-muted-foreground mb-2 text-center">
              Your Owner PIN
            </p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-5xl font-bold text-primary tracking-wider">
                {pin}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPin}
                className="ml-2"
              >
                {pinCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPin}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Details
            </Button>
          </div>

          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              • This PIN will not be shown again<br />
              • You can change it after your first login<br />
              • Keep it secure - anyone with this PIN can access your POS
            </AlertDescription>
          </Alert>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2 p-4 rounded-lg bg-muted">
            <Checkbox
              id="confirm-saved"
              checked={hasConfirmed}
              onCheckedChange={(checked) => setHasConfirmed(checked as boolean)}
            />
            <label
              htmlFor="confirm-saved"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have saved my PIN securely and understand it cannot be recovered
            </label>
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            onClick={onConfirm}
            disabled={!hasConfirmed}
            className="w-full"
            size="lg"
          >
            I've Saved My PIN - Continue to Login
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
