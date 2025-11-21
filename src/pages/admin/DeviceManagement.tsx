import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash, TestTube, Activity, Tablet, Monitor, Printer, CreditCard, Nfc, MonitorSmartphone, Settings, RefreshCw, Loader2, Info, Route } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBranch } from "@/contexts/BranchContext";
import { Link } from "react-router-dom";
import { BranchSelector } from "@/components/branch/BranchSelector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Device {
  id: string;
  name: string;
  role: string;
  branch_id: string;
  ip_address?: string;
  mac_address?: string;
  station_id?: string;
  status: 'online' | 'offline' | 'error';
  device_capabilities: any;
  health_check_interval: number;
  last_seen: string;
  stations?: { name: string; color: string };
}

const DeviceCard = ({ device, onEdit, onTest, onDelete, onReconnect, reconnecting, printerStatus }: any) => {
  const statusColor = {
    online: 'default',
    offline: 'secondary',
    error: 'destructive'
  }[device.status];
  
  // Printer-specific status indicators
  const printerStatusConfig = {
    ready: { color: 'default', icon: '🟢', label: 'Ready' },
    idle: { color: 'secondary', icon: '🟡', label: 'Idle' },
    offline: { color: 'destructive', icon: '🔴', label: 'Offline' },
    unknown: { color: 'secondary', icon: '⚪', label: 'Unknown' }
  };
  
  const roleIcons: any = {
    'POS': Tablet,
    'KDS': Monitor,
    'PRINTER': Printer,
    'CARD_READER': CreditCard,
    'NFC_SCANNER': Nfc,
    'CUSTOMER_DISPLAY': MonitorSmartphone
  };
  
  const Icon = roleIcons[device.role] || Monitor;
  const isPrinter = device.role === 'PRINTER';
  const statusInfo = isPrinter && printerStatus ? printerStatusConfig[printerStatus.status] : null;
  
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{device.name}</h3>
            <p className="text-sm text-muted-foreground">
              {device.role.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <Badge variant={statusColor as any}>{device.status}</Badge>
          {statusInfo && (
            <Badge variant={statusInfo.color as any} className="text-xs">
              {statusInfo.icon} {statusInfo.label}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="space-y-2 text-sm mb-3">
        {device.ip_address && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">IP:</span>
            <span className="font-mono">{device.ip_address}</span>
          </div>
        )}
        {device.device_capabilities?.system_printer_name && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Printer:</span>
            <span className="font-mono text-xs">{device.device_capabilities.system_printer_name}</span>
          </div>
        )}
        {device.stations && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Station:</span>
            <Badge 
              variant="outline" 
              style={{ borderColor: device.stations.color }}
            >
              {device.stations.name}
            </Badge>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last Seen:</span>
          <span>{formatDistanceToNow(new Date(device.last_seen))} ago</span>
        </div>
        {isPrinter && printerStatus?.lastSeen && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Print:</span>
            <span className="text-xs">{formatDistanceToNow(printerStatus.lastSeen)} ago</span>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
          <Edit className="h-4 w-4 mr-1" />
          Configure
        </Button>
        {device.role === 'PRINTER' && (
          <>
            <Button variant="outline" size="sm" onClick={onTest}>
              <TestTube className="h-4 w-4 mr-1" />
              Test
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReconnect}
              disabled={device.status === 'online' || reconnecting}
            >
              {reconnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Reconnecting
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reconnect
                </>
              )}
            </Button>
          </>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

const DeviceModal = ({ device, open, onClose, onSave }: any) => {
  const { currentBranch } = useBranch();
  
  const { data: stations } = useQuery({
    queryKey: ['stations', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      
      const { data } = await supabase
        .from('stations')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .eq('active', true);
      return data;
    },
    enabled: !!currentBranch?.id
  });

  const form = useForm({
    defaultValues: device || {
      name: '',
      role: 'PRINTER',
      ip_address: '',
      mac_address: '',
      station_id: '',
      branch_id: currentBranch?.id || '',
      status: 'offline',
      health_check_interval: 60,
      device_capabilities: { system_printer_name: '' }
    }
  });
  
  const isPrinter = form.watch('role') === 'PRINTER';
  
  const handleOpenPrinterSettings = () => {
    window.open('ms-settings:printers', '_blank');
    toast.info('Opening Windows printer settings...');
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {device ? 'Edit Device' : 'Add Device'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Kitchen Printer 1" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRINTER">Printer</SelectItem>
                      <SelectItem value="KDS">KDS Display</SelectItem>
                      <SelectItem value="POS">POS Terminal</SelectItem>
                      <SelectItem value="CARD_READER">Card Reader</SelectItem>
                      <SelectItem value="NFC_SCANNER">NFC Scanner</SelectItem>
                      <SelectItem value="CUSTOMER_DISPLAY">Customer Display</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="ip_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP Address {!isPrinter && '(Optional)'}</FormLabel>
                  <FormControl>
                    <Input placeholder="192.168.1.100" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Leave blank for Windows system printers
                  </p>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="station_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Station</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select station..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stations?.map(station => (
                        <SelectItem key={station.id} value={station.id}>
                          {station.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            {isPrinter && (
              <FormField
                control={form.control}
                name="device_capabilities.system_printer_name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Windows System Printer Name</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          placeholder="e.g., EPSON TM-T88V, HP LaserJet 1200" 
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="icon"
                        onClick={handleOpenPrinterSettings}
                        title="Open Windows Printer Settings"
                      >
                        <Activity className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter the exact printer name as shown in Windows Settings. Click the icon to open your system printer settings.
                    </p>
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="health_check_interval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Health Check Interval (seconds)</FormLabel>
                  <FormControl>
                    <Input type="number" min="30" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          {isPrinter && (
            <Alert className="mt-4">
              <Printer className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>💡 Printer Setup Guide:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Click the <Activity className="h-3 w-3 inline" /> icon above to open Windows Printer Settings</li>
                  <li>Find your printer and note its exact name</li>
                  <li>Enter that name in the "System Printer Name" field above</li>
                  <li>Save and use "Test Print" to verify</li>
                </ol>
                <p className="mt-2">The printer dialog will open when printing - select your printer there.</p>
              </AlertDescription>
            </Alert>
          )}
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={form.handleSubmit(onSave)}>
              {device ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const TestPrintModal = ({ device, open, onClose }: any) => {
  const [printerStatus, setPrinterStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load printer status when modal opens
  useEffect(() => {
    if (open && device) {
      loadPrinterStatus();
    }
  }, [open, device]);
  
  const loadPrinterStatus = async () => {
    setIsLoading(true);
    try {
      const { BrowserPrintService } = await import('@/lib/print/BrowserPrintService');
      const status = await BrowserPrintService.getPrinterStatus(device.id);
      setPrinterStatus(status);
    } catch (error) {
      console.error('Failed to load printer status:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const testPrint = useMutation({
    mutationFn: async () => {
      const { BrowserPrintService } = await import('@/lib/print/BrowserPrintService');
      
      const testData = {
        id: device.id,
        deviceName: device.name,
        role: device.role,
        station: device.stations?.name,
        ipAddress: device.ip_address,
        printerName: device.device_capabilities?.system_printer_name
      };
      
      const success = await BrowserPrintService.printTestPage(testData);
      if (!success) {
        throw new Error('Print dialog failed to open');
      }
      
      // Reload status after print
      await loadPrinterStatus();
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Test print sent! Select your printer in the dialog.');
    },
    onError: (error: any) => {
      toast.error(`Test print failed: ${error.message}`);
    }
  });
  
  const statusConfig = {
    ready: { color: 'bg-green-500', label: '🟢 Ready', description: 'Printer has printed recently' },
    idle: { color: 'bg-yellow-500', label: '🟡 Idle', description: 'No recent print activity' },
    offline: { color: 'bg-red-500', label: '🔴 Offline', description: 'Not seen recently or errors detected' },
    unknown: { color: 'bg-gray-500', label: '⚪ Unknown', description: 'No print history available' }
  };
  
  const currentStatus = printerStatus ? statusConfig[printerStatus.status] : null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test Print - {device?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <Printer className="h-4 w-4" />
            <AlertDescription>
              A test page will be printed using Windows print dialog. Make sure your printer is connected and powered on.
            </AlertDescription>
          </Alert>
          
          {/* Printer Status */}
          {!isLoading && currentStatus && (
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm">Printer Status</h4>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${currentStatus.color}`} />
                <span className="font-medium">{currentStatus.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{currentStatus.description}</p>
              
              {printerStatus.lastSeen && (
                <div className="text-xs text-muted-foreground">
                  Last print: {formatDistanceToNow(printerStatus.lastSeen)} ago
                </div>
              )}
              
              {printerStatus.lastError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription className="text-xs">
                    <strong>Last Error:</strong> {printerStatus.lastError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {/* Debug Info */}
          <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
            <h4 className="font-semibold text-sm">Connection Info</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Browser Print:</span>
                <span className="font-mono">✓ Available</span>
              </div>
              {device?.ip_address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network IP:</span>
                  <span className="font-mono">{device.ip_address}</span>
                </div>
              )}
              {device?.device_capabilities?.system_printer_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System Printer:</span>
                  <span className="font-mono text-xs">{device.device_capabilities.system_printer_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Device Type:</span>
                <span>Thermal Printer</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => testPrint.mutate()} 
            disabled={testPrint.isPending}
            className="w-full"
          >
            <Printer className="h-4 w-4 mr-2" />
            {testPrint.isPending ? 'Opening print dialog...' : 'Send Test Print'}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            The Windows print dialog will open. Select your printer and click Print.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function DeviceManagement() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const { currentBranch, hasMultipleBranches, branches, selectBranch } = useBranch();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [testPrintDevice, setTestPrintDevice] = useState<Device | null>(null);
  const [printerStatuses, setPrinterStatuses] = useState<Record<string, any>>({});
  const [reconnectingDevice, setReconnectingDevice] = useState<string | null>(null);

  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      
      const { data, error } = await supabase
        .from('devices')
        .select('*, stations(name, color)')
        .eq('branch_id', currentBranch.id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentBranch?.id
  });
  
  // Fetch printer statuses for all printer devices
  useEffect(() => {
    const loadPrinterStatuses = async () => {
      if (!devices) return;
      
      const printers = devices.filter(d => d.role === 'PRINTER');
      if (printers.length === 0) return;
      
      try {
        const { BrowserPrintService } = await import('@/lib/print/BrowserPrintService');
        const statuses: Record<string, any> = {};
        
        await Promise.all(
          printers.map(async (printer) => {
            const status = await BrowserPrintService.getPrinterStatus(printer.id);
            statuses[printer.id] = status;
          })
        );
        
        setPrinterStatuses(statuses);
      } catch (error) {
        console.error('Failed to load printer statuses:', error);
      }
    };
    
    loadPrinterStatuses();
  }, [devices]);
  
  // Auto-reconnect printers on page load
  useEffect(() => {
    const autoReconnectPrinters = async () => {
      if (!currentBranch?.id) return;
      
      console.log('🔄 Auto-reconnecting printers...');
      
      const { data: offlineDevices } = await supabase
        .from('devices')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .eq('role', 'PRINTER')
        .eq('status', 'offline');
      
      if (!offlineDevices || offlineDevices.length === 0) return;
      
      for (const device of offlineDevices) {
        try {
          // For browser-only printers (no IP), check if window.print exists
          if (!device.ip_address && typeof window.print === 'function') {
            await supabase
              .from('devices')
              .update({ status: 'online', last_seen: new Date().toISOString() })
              .eq('id', device.id);
            
            console.log(`✅ Auto-reconnected browser printer: ${device.name}`);
          }
        } catch (error) {
          console.error(`Failed to auto-reconnect ${device.name}:`, error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    };
    
    autoReconnectPrinters();
  }, [currentBranch?.id, queryClient]);

  const saveDevice = useMutation({
    mutationFn: async (device: any) => {
      if (!organization?.id) {
        throw new Error('Organization is required');
      }
      
      const deviceData = {
        ...device,
        organization_id: organization.id
      };
      
      if (device.id) {
        const { error } = await supabase
          .from('devices')
          .update(deviceData)
          .eq('id', device.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('devices')
          .insert([deviceData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success(editingDevice ? 'Device updated' : 'Device added');
      setModalOpen(false);
      setEditingDevice(null);
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const deleteDevice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete device: ${error.message}`);
    }
  });
  
  const handleReconnect = async (deviceId: string, deviceName: string) => {
    try {
      setReconnectingDevice(deviceId);
      
      // Attempt test print
      const { BrowserPrintService } = await import('@/lib/print/BrowserPrintService');
      await BrowserPrintService.printHTML(
        `<html><body><h1>Reconnect Test</h1><p>Device: ${deviceName}</p><p>Time: ${new Date().toLocaleString()}</p></body></html>`,
        deviceId,
        deviceName
      );
      
      // Update status to online
      await supabase
        .from('devices')
        .update({ status: 'online', last_seen: new Date().toISOString() })
        .eq('id', deviceId);
      
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      
      toast.success(`${deviceName} reconnected successfully`);
    } catch (error) {
      toast.error(`Failed to reconnect ${deviceName}`);
      console.error('Reconnect error:', error);
    } finally {
      setReconnectingDevice(null);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      {hasMultipleBranches && (
        <div className="mb-6">
          <BranchSelector 
            value={currentBranch?.id || null}
            onChange={selectBranch}
            branches={branches}
          />
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Device Management</h1>
          <p className="text-muted-foreground">
            {currentBranch?.name} - Manage POS terminals, KDS displays, printers, and peripherals
          </p>
        </div>
        <Button onClick={() => {
          setEditingDevice(null);
          setModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>
      
      {/* Printer Setup Guide */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>🖨️ Printing Setup Guide</AlertTitle>
        <AlertDescription className="space-y-2">
          <p className="text-sm"><strong>Step 1:</strong> Set up your Windows printer as default</p>
          <p className="text-sm"><strong>Step 2:</strong> Add printer device below (System Printer Name = exact Windows printer name)</p>
          <p className="text-sm"><strong>Step 3:</strong> Assign printer to a station in <Link to="/admin/stations" className="text-primary underline">Station Management</Link></p>
          <p className="text-sm"><strong>Step 4:</strong> Configure routing rules in <Link to="/admin/stations" className="text-primary underline">Station Management</Link></p>
          <p className="text-sm"><strong>Step 5:</strong> Use "Test Print" to verify connection</p>
          
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open('ms-settings:printers', '_blank');
                toast.info('Opening Windows printer settings...');
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Open Windows Printer Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to="/admin/stations">
                <Route className="h-4 w-4 mr-2" />
                Manage Stations & Routing
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices?.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            printerStatus={device.role === 'PRINTER' ? printerStatuses[device.id] : null}
            onEdit={() => {
              setEditingDevice(device as Device);
              setModalOpen(true);
            }}
            onTest={() => setTestPrintDevice(device as Device)}
            onReconnect={() => handleReconnect(device.id, device.name)}
            reconnecting={reconnectingDevice === device.id}
            onDelete={() => {
              if (confirm(`Delete device "${device.name}"? This action cannot be undone.`)) {
                deleteDevice.mutate(device.id);
              }
            }}
          />
        ))}
      </div>

      <DeviceModal
        device={editingDevice}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingDevice(null);
        }}
        onSave={(data: any) => saveDevice.mutate(data)}
      />

      <TestPrintModal
        device={testPrintDevice}
        open={!!testPrintDevice}
        onClose={() => setTestPrintDevice(null)}
      />
    </div>
  );
}
