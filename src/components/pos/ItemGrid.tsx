import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CartItem } from "@/lib/store/cart";

interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  sku: string | null;
  price: number;
  in_stock: boolean;
}

interface ItemGridProps {
  items: MenuItem[] | undefined;
  isLoading: boolean;
  onAddItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  categoryId?: string;
}

export function ItemGrid({ items, isLoading, onAddItem, categoryId }: ItemGridProps) {
  const filteredItems = items?.filter(item => 
    !categoryId || item.category_id === categoryId
  ) || [];
  
  if (isLoading) {
    return (
      <div className="h-full p-4">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Menu Items</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Menu Items</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <Card
            key={item.id}
            className="p-4 cursor-pointer hover:bg-accent transition-colors touch-target flex flex-col h-32"
            onClick={() => onAddItem({
              menu_item_id: item.id,
              name: item.name,
              price: Number(item.price),
            })}
          >
            <h3 className="font-medium text-foreground line-clamp-2">{item.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{item.sku}</p>
            <p className="text-lg font-semibold text-primary mt-auto">
              ${Number(item.price).toFixed(2)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
