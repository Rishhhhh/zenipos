import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { VirtualList } from '@/components/modals/VirtualList';

interface MenuItem {
  id: string;
  name: string;
  sku: string | null;
  category_id: string | null;
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

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No menu items found. Add your first item to get started.
      </div>
    );
  }

  const renderRow = (item: MenuItem) => (
    <div className="flex items-center gap-4 p-4 border-b hover:bg-accent/50 transition-colors">
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
          onClick={() => handleArchive(item)}
        >
          <Archive className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="rounded-md border">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
        <div className="w-12 flex-shrink-0">Image</div>
        <div className="flex-1 min-w-[150px]">Name</div>
        <div className="flex-1 min-w-[100px]">SKU</div>
        <div className="flex-1 min-w-[100px]">Price</div>
        <div className="flex-1 min-w-[100px]">Cost</div>
        <div className="flex-1 min-w-[180px]">Status</div>
        <div className="w-24 text-right flex-shrink-0">Actions</div>
      </div>

      {/* Virtual scrolling list */}
      <VirtualList
        items={items}
        rowHeight={80}
        maxHeight={600}
        renderRow={renderRow}
      />
    </div>
  );
}
