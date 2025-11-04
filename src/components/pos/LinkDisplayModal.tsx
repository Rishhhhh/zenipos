import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Copy, Unlink, QrCode, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LinkDisplayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDisplayId: string | null;
  onLink: (displayId: string) => void;
  onUnlink: () => void;
}

export function LinkDisplayModal({
  open,
  onOpenChange,
  currentDisplayId,
  onLink,
  onUnlink,
}: LinkDisplayModalProps) {
  const { role } = useAuth();
  const [displayId] = useState(() => {
    return currentDisplayId || `display-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });

  const displayUrl = `${window.location.origin}/customer-screen?displayId=${displayId}`;
  
  // Only managers can link displays (they have dual screens)
  const canLinkDisplay = role === 'manager' || role === 'admin';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(displayUrl);
    toast.success("URL copied to clipboard");
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(displayId);
    toast.success("Display ID copied");
  };

  const handleLink = () => {
    if (!canLinkDisplay) {
      toast.error("Only managers can link customer displays");
      return;
    }
    onLink(displayId);
    toast.success("Customer display linked successfully");
    onOpenChange(false);
  };

  const handleUnlink = () => {
    onUnlink();
    toast.success("Customer display unlinked");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Link Customer Display
          </DialogTitle>
          <DialogDescription>
            Connect a secondary screen to show live cart updates to customers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Role Check Warning */}
          {!canLinkDisplay && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Only managers can link customer displays. This feature requires dual-screen setup.
              </AlertDescription>
            </Alert>
          )}

          {/* QR Code Placeholder */}
          <div className="flex flex-col items-center gap-3 p-6 border rounded-lg bg-muted/30">
            <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border-2">
              <div className="text-center p-4">
                <QrCode className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Scan with mobile device
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  (QR generation available with library)
                </p>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground max-w-xs">
              Open this URL on a tablet, TV, or second monitor
            </p>
          </div>

          {/* URL Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Display URL</label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-xs break-all">
                {displayUrl}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Display ID */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Display ID</label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
                {displayId}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyId}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status */}
          {currentDisplayId ? (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-500/30">
                Connected
              </Badge>
              <span className="text-sm text-muted-foreground">
                Display is currently linked
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-muted/50 border rounded-lg">
              <Badge variant="outline">
                Not Linked
              </Badge>
              <span className="text-sm text-muted-foreground">
                Click "Link Display" to connect
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {currentDisplayId ? (
            <Button
              variant="destructive"
              onClick={handleUnlink}
              className="flex-1"
            >
              <Unlink className="h-4 w-4 mr-2" />
              Unlink Display
            </Button>
          ) : (
            <Button
              onClick={handleLink}
              className="flex-1"
              disabled={!canLinkDisplay}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Link Display
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
