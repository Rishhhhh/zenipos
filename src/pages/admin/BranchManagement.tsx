import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BranchManagement() {
  const [open, setOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*, organizations(name)')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      // Get first organization for this user
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      const { data, error } = await supabase
        .from('branches')
        .insert({ ...values, organization_id: org?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setOpen(false);
      toast({ title: 'Branch created successfully' });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: any) => {
      const { data, error } = await supabase
        .from('branches')
        .update(values)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setOpen(false);
      setEditingBranch(null);
      toast({ title: 'Branch updated successfully' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({ title: 'Branch deleted successfully' });
    },
  });

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Branch Management</h1>
          <p className="text-muted-foreground">Manage your restaurant locations</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBranch(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBranch ? 'Edit Branch' : 'New Branch'}
              </DialogTitle>
            </DialogHeader>
            <BranchForm
              branch={editingBranch}
              onSubmit={(values) => {
                if (editingBranch) {
                  updateMutation.mutate({ id: editingBranch.id, ...values });
                } else {
                  createMutation.mutate(values);
                }
              }}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card className="p-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 mb-2" />)}
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches?.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-primary" />
                      {branch.name}
                    </div>
                  </TableCell>
                  <TableCell>{branch.code || '-'}</TableCell>
                  <TableCell>{branch.address || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={branch.active ? 'default' : 'secondary'}>
                      {branch.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingBranch(branch);
                          setOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this branch?')) {
                            deleteMutation.mutate(branch.id);
                          }
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function BranchForm({ branch, onSubmit, isSubmitting }: any) {
  const [values, setValues] = useState({
    name: branch?.name || '',
    code: branch?.code || '',
    address: branch?.address || '',
    phone: branch?.phone || '',
    active: branch?.active ?? true,
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(values);
    }} className="space-y-4">
      <div>
        <Label htmlFor="name">Branch Name *</Label>
        <Input
          id="name"
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          value={values.code}
          onChange={(e) => setValues({ ...values, code: e.target.value })}
          placeholder="e.g., KL01"
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={values.address}
          onChange={(e) => setValues({ ...values, address: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={values.phone}
          onChange={(e) => setValues({ ...values, phone: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Branch'}
      </Button>
    </form>
  );
}
