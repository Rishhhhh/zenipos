import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ManagerPinModal } from '@/components/pos/ManagerPinModal';
import { 
  getCashDrawerSettings, 
  setCashDrawerSettings, 
  kickCashDrawer, 
  listQzPrinters,
  getQzStatus,
  CashDrawerSettings,
  CommandProfile,
  PaperSize
} from '@/lib/hardware/cashDrawer';
import { 
  LockOpen, 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';

interface OpenCashDrawerButtonProps {
  variant?: 'icon' | 'button';
  className?: string;
}

export function OpenCashDrawerButton({ variant = 'button', className }: OpenCashDrawerButtonProps) {
  const { toast } = useToast();
  const { employee } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [settings, setSettings] = useState<CashDrawerSettings>(getCashDrawerSettings());
  const [printers, setPrinters] = useState<string[]>([]);
  const [qzStatus, setQzStatus] = useState<'connected' | 'disconnected' | 'unavailable'>('unavailable');
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  useEffect(() => {
    checkQzStatus();
  }, [showSettings]);

  const checkQzStatus = async () => {
    const status = await getQzStatus();
    setQzStatus(status);
  };

  const refreshPrinters = async () => {
    setIsLoadingPrinters(true);
    try {
      const list = await listQzPrinters();
      setPrinters(list);
      if (list.length === 0) {
        toast({
          title: 'No printers found',
          description: 'Make sure QZ Tray is running and printers are installed.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to load printers',
        description: 'Check QZ Tray connection.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPrinters(false);
      await checkQzStatus();
    }
  };

  const handleOpenDrawer = async () => {
    const currentSettings = getCashDrawerSettings();

    if (!currentSettings.enabled) {
      toast({
        title: 'Cash drawer disabled',
        description: 'Enable cash drawer in settings first.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentSettings.printerName) {
      setShowSettings(true);
      toast({
        title: 'Configure printer',
        description: 'Select a printer for the cash drawer.',
      });
      return;
    }

    // Check if manager PIN is required
    const isManagerOrOwner = employee?.role === 'owner' || employee?.role === 'manager';
    if (currentSettings.requireManagerPinForManualOpen && !isManagerOrOwner) {
      setShowPinModal(true);
      return;
    }

    await executeDrawerOpen();
  };

  const executeDrawerOpen = async () => {
    setIsOpening(true);
    try {
      const result = await kickCashDrawer('manual_open', { userId: employee?.id });
      if (result.success) {
        toast({
          title: 'Cash drawer opened',
          description: 'Drawer kick command sent successfully.',
        });
      } else {
        toast({
          title: 'Failed to open drawer',
          description: result.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } finally {
      setIsOpening(false);
    }
  };

  const handlePinSuccess = async () => {
    setShowPinModal(false);
    await executeDrawerOpen();
  };

  const handleSettingChange = <K extends keyof CashDrawerSettings>(
    key: K,
    value: CashDrawerSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setCashDrawerSettings(updated);
  };

  const handleTestDrawer = async () => {
    setDebugLogs([]); // Clear previous logs
    setIsOpening(true);
    try {
      const result = await kickCashDrawer(
        'test',
        { userId: employee?.id },
        (msg) => setDebugLogs(prev => [...prev, `${new Date().toISOString().substring(11, 23)} ${msg}`])
      );
      if (result.success) {
        toast({ 
          title: 'Test successful', 
          description: 'Check debug log below. If drawer didn\'t open, try a different Command Profile or Kick Mode.' 
        });
      } else {
        toast({ title: 'Test failed', description: result.error, variant: 'destructive' });
      }
      // Also add the final logs from result
      if (result.logs.length > 0) {
        setDebugLogs(result.logs);
      }
    } finally {
      setIsOpening(false);
    }
  };

  const StatusIcon = () => {
    switch (qzStatus) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const buttonContent = variant === 'icon' ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenDrawer}
            disabled={isOpening}
            className={className}
          >
            {isOpening ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LockOpen className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Open Drawer</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <Button
      variant="outline"
      onClick={handleOpenDrawer}
      disabled={isOpening}
      className={className}
    >
      {isOpening ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <LockOpen className="h-4 w-4 mr-2" />
      )}
      Open Drawer
    </Button>
  );

  return (
    <>
      <div className="flex items-center gap-1">
        {buttonContent}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cash Drawer Settings</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* QZ Status */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <StatusIcon />
                  <span className="text-sm font-medium">
                    QZ Tray: {qzStatus === 'connected' ? 'Connected' : qzStatus === 'disconnected' ? 'Disconnected' : 'Not Available'}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={checkQzStatus}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Troubleshooting Checklist */}
              {qzStatus !== 'connected' && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm space-y-1">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Setup Checklist:</p>
                  <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 space-y-0.5">
                    <li>Install QZ Tray on this POS laptop</li>
                    <li>Ensure receipt printer is installed in Windows</li>
                    <li>Enable unsigned requests in QZ Tray (dev mode)</li>
                    <li>Click "Refresh Printers" below</li>
                  </ul>
                </div>
              )}

              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled">Enable Cash Drawer</Label>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(v) => handleSettingChange('enabled', v)}
                />
              </div>

              {/* Printer Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Printer</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshPrinters}
                    disabled={isLoadingPrinters}
                  >
                    {isLoadingPrinters ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    )}
                    Refresh
                  </Button>
                </div>
                <Select
                  value={settings.printerName || ''}
                  onValueChange={(v) => handleSettingChange('printerName', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select printer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {printers.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Command Profile - NEW */}
              <div className="space-y-2">
                <Label>Command Profile</Label>
                <Select
                  value={settings.commandProfile}
                  onValueChange={(v) => handleSettingChange('commandProfile', v as CommandProfile)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">AUTO (Recommended)</SelectItem>
                    <SelectItem value="ESC_P">ESC/POS (ESC p)</SelectItem>
                    <SelectItem value="PULSE">Pulse (DLE DC4)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  AUTO tries both commands. If drawer doesn't open, try specific profiles.
                </p>
              </div>

              {/* Paper Size */}
              <div className="space-y-2">
                <Label>Paper Size</Label>
                <Select
                  value={settings.paperSize || '80mm'}
                  onValueChange={(v) => handleSettingChange('paperSize', v as PaperSize)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80mm">80mm (Standard)</SelectItem>
                    <SelectItem value="58mm">58mm (Narrow)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select 58mm if using narrow paper rolls on your 80mm printer.
                </p>
              </div>

              {/* Kick Mode */}
              <div className="space-y-2">
                <Label>Kick Mode (Pin)</Label>
                <Select
                  value={String(settings.kickMode)}
                  onValueChange={(v) => handleSettingChange('kickMode', Number(v) as 0 | 1)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Pin 0 (Most common)</SelectItem>
                    <SelectItem value="1">Pin 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pulse Times */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>t1 (pulse on)</Label>
                  <Input
                    type="number"
                    value={settings.t1}
                    onChange={(e) => handleSettingChange('t1', Number(e.target.value))}
                    min={1}
                    max={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label>t2 (pulse off)</Label>
                  <Input
                    type="number"
                    value={settings.t2}
                    onChange={(e) => handleSettingChange('t2', Number(e.target.value))}
                    min={1}
                    max={255}
                  />
                </div>
              </div>

              {/* Auto-open toggles */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoComplete" className="text-sm">Auto-open on payment complete</Label>
                  <Switch
                    id="autoComplete"
                    checked={settings.autoOpenOnCashCompleted}
                    onCheckedChange={(v) => handleSettingChange('autoOpenOnCashCompleted', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requirePin" className="text-sm">Require manager PIN for manual open</Label>
                  <Switch
                    id="requirePin"
                    checked={settings.requireManagerPinForManualOpen}
                    onCheckedChange={(v) => handleSettingChange('requireManagerPinForManualOpen', v)}
                  />
                </div>
              </div>

              {/* Test Button */}
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleTestDrawer}
                disabled={!settings.printerName || isOpening}
              >
                {isOpening ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LockOpen className="h-4 w-4 mr-2" />
                )}
                Test Drawer
              </Button>

              {/* Debug Panel */}
              {debugLogs.length > 0 && (
                <div className="mt-4 rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground">Debug Log</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2"
                      onClick={() => setDebugLogs([])}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <ScrollArea className="h-48">
                    <div className="p-3 bg-zinc-900 text-green-400 font-mono text-xs space-y-0.5">
                      {debugLogs.map((log, i) => (
                        <div key={i} className="whitespace-pre-wrap break-all">
                          {log}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Troubleshooting Tips */}
              {debugLogs.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs space-y-1">
                  <p className="font-medium text-blue-800 dark:text-blue-200">If drawer didn't open:</p>
                  <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-0.5">
                    <li>If "DRAWER TEST" line printed, printer communication works</li>
                    <li>Try switching "Command Profile" (AUTO → ESC/POS → Pulse)</li>
                    <li>Try switching "Kick Mode" (Pin 0 ↔ Pin 1)</li>
                    <li>Verify cash drawer cable is connected to printer DK port</li>
                  </ul>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ManagerPinModal
        open={showPinModal}
        onOpenChange={setShowPinModal}
        onSuccess={handlePinSuccess}
        action="open cash drawer"
      />
    </>
  );
}
