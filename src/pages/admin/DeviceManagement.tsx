import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash, TestTube, Activity } from "lucide-react";
import { Tablet, Monitor, Printer, CreditCard, Nfc, MonitorSmartphone } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Device {
  id: string;
  name: string;
  role: string;
  ip_address?: string;
  mac_address?: string;
  station_id?: string;
  status: 'online' | 'offline' | 'error';
  device_capabilities: any;
  health_check_interval: number;
  last_seen: string;
  stations?: { name: string; color: string };
}

const DeviceCard = ({ device, onEdit, onTest }: any) => {
  const statusColor = {
    online: 'default',
    offline: 'secondary',
    error: 'destructive'
  }[device.status];
  
  const roleIcons: any = {
    'POS': Tablet,
    'KDS': Monitor,
    'PRINTER': Printer,
    'CARD_READER': CreditCard,
    'NFC_SCANNER': Nfc,
    'CUSTOMER_DISPLAY': MonitorSmartphone
  };
  
  const Icon = roleIcons[device.role] || Monitor;
  
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
        <Badge variant={statusColor as any}>{device.status}</Badge>
      </div>
      
      <div className="space-y-2 text-sm mb-3">
        {device.ip_address && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">IP:</span>
            <span className="font-mono">{device.ip_address}</span>
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
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
          <Edit className="h-4 w-4 mr-1" />
          Configure
        </Button>
        {device.role === 'PRINTER' && (
          <Button variant="outline" size="sm" onClick={onTest}>
            <TestTube className="h-4 w-4 mr-1" />
            Test
          </Button>
        )}
      </div>
    </Card>
  );
};

const DeviceModal = ({ device, open, onClose, onSave }: any) => {
  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('stations')
        .select('*')
        .eq('active', true);
      return data;
    }
  });

  const form = useForm({
    defaultValues: device || {
      name: '',
      role: 'PRINTER',
      ip_address: '',
      mac_address: '',
      station_id: '',
      status: 'offline',
      health_check_interval: 60,
      device_capabilities: {}
    }
  });
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
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
                  <FormLabel>IP Address</FormLabel>
                  <FormControl>
                    <Input placeholder="192.168.1.100" {...field} />
                  </FormControl>
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
  const testPrint = useMutation({
    mutationFn: async () => {
      // TODO: Implement actual print test
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Test print sent successfully');
    },
    onError: (error: any) => {
      toast.error(`Test print failed: ${error.message}`);
    }
  });
  
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
              A test page will be printed to verify connectivity and configuration.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => testPrint.mutate()} 
            disabled={testPrint.isPending}
            className="w-full"
          >
            {testPrint.isPending ? 'Printing...' : 'Send Test Print'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function DeviceManagement() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [testPrintDevice, setTestPrintDevice] = useState<Device | null>(null);

  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devices')
        .select('*, stations(name, color)')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const saveDevice = useMutation({
    mutationFn: async (device: any) => {
      if (device.id) {
        const { error } = await supabase
          .from('devices')
          .update(device)
          .eq('id', device.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('devices')
          .insert(device);
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

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Device Management</h1>
          <p className="text-muted-foreground">
            Manage POS terminals, KDS displays, printers, and peripherals
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices?.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onEdit={() => {
              setEditingDevice(device as Device);
              setModalOpen(true);
            }}
            onTest={() => setTestPrintDevice(device as Device)}
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
