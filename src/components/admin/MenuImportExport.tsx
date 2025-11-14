import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';

interface MenuImportExportProps {
  categoryId?: string;
}

export function MenuImportExport({ categoryId }: MenuImportExportProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleExport = async () => {
    try {
      let query = supabase
        .from('menu_items')
        .select('name, sku, category_id, price, cost, tax_rate, description, in_stock, prep_time_minutes, archived, branch_id');
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Convert to CSV
      const headers = ['Name', 'SKU', 'Category ID', 'Price', 'Cost', 'Tax Rate', 'Description', 'In Stock', 'Prep Time Minutes', 'Archived'];
      const csvRows = [
        headers.join(','),
        ...data.map(item => [
          `"${item.name}"`,
          item.sku || '',
          item.category_id || '',
          item.price,
          item.cost || '',
          item.tax_rate || '',
          `"${(item.description || '').replace(/"/g, '""')}"`,
          item.in_stock,
          item.prep_time_minutes || '',
          item.archived || false,
        ].join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `menu-items-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export successful',
        description: `Exported ${data.length} items`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export',
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const rows = text.split('\n').slice(1); // Skip header
      
      // Get user's branch
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: employee } = await supabase
        .from('employees')
        .select('branch_id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (!employee?.branch_id) throw new Error('Branch not found');
      
      const items = rows
        .filter(row => row.trim())
        .map(row => {
          const cols = row.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
          return {
            name: cols[0]?.replace(/"/g, '') || '',
            sku: cols[1] || null,
            category_id: cols[2] || null,
            price: parseFloat(cols[3]) || 0,
            cost: cols[4] ? parseFloat(cols[4]) : null,
            tax_rate: cols[5] ? parseFloat(cols[5]) : null,
            description: cols[6]?.replace(/"/g, '') || null,
            in_stock: cols[7] === 'true',
            prep_time_minutes: cols[8] ? parseInt(cols[8]) : null,
            archived: cols[9] === 'true',
            branch_id: employee.branch_id,
          };
        });
      
      const { error } = await supabase.from('menu_items').insert(items);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({
        title: 'Import successful',
        description: `Imported ${items.length} items`,
      });
      setImportDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import',
      });
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </div>
      
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Menu Items</DialogTitle>
            <DialogDescription>
              Upload a CSV file with columns: Name, SKU, Category ID, Price, Cost, Tax Rate, Description, In Stock, Prep Time Minutes, Archived
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleImport}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
