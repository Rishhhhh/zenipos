import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: any[];
  language?: 'en' | 'ms';
  onApprovalComplete: () => void;
}

export function AIApprovalDialog({
  open,
  onOpenChange,
  actions,
  language = 'en',
  onApprovalComplete
}: AIApprovalDialogProps) {
  const [pin, setPin] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    if (!pin) {
      toast({
        variant: 'destructive',
        title: language === 'ms' ? 'Ralat' : 'Error',
        description: language === 'ms' ? 'Sila masukkan PIN pengurus' : 'Please enter manager PIN',
      });
      return;
    }

    setIsApproving(true);

    try {
      // Execute each pending action
      for (const action of actions) {
        const { data, error } = await supabase.functions.invoke('execute-approved-action', {
          body: {
            action: action.tool,
            data: action.args,
            manager_pin: pin
          }
        });

        if (error) throw error;
      }

      onApprovalComplete();
      setPin('');
      onOpenChange(false);

    } catch (error) {
      console.error('Approval error:', error);
      toast({
        variant: 'destructive',
        title: language === 'ms' ? 'Ralat' : 'Error',
        description: error.message || (language === 'ms' ? 'Gagal meluluskan tindakan' : 'Failed to approve action'),
      });
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            {language === 'ms' ? 'Kelulusan Diperlukan' : 'Approval Required'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ms' 
              ? 'Tindakan berikut memerlukan kelulusan pengurus:' 
              : 'The following actions require manager approval:'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {actions.map((action, idx) => (
            <Alert key={idx}>
              <AlertDescription>
                <Badge className="mb-2">{action.tool}</Badge>
                <p className="text-sm">{action.result.message}</p>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(action.args, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="manager-pin">
            {language === 'ms' ? 'PIN Pengurus' : 'Manager PIN'}
          </Label>
          <Input
            id="manager-pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••••"
            maxLength={6}
            disabled={isApproving}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setPin('');
              onOpenChange(false);
            }}
            disabled={isApproving}
          >
            {language === 'ms' ? 'Batal' : 'Cancel'}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={!pin || isApproving}
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'ms' ? 'Meluluskan...' : 'Approving...'}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {language === 'ms' ? 'Luluskan' : 'Approve'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
