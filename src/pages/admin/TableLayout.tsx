import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function TableLayout() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('label');
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (table: any) => {
      const { error } = await supabase
        .from('tables')
        .insert(table);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast({ title: 'Table added successfully' });
      setDialogOpen(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('tables')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast({ title: 'Table status updated' });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    saveMutation.mutate({
      label: formData.get('label'),
      seats: parseInt(formData.get('seats') as string),
      status: 'available',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-success/20 text-success border-success/30';
      case 'occupied':
        return 'bg-danger/20 text-danger border-danger/30';
      case 'reserved':
        return 'bg-warning/20 text-warning border-warning/30';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="kiosk-layout p-8 pb-32 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Table Layout Manager</h1>
            <p className="text-muted-foreground mt-2">Manage restaurant tables and seating</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="label">Table Number/Label*</Label>
                  <Input
                    id="label"
                    name="label"
                    placeholder="e.g., Table 1, T-01, A1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="seats">Number of Seats*</Label>
                  <Input
                    id="seats"
                    name="seats"
                    type="number"
                    min="1"
                    max="20"
                    defaultValue="4"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Adding...' : 'Add Table'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p>Loading tables...</p>
        ) : tables?.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No tables found. Add your first table to get started.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables?.map((table) => (
              <Card
                key={table.id}
                className={`p-6 cursor-pointer transition-all hover:scale-105 ${getStatusColor(table.status)}`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">{table.label}</div>
                  <div className="flex items-center justify-center gap-1 text-sm mb-3">
                    <Users className="h-4 w-4" />
                    <span>{table.seats} seats</span>
                  </div>
                  <Badge className="capitalize mb-3">{table.status}</Badge>
                  <div className="space-y-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => updateStatusMutation.mutate({ id: table.id, status: 'available' })}
                    >
                      Available
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => updateStatusMutation.mutate({ id: table.id, status: 'occupied' })}
                    >
                      Occupied
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => updateStatusMutation.mutate({ id: table.id, status: 'reserved' })}
                    >
                      Reserved
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
