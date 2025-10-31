import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Conflict } from '@/lib/offline/conflictResolution';
import { AlertTriangle } from 'lucide-react';

interface ConflictResolutionModalProps {
  conflicts: Conflict<any>[];
  open: boolean;
  onResolve: (resolved: any[]) => void;
  onCancel: () => void;
}

export function ConflictResolutionModal({ conflicts, open, onResolve, onCancel }: ConflictResolutionModalProps) {
  const [resolutions, setResolutions] = useState<Map<string, 'local' | 'server'>>(new Map());

  const handleResolve = (conflictId: string, choice: 'local' | 'server') => {
    const newResolutions = new Map(resolutions);
    newResolutions.set(conflictId, choice);
    setResolutions(newResolutions);
  };

  const handleConfirm = () => {
    const resolved = conflicts.map(conflict => {
      const choice = resolutions.get(conflict.id);
      return choice === 'local' ? conflict.localVersion : conflict.serverVersion;
    });
    onResolve(resolved);
  };

  const allResolved = conflicts.every(conflict => resolutions.has(conflict.id));

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Sync Conflicts Detected
          </DialogTitle>
          <DialogDescription>
            {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} found. Please choose which version to keep.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {conflicts.map((conflict, index) => (
            <Card key={conflict.id} className="border-2">
              <CardHeader>
                <CardTitle className="text-base">
                  Conflict {index + 1}: {conflict.type}
                  <Badge variant="outline" className="ml-2">
                    ID: {conflict.id.substring(0, 8)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {/* Local Version */}
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      resolutions.get(conflict.id) === 'local'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleResolve(conflict.id, 'local')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Local Version</span>
                      <Badge variant="secondary">Your Device</Badge>
                    </div>
                    <pre className="text-xs overflow-auto max-h-32 bg-muted p-2 rounded">
                      {JSON.stringify(conflict.localVersion, null, 2)}
                    </pre>
                  </div>

                  {/* Server Version */}
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      resolutions.get(conflict.id) === 'server'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleResolve(conflict.id, 'server')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Server Version</span>
                      <Badge variant="secondary">Cloud</Badge>
                    </div>
                    <pre className="text-xs overflow-auto max-h-32 bg-muted p-2 rounded">
                      {JSON.stringify(conflict.serverVersion, null, 2)}
                    </pre>
                  </div>
                </div>

                {resolutions.has(conflict.id) && (
                  <Badge variant="default" className="w-full justify-center">
                    ✓ Resolved: {resolutions.get(conflict.id) === 'local' ? 'Local' : 'Server'} version selected
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!allResolved}>
            Confirm Resolutions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
