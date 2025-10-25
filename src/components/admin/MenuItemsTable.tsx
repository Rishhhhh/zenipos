import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Archive, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className={item.archived ? 'opacity-50' : ''}>
              <TableCell>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {item.sku || '-'}
              </TableCell>
              <TableCell>RM {Number(item.price).toFixed(2)}</TableCell>
              <TableCell className="text-muted-foreground">
                {item.cost ? `RM ${Number(item.cost).toFixed(2)}` : '-'}
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
