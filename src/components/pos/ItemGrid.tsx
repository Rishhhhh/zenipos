import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Tag } from "lucide-react";
import type { CartItem } from "@/lib/store/cart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EightySixBadge } from "@/components/ui/eighty-six-badge";
import { useEightySixItems } from "@/hooks/useEightySixItems";
import { memo, useCallback, useState, useEffect, useRef, useMemo } from "react";
import * as ReactWindow from "react-window";

const FixedSizeGrid = (ReactWindow as any).FixedSizeGrid;

// Custom hook for container dimensions using ResizeObserver
function useContainerDimensions() {
  const ref = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, ...dimensions };
}

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
  // Hook for container dimensions - must be at top before any returns
  const { ref, width, height } = useContainerDimensions();
  
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
  
  // Check for 86'd items
  const { isEightySixed, getEightySixInfo } = useEightySixItems();
  
  // Filter items by category if specified - memoized to prevent re-renders
  const filteredItems = useMemo(() => 
    items?.filter(item => !categoryId || item.category_id === categoryId) || [],
    [items, categoryId]
  );
  
  const hasActivePromos = promotions && promotions.length > 0;
  
  // Calculate grid dimensions
  const columnCount = Math.max(2, Math.floor(width / 220));
  const rowCount = Math.ceil(filteredItems.length / columnCount);
  
  const handleItemClick = useCallback((item: MenuItem) => {
    onAddItem({
      menu_item_id: item.id,
      name: item.name,
      price: Number(item.price),
    });
  }, [onAddItem]);
  
  const ItemCell = memo(({ columnIndex, rowIndex, style, data }: any) => {
    const { items, columnCount, onAddItem, isEightySixed, getEightySixInfo, hasActivePromos } = data;
    const index = rowIndex * columnCount + columnIndex;
    const item = items[index];
    
    if (!item) return null;

    const is86d = isEightySixed(item.id);
    const eightySixInfo = is86d ? getEightySixInfo(item.id) : null;
    const isAvailable = item.in_stock && !is86d;

    return (
      <div style={style} className="p-2">
        <Card
          className={`h-full cursor-pointer hover:bg-accent transition-colors touch-target flex flex-col overflow-hidden relative ${
            !isAvailable ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          onClick={() => isAvailable && onAddItem({
            menu_item_id: item.id,
            name: item.name,
            price: Number(item.price),
          })}
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
        </Card>
      </div>
    );
  }, (prev, next) => {
    const prevItem = prev.data.items[prev.rowIndex * prev.data.columnCount + prev.columnIndex];
    const nextItem = next.data.items[next.rowIndex * next.data.columnCount + next.columnIndex];
    if (!prevItem && !nextItem) return true;
    if (!prevItem || !nextItem) return false;
    return prevItem.id === nextItem.id && prevItem.price === nextItem.price && 
           prevItem.in_stock === nextItem.in_stock && prevItem.image_url === nextItem.image_url;
  });

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

  if (filteredItems.length === 0) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <p className="text-muted-foreground">No items available in this category</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground">Menu Items</h2>
      </div>
      <div ref={ref} className="flex-1">
        {width > 0 && height > 0 && FixedSizeGrid ? (
          <FixedSizeGrid
            columnCount={columnCount}
            columnWidth={width / columnCount}
            height={height}
            rowCount={rowCount}
            rowHeight={180}
            width={width}
            itemData={{
              items: filteredItems,
              columnCount,
              onAddItem,
              isEightySixed,
              getEightySixInfo,
              hasActivePromos,
            }}
            overscanRowCount={1}
          >
            {ItemCell}
          </FixedSizeGrid>
        ) : null}
      </div>
    </div>
  );
}
