import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useManagerApproval } from '@/hooks/useManagerApproval';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoidItemWithApprovalProps {
  itemId: string;
  itemName: string;
  onVoid: (managerId?: string) => Promise<void>;
}

export function VoidItemWithApproval({ itemId, itemName, onVoid }: VoidItemWithApprovalProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { requestApproval, waitForApproval, isWaitingForApproval, cancelWaiting } = useManagerApproval();

  const handleVoidRequest = async () => {
    setShowConfirm(false);

    try {
      // Create approval request
      const request = await requestApproval({
        actionType: 'void_item',
        actionContext: {
          item_id: itemId,
          item_name: itemName,
        },
      });

      if (!request) return;

      // Wait for approval
      const approved = await waitForApproval(
        request.id,
        async () => {
          // On approved
          await onVoid(request.approved_by);
          toast.success(`${itemName} voided`);
        },
        () => {
          // On rejected
          toast.error('Void request was rejected');
        }
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to void item');
      cancelWaiting();
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={isWaitingForApproval}
      >
        {isWaitingForApproval ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Item</AlertDialogTitle>
            <AlertDialogDescription>
              This will request manager approval to void <strong>{itemName}</strong>.
              This action cannot be undone without manager authorization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVoidRequest}>
              Request Approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
