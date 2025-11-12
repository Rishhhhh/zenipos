import { useState } from 'react';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ImpersonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationName: string;
  organizationId: string;
  onConfirm: (reason: string) => Promise<void>;
}

export function ImpersonateModal({
  open,
  onOpenChange,
  organizationName,
  organizationId,
  onConfirm,
}: ImpersonateModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      setReason('');
      onOpenChange(false);
    } catch (error) {
      console.error('Impersonation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassModal open={open} onOpenChange={onOpenChange} title="Impersonate Organization">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            You are about to impersonate <strong className="text-foreground">{organizationName}</strong>.
            All actions will be logged for security purposes.
          </p>
        </div>

        <div>
          <Label htmlFor="reason">Reason for Impersonation *</Label>
          <Textarea
            id="reason"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Customer support ticket #12345, debugging issue reported by owner"
            className="min-h-[100px] mt-2"
          />
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This action will be recorded in the audit log with your user ID, timestamp, and reason.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!reason.trim() || isSubmitting}>
            {isSubmitting ? 'Starting...' : 'Start Impersonation'}
          </Button>
        </div>
      </form>
    </GlassModal>
  );
}
