import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive, ImageIcon, Trash2, Copy, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface MenuItem {
  id: string;
  name: string;
  sku: string | null;
  category_id: string | null;
  station_id: string | null;
  price: number;
  cost: number | null;
  image_url: string | null;
  in_stock: boolean;
  archived: boolean;
}

interface MenuItemsTableProps {
  items: MenuItem[];
  onEditItem: (item: MenuItem) => void;
}

export function MenuItemsTable({ items, onEditItem }: MenuItemsTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [priceUpdateDialogOpen, setPriceUpdateDialogOpen] = useState(false);
  const [priceAdjustment, setPriceAdjustment] = useState({ type: 'percentage', value: 0 });

  // Fetch stations for bulk assignment
  const { data: stations = [] } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stations')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch categories for bulk assignment
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('id, name')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const handleToggleStock = async (item: MenuItem) => {
    setUpdatingId(item.id);
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ in_stock: !item.in_stock })
        .eq('id', item.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({
        title: 'Stock status updated',
        description: `${item.name} is now ${!item.in_stock ? 'available' : 'unavailable'}`,
      });
    } catch (error) {
      console.error('Toggle stock error:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update stock status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleArchive = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ archived: !item.archived })
        .eq('id', item.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({
        title: item.archived ? 'Item restored' : 'Item archived',
        description: `${item.name} has been ${item.archived ? 'restored' : 'archived'}`,
      });
    } catch (error) {
      console.error('Archive error:', error);
      toast({
        title: 'Action failed',
        description: 'Failed to archive/restore item',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', deletingItem.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({
        title: 'Item deleted',
        description: `${deletingItem.name} has been permanently deleted`,
      });
      setDeletingItem(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const handleBulkStationAssign = async (stationId: string) => {
    if (selectedItems.size === 0) return;

    try {
      const itemIds = Array.from(selectedItems);
      const { error } = await supabase
        .from('menu_items')
        .update({ station_id: stationId })
        .in('id', itemIds);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({
        title: 'Station assigned',
        description: `Assigned ${itemIds.length} item(s) to station`,
      });
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Bulk assign error:', error);
      toast({
        title: 'Assignment failed',
        description: 'Failed to assign station',
        variant: 'destructive',
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((item) => item.id)));
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleBulkArchive = async () => {
    if (selectedItems.size === 0) return;
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ archived: true })
        .in('id', Array.from(selectedItems));
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({ title: 'Items archived', description: `Archived ${selectedItems.size} item(s)` });
      setSelectedItems(new Set());
    } catch (error) {
      toast({ variant: 'destructive', title: 'Archive failed' });
    }
  };

  const handleBulkCategoryChange = async (categoryId: string) => {
    if (selectedItems.size === 0) return;
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ category_id: categoryId })
        .in('id', Array.from(selectedItems));
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({ title: 'Category updated', description: `Updated ${selectedItems.size} item(s)` });
      setSelectedItems(new Set());
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update failed' });
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (selectedItems.size === 0) return;
    try {
      const selectedItemsData = items.filter(item => selectedItems.has(item.id));
      for (const item of selectedItemsData) {
        const newPrice = priceAdjustment.type === 'percentage'
          ? item.price * (1 + priceAdjustment.value / 100)
          : item.price + priceAdjustment.value;
        await supabase.from('menu_items').update({ price: Math.max(0, parseFloat(newPrice.toFixed(2))) }).eq('id', item.id);
      }
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({ title: 'Prices updated', description: `Updated ${selectedItems.size} item(s)` });
      setSelectedItems(new Set());
      setPriceUpdateDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update failed' });
    }
  };

  const handleDuplicate = async (item: MenuItem) => {
    try {
      // Get user's branch_id from context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: employee } = await supabase
        .from('employees')
        .select('branch_id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (!employee?.branch_id) throw new Error('Branch not found');

      // Insert duplicate with all required fields
      const { error } = await supabase.from('menu_items').insert([{
        branch_id: employee.branch_id,
        name: `${item.name} (Copy)`,
        category_id: item.category_id,
        station_id: item.station_id,
        price: item.price,
        cost: item.cost,
        in_stock: item.in_stock,
        archived: false,
      }]);
      
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({ title: 'Item duplicated', description: 'Menu item has been duplicated successfully' });
    } catch (error) {
      console.error('Duplicate error:', error);
      toast({ variant: 'destructive', title: 'Duplication failed', description: error instanceof Error ? error.message : 'Failed to duplicate item' });
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No menu items found. Add your first item to get started.
      </div>
    );
  }

  const getStationName = (stationId: string | null) => {
    if (!stationId) return <Badge variant="destructive">No Station</Badge>;
    const station = stations.find((s) => s.id === stationId);
    return station ? <Badge variant="outline">{station.name}</Badge> : <Badge variant="secondary">Unknown</Badge>;
  };

  const renderRow = (item: MenuItem) => (
    <div className="flex items-center gap-4 p-4 border-b hover:bg-accent/50 transition-colors">
      {/* Checkbox */}
      <div className="flex-shrink-0">
        <Checkbox
          checked={selectedItems.has(item.id)}
          onCheckedChange={() => toggleItemSelection(item.id)}
          disabled={item.archived}
        />
      </div>

      {/* Image */}
      <div className="w-12 flex-shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-[150px]">
        <p className="font-medium">{item.name}</p>
      </div>

      {/* SKU */}
      <div className="flex-1 min-w-[100px] text-muted-foreground">
        {item.sku || '-'}
      </div>

      {/* Price */}
      <div className="flex-1 min-w-[100px]">
        RM {Number(item.price).toFixed(2)}
      </div>

      {/* Cost */}
      <div className="flex-1 min-w-[100px] text-muted-foreground">
        {item.cost ? `RM ${Number(item.cost).toFixed(2)}` : '-'}
      </div>

      {/* Station */}
      <div className="flex-1 min-w-[120px]">
        {getStationName(item.station_id)}
      </div>

      {/* Status */}
      <div className="flex-1 min-w-[180px]">
        <div className="flex items-center gap-2">
          <Switch
            checked={item.in_stock}
            onCheckedChange={() => handleToggleStock(item)}
            disabled={updatingId === item.id || item.archived}
          />
          <span className="text-sm">
            {item.in_stock ? (
              <Badge variant="default">Available</Badge>
            ) : (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </span>
          {item.archived && <Badge variant="secondary">Archived</Badge>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEditItem(item)}
          disabled={item.archived}
        >
          <Edit className="h-4 w-4" />
        </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDuplicate(item)}
                    disabled={item.archived}
                    title="Duplicate item"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleArchive(item)}
                    title={item.archived ? "Restore item" : "Archive item"}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeletingItem(item)}
          disabled={item.archived}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Bulk Actions Toolbar */}
      {selectedItems.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-accent rounded-lg flex-wrap">
          <span className="text-sm font-medium">{selectedItems.size} item(s) selected</span>
          <Select onValueChange={handleBulkStationAssign}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Assign station" /></SelectTrigger>
            <SelectContent>{stations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={handleBulkCategoryChange}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Change category" /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleBulkArchive}><Archive className="h-4 w-4 mr-2" />Archive</Button>
          <Button variant="outline" size="sm" onClick={() => setPriceUpdateDialogOpen(true)}><DollarSign className="h-4 w-4 mr-2" />Update Prices</Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedItems(new Set())}>Clear</Button>
        </div>
      )}

      <div className="rounded-md border">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
          <div className="flex-shrink-0">
            <Checkbox
              checked={selectedItems.size === items.length && items.length > 0}
              onCheckedChange={handleSelectAll}
            />
          </div>
          <div className="w-12 flex-shrink-0">Image</div>
          <div className="flex-1 min-w-[150px]">Name</div>
          <div className="flex-1 min-w-[100px]">SKU</div>
          <div className="flex-1 min-w-[100px]">Price</div>
          <div className="flex-1 min-w-[100px]">Cost</div>
          <div className="flex-1 min-w-[120px]">Station</div>
          <div className="flex-1 min-w-[180px]">Status</div>
          <div className="w-32 text-right flex-shrink-0">Actions</div>
        </div>

        {/* Scrollable list */}
        <ScrollArea className="h-[600px]">
          <div>
            {items.map((item) => (
              <div key={item.id}>
                {renderRow(item)}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{deletingItem?.name}"? This action cannot be undone.
              Consider archiving instead if you want to keep the item's history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
