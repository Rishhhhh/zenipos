import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCartStore } from "@/lib/store/cart";
import { ShoppingCart, Plus, ArrowRight, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { QuickPOSConfig } from "@/types/widgetConfigs";
import { cn } from "@/lib/utils";

const GRID_COLS_MAP = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4'
} as const;

export default function QuickPOS() {
  const navigate = useNavigate();
  const { items, addItem } = useCartStore();
  const { config } = useWidgetConfig<QuickPOSConfig>('quick-pos');
  const [selectedCategory, setSelectedCategory] = useState<string>(config.defaultCategoryId || "all");
  
  const itemsPerRow = config.displayDensity === 'compact' ? 2 : 3;
  const imageHeight = config.displayDensity === 'compact' ? 'h-12' : 'h-16';

  const { data: categories } = useQuery({
    queryKey: ["menu-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ["quick-pos-items", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("menu_items")
        .select("*")
        .eq("in_stock", true)
        .order("name")
        .limit(8);

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleAddToCart = (item: any) => {
    addItem({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
    });
    toast.success(`Added ${item.name}`);
    haptics.medium();
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getCartQuantity = (itemId: string) => {
    const cartItem = items.find(i => i.menu_item_id === itemId);
    return cartItem?.quantity || 0;
  };

  return (
    <Card className="glass-card p-4 flex flex-col w-full h-full">
      <div className="flex items-center justify-end mb-3">
        {totalItems > 0 && (
          <Badge variant="default" className="bg-primary text-primary-foreground">
            {totalItems}
          </Badge>
        )}
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-3">
        <TabsList className="flex w-full gap-1 h-8">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          {categories?.slice(0, 2).map(cat => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs truncate">
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex-1 overflow-y-auto mb-3 min-h-0 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {isLoading ? (
          <div className={cn("grid gap-2", GRID_COLS_MAP[itemsPerRow])}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-accent/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : menuItems && menuItems.length > 0 ? (
          <div className={cn("grid gap-2", GRID_COLS_MAP[itemsPerRow])}>
            {menuItems.map((item) => {
              const quantity = getCartQuantity(item.id);
              const inStock = item.in_stock;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-3 rounded-lg transition-all group relative border",
                    inStock 
                      ? "bg-card hover:bg-accent/50 border-border/50 cursor-pointer" 
                      : "bg-muted/30 border-border/30 opacity-60"
                  )}
                >
                  <button
                    onClick={() => inStock && handleAddToCart(item)}
                    className="w-full text-left"
                    disabled={!inStock}
                  >
                    {config.showImages && item.image_url && (
                      <img src={item.image_url} alt={item.name} className={cn("w-full object-cover rounded mb-2", imageHeight)} />
                    )}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium line-clamp-2 flex-1">
                        {item.name}
                      </p>
                      {inStock && (
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary font-bold">
                        RM {item.price.toFixed(2)}
                      </span>
                      {quantity === 0 ? (
                        <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <Badge variant="default" className="h-5 text-xs px-2 bg-primary text-primary-foreground">
                          {quantity}
                        </Badge>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Utensils className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No items available</p>
          </div>
        )}
      </div>

      {totalItems > 0 && (
        <div className="p-3 bg-primary/10 rounded-lg mb-2 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Cart: {totalItems} items</span>
            </div>
            <span className="text-lg font-bold text-primary">RM {totalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

      <Button
        onClick={() => {
          navigate("/pos");
          haptics.light();
        }}
        className="w-full h-10"
        variant={totalItems > 0 ? "default" : "outline"}
        size="lg"
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        {totalItems > 0 ? `Checkout (${totalItems})` : "Open Full POS"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Card>
  );
}
