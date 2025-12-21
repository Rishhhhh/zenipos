import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageIcon, Tag, Plus } from "lucide-react";
import type { CartItem } from "@/lib/store/cart";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EightySixBadge } from "@/components/ui/eighty-six-badge";
import { useEightySixItems } from "@/hooks/useEightySixItems";
import { useCallback, useMemo } from "react";
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { getGridClasses } from '@/lib/utils/responsiveGrid';
import { cn } from '@/lib/utils';

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
  onOpenModifiers?: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  categoryId?: string;
}

export function ItemGrid({
  items,
  isLoading,
  onAddItem,
  onOpenModifiers,
  categoryId
}: ItemGridProps) {
  const queryClient = useQueryClient();
  
  // Fetch active promotions
  const {
    data: promotions
  } = useQuery({
    queryKey: ['promotions', 'active'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('promotions').select('*').eq('active', true);
      if (error) throw error;
      return data;
    },
    staleTime: 60000
  });

  // Device detection for responsive grid
  const { device } = useDeviceDetection();
  const gridClasses = getGridClasses('menuItems', device);

  // Check for 86'd items
  const {
    isEightySixed,
    getEightySixInfo
  } = useEightySixItems();

  // Fetch which items have modifiers (category-level)
  const { data: itemsWithModifiers } = useQuery({
    queryKey: ['items-with-modifiers'],
    queryFn: async () => {
      // Get all category IDs that have modifier groups
      const { data, error } = await supabase
        .from('category_modifier_groups')
        .select('category_id');
      
      if (error) throw error;
      
      // Return unique category IDs as a Set for O(1) lookup
      return new Set(data?.map(d => d.category_id) || []);
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  // PREFETCH: Load modifiers on hover for instant modal open
  const handleItemHover = useCallback((menuItemId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['category-modifiers', menuItemId],
      queryFn: async () => {
        const { data: item, error: itemError } = await supabase
          .from('menu_items')
          .select(`
            category_id,
            menu_categories!inner (
              category_modifier_groups (
                sort_order,
                modifier_groups (
                  id,
                  name,
                  min_selections,
                  max_selections,
                  modifiers (
                    id,
                    name,
                    price
                  )
                )
              )
            )
          `)
          .eq('id', menuItemId)
          .single();

        if (itemError) throw itemError;

        if (!item?.category_id || !item.menu_categories?.category_modifier_groups) {
          return [];
        }

        // Extract and flatten modifier groups
        const groups = item.menu_categories.category_modifier_groups
          .map((cmg: any) => cmg.modifier_groups)
          .filter((group: any) => group !== null);

        return groups || [];
      },
      staleTime: 10 * 60 * 1000, // 10 min cache
    });
  }, [queryClient]);

  // Filter items by category if specified - memoized to prevent re-renders
  const filteredItems = useMemo(() => items?.filter(item => !categoryId || item.category_id === categoryId) || [], [items, categoryId]);
  const hasActivePromos = promotions && promotions.length > 0;

  // Check if item has modifiers based on its category
  const hasModifiers = useCallback((categoryId: string | null) => {
    if (!categoryId || !itemsWithModifiers) return false;
    return itemsWithModifiers.has(categoryId);
  }, [itemsWithModifiers]);

  const handleItemClick = useCallback((item: MenuItem) => {
    onAddItem({
      menu_item_id: item.id,
      name: item.name,
      price: Number(item.price)
    });
  }, [onAddItem]);

  const handleModifierClick = useCallback((e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation(); // Prevent card click
    if (onOpenModifiers) {
      onOpenModifiers({
        menu_item_id: item.id,
        name: item.name,
        price: Number(item.price)
      });
    }
  }, [onOpenModifiers]);
  
  if (isLoading) {
    return <div className="h-full p-4">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Menu Items</h2>
        <div className={cn("grid", gridClasses, "gap-4")}>
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>;
  }
  if (filteredItems.length === 0) {
    return <div className="h-full p-4 flex items-center justify-center">
        <p className="text-muted-foreground">No items available in this category</p>
      </div>;
  }
  return <div className="h-full flex flex-col">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground">Menu Items</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className={cn("grid", gridClasses, "gap-4")}>
          {filteredItems.map(item => {
            const is86d = isEightySixed(item.id);
            const eightySixInfo = is86d ? getEightySixInfo(item.id) : null;
            const isAvailable = item.in_stock && !is86d;
            const itemHasModifiers = hasModifiers(item.category_id);
            
            return <Card 
              key={item.id} 
              className={`cursor-pointer hover:bg-accent transition-colors relative ${!isAvailable ? 'opacity-60 cursor-not-allowed' : ''}`} 
              onClick={() => isAvailable && handleItemClick(item)}
              onMouseEnter={() => isAvailable && handleItemHover(item.id)}
              title={is86d ? `86'd: ${eightySixInfo?.reason}` : ''}
            >
              {item.image_url ? (
                <picture>
                  <source 
                    type="image/webp" 
                    srcSet={(item as any).image_srcset_webp || undefined} 
                    sizes="(max-width: 768px) 50vw, 200px" 
                  />
                  <source 
                    type="image/jpeg" 
                    srcSet={(item as any).image_srcset_jpeg || undefined} 
                    sizes="(max-width: 768px) 50vw, 200px" 
                  />
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-full h-24 object-cover" 
                    loading="lazy"
                    decoding="async"
                    width="200"
                    height="96"
                  />
                </picture>
              ) : (
                <div className="w-full h-24 bg-muted flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              <div className="p-3 flex flex-col">
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
              
              {is86d && (
                <div className="absolute top-2 right-2">
                  <EightySixBadge size="sm" />
                </div>
              )}
              
              {!item.in_stock && !is86d && (
                <Badge variant="destructive" className="absolute top-2 right-2">
                  Unavailable
                </Badge>
              )}
              
              {isAvailable && hasActivePromos && (
                <Badge variant="default" className="absolute top-2 left-2 bg-success text-white">
                  <Tag className="h-3 w-3 mr-1" />
                  Promo
                </Badge>
              )}

              {/* Add-ons button - only show for items with modifiers */}
              {isAvailable && itemHasModifiers && onOpenModifiers && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-2 right-2 h-8 w-8 rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={(e) => handleModifierClick(e, item)}
                  title="Add with modifiers"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </Card>;
          })}
        </div>
      </div>
    </div>;
}