import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Tag } from "lucide-react";
import type { CartItem } from "@/lib/store/cart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  sku: string | null;
  price: number;
  in_stock: boolean;
  image_url: string | null;
  description: string | null;
}

interface ItemGridProps {
  items: MenuItem[] | undefined;
  isLoading: boolean;
  onAddItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  categoryId?: string;
}

export function ItemGrid({ items, isLoading, onAddItem, categoryId }: ItemGridProps) {
  // Fetch active promotions
  const { data: promotions } = useQuery({
    queryKey: ['promotions', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('active', true);
      if (error) throw error;
      return data;
    },
    staleTime: 60000,
  });
  
  const filteredItems = items?.filter(item => 
    !categoryId || item.category_id === categoryId
  ) || [];
  
  const hasActivePromos = promotions && promotions.length > 0;
  
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
            className={`p-0 cursor-pointer hover:bg-accent transition-colors touch-target flex flex-col h-40 overflow-hidden relative ${
              !item.in_stock ? 'opacity-60' : ''
            }`}
            onClick={() => {
              if (item.in_stock) {
                onAddItem({
                  menu_item_id: item.id,
                  name: item.name,
                  price: Number(item.price),
                });
              }
            }}
          >
            {/* Image */}
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-24 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-24 bg-muted flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            {/* Content */}
            <div className="p-3 flex flex-col flex-1">
              <h3 className="font-medium text-foreground text-sm line-clamp-1">{item.name}</h3>
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {item.description}
                </p>
              )}
              <p className="text-lg font-semibold text-primary mt-auto">
                RM {Number(item.price).toFixed(2)}
              </p>
            </div>

            {/* Status Badge */}
                  {!item.in_stock && (
                    <Badge variant="destructive" className="absolute top-2 right-2">
                      Unavailable
                    </Badge>
                  )}
                  {item.in_stock && hasActivePromos && (
                    <Badge variant="default" className="absolute top-2 left-2 bg-success text-white">
                      <Tag className="h-3 w-3 mr-1" />
                      Promo
                    </Badge>
                  )}
          </Card>
        ))}
      </div>
    </div>
  );
}
