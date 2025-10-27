import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ReceiptTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['receipt_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receipt_templates')
        .select('*')
        .order('type');
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (template: any) => {
      if (template.id) {
        const { error } = await supabase
          .from('receipt_templates')
          .update(template)
          .eq('id', template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('receipt_templates')
          .insert(template);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt_templates'] });
      toast({ title: 'Template saved successfully' });
      setDialogOpen(false);
      setEditingTemplate(null);
    },
  });

  const activateMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      // Deactivate all templates of this type first
      await supabase
        .from('receipt_templates')
        .update({ active: false })
        .eq('type', type);
      
      // Activate selected template
      const { error } = await supabase
        .from('receipt_templates')
        .update({ active: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt_templates'] });
      toast({ title: 'Template activated' });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    saveMutation.mutate({
      id: editingTemplate?.id,
      name: formData.get('name'),
      type: formData.get('type'),
      width_mm: parseInt(formData.get('width_mm') as string),
      template: formData.get('template'),
      active: false,
    });
  };

  const templateExample = `===================================
{restaurant_name}
{restaurant_address}
Tel: {restaurant_phone}
===================================

Order #{order_number}
Date: {date} Time: {time}
Server: {server_name}
Table: {table_number}

-----------------------------------
ITEMS
-----------------------------------
{items_list}

-----------------------------------
Subtotal:              ${'{subtotal}'}
Tax:                   ${'{tax}'}
Discount:              ${'{discount}'}
-----------------------------------
TOTAL:                 ${'{total}'}
-----------------------------------

Payment: {payment_method}
Change:  ${'{change}'}

Thank you for dining with us!
Visit us again soon!

===================================`;

  return (
    <div className="kiosk-layout p-8 pb-32 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Receipt Templates</h1>
            <p className="text-muted-foreground mt-2">Design and manage receipt layouts</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTemplate(null)}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Receipt Template'}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[75vh]">
                <form onSubmit={handleSubmit} className="space-y-4 px-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Template Name*</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g., Standard Receipt"
                        defaultValue={editingTemplate?.name}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type*</Label>
                      <Select name="type" defaultValue={editingTemplate?.type || 'customer'} required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer Receipt</SelectItem>
                          <SelectItem value="kitchen">Kitchen Ticket</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="width_mm">Paper Width (mm)*</Label>
                    <Select name="width_mm" defaultValue={editingTemplate?.width_mm?.toString() || '80'} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="58">58mm (Small)</SelectItem>
                        <SelectItem value="80">80mm (Standard)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="template">Template Content*</Label>
                    <Textarea
                      id="template"
                      name="template"
                      placeholder={templateExample}
                      defaultValue={editingTemplate?.template || templateExample}
                      rows={20}
                      className="font-mono text-xs"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Available variables: {'{restaurant_name}'}, {'{order_number}'}, {'{date}'}, {'{time}'}, 
                      {'{server_name}'}, {'{table_number}'}, {'{items_list}'}, {'{subtotal}'}, {'{tax}'}, 
                      {'{discount}'}, {'{total}'}, {'{payment_method}'}, {'{change}'}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? 'Saving...' : 'Save Template'}
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <p>Loading templates...</p>
          ) : templates?.length === 0 ? (
            <Card className="p-8 col-span-full text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No templates found. Create your first receipt template.</p>
            </Card>
          ) : (
            templates?.map((template) => (
              <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{template.name}</h3>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="capitalize">{template.type}</Badge>
                      <Badge variant="outline">{template.width_mm}mm</Badge>
                      {template.active && (
                        <Badge className="bg-success text-white">Active</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-muted p-3 rounded text-xs font-mono mb-4 max-h-32 overflow-auto">
                  {template.template.substring(0, 200)}...
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditingTemplate(template);
                      setDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  {!template.active && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => activateMutation.mutate({ id: template.id, type: template.type })}
                    >
                      Activate
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
