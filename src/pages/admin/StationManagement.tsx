import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash, Settings, MoreVertical } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBranch } from "@/contexts/BranchContext";
import { BranchSelector } from "@/components/branch/BranchSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

const StationCard = ({ station, onEdit, onDelete }: any) => {
  const navigate = useNavigate();
  
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="p-3 rounded-xl" 
          style={{ backgroundColor: `${station.color}20` }}
        >
          <div className="w-6 h-6" style={{ color: station.color }}>●</div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{station.name}</h3>
          <Badge variant="secondary">{station.type}</Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Devices:</span>
          <span className="font-medium">{station.device_count || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Capacity:</span>
          <span className="font-medium">{station.settings?.capacity || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Auto Print:</span>
          <span>{station.settings?.auto_print ? '✅' : '❌'}</span>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        className="w-full mt-3"
        onClick={() => navigate(`/admin/station-routing/${station.id}`)}
      >
        <Settings className="h-4 w-4 mr-2" />
        Configure Routing
      </Button>
    </Card>
  );
};

const StationModal = ({ station, open, onClose, onSave }: any) => {
  const form = useForm({
    defaultValues: station || {
      name: '',
      type: 'kitchen',
      color: '#8B5CF6',
      icon: 'utensils',
      settings: {
        capacity: 10,
        auto_print: true,
        auto_display: true
      },
      active: true
    }
  });
  
  const handleSave = (data: any) => {
    onSave(data);
  };
  
  const colorOptions = [
    { color: '#EF4444', name: 'Red' },
    { color: '#F59E0B', name: 'Orange' },
    { color: '#10B981', name: 'Green' },
    { color: '#3B82F6', name: 'Blue' },
    { color: '#8B5CF6', name: 'Purple' }
  ];
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {station ? 'Edit Station' : 'Create Station'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Station Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Kitchen" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="grill">Grill</SelectItem>
                      <SelectItem value="expo">Expo</SelectItem>
                      <SelectItem value="dessert">Dessert</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex gap-2">
                    {colorOptions.map(opt => (
                      <button
                        key={opt.color}
                        type="button"
                        className={`w-10 h-10 rounded-full border-2 ${
                          field.value === opt.color ? 'border-foreground' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: opt.color }}
                        onClick={() => field.onChange(opt.color)}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="settings.capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Capacity</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="settings.auto_print"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel>Auto Print</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel>Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={form.handleSubmit(handleSave)}>
              {station ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default function StationManagement() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const { currentBranch, branches } = useBranch();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);

  const { data: stations, isLoading } = useQuery({
    queryKey: ['stations', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      
      const { data, error } = await supabase
        .from('stations')
        .select(`
          *,
          station_devices(count)
        `)
        .eq('branch_id', currentBranch.id)
        .order('sort_order');
      
      if (error) throw error;
      
      return data.map((s: any) => ({
        ...s,
        device_count: s.station_devices?.[0]?.count || 0
      }));
    },
    enabled: !!currentBranch?.id
  });

  const createStation = useMutation({
    mutationFn: async (station: any) => {
      if (!organization?.id || !currentBranch?.id) {
        throw new Error('Organization and branch are required');
      }
      
      const { error } = await supabase
        .from('stations')
        .insert([{
          ...station,
          branch_id: currentBranch.id,
          organization_id: organization.id
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      toast.success('Station created');
      setModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to create station: ${error.message}`);
    }
  });

  const updateStation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from('stations')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      toast.success('Station updated');
      setModalOpen(false);
      setEditingStation(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to update station: ${error.message}`);
    }
  });

  const deleteStation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      toast.success('Station deleted');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete station: ${error.message}`);
    }
  });

  const handleSave = (data: any) => {
    if (editingStation) {
      updateStation.mutate({ id: editingStation.id, ...data });
    } else {
      createStation.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Station Management</h1>
          <p className="text-muted-foreground">
            Configure kitchen stations, drinks bar, expo, and more
          </p>
        </div>
        <Button onClick={() => {
          setEditingStation(null);
          setModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Station
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stations?.map((station: any) => (
          <StationCard
            key={station.id}
            station={station}
            onEdit={() => {
              setEditingStation(station);
              setModalOpen(true);
            }}
            onDelete={() => {
              if (confirm(`Delete ${station.name}?`)) {
                deleteStation.mutate(station.id);
              }
            }}
          />
        ))}
      </div>

      <StationModal
        station={editingStation}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingStation(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
