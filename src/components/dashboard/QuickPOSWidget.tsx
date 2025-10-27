import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCartStore } from "@/lib/store/cart";
import { ShoppingCart, Plus, Minus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

export function QuickPOSWidget() {
  const navigate = useNavigate();
  const { items, addItem, updateQuantity } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch categories
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

  // Fetch menu items
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
    <Card className="glass-card p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-base">Quick POS</h3>
        </div>
        {totalItems > 0 && (
          <Badge variant="default" className="bg-primary/20 text-primary">
            {totalItems}
          </Badge>
        )}
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-3">
        <TabsList className="grid w-full grid-cols-3 h-8">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          {categories?.slice(0, 2).map(cat => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs truncate">
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Menu Items Grid */}
      <div className="flex-1 overflow-y-auto mb-3 min-h-0">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-accent/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : menuItems && menuItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {menuItems.map((item) => {
              const quantity = getCartQuantity(item.id);
              return (
                <div
                  key={item.id}
                  className="p-2 bg-accent/30 hover:bg-accent/50 rounded-lg transition-all group relative"
                >
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-full text-left"
                  >
                    <p className="text-xs font-medium line-clamp-1 mb-1">
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-primary font-semibold">
                        RM {item.price.toFixed(2)}
                      </span>
                      {quantity === 0 ? (
                        <Plus className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <Badge variant="default" className="h-4 text-[10px] px-1">
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
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            No items available
          </div>
        )}
      </div>

      {/* Mini Cart Summary */}
      {totalItems > 0 && (
        <div className="p-2 bg-primary/10 rounded-lg mb-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cart: {totalItems} items</span>
            <span className="font-semibold text-primary">RM {totalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Checkout Button */}
      <Button
        onClick={() => {
          navigate("/pos");
          haptics.light();
        }}
        className="w-full h-9 text-sm"
        variant={totalItems > 0 ? "default" : "outline"}
      >
        {totalItems > 0 ? "Checkout" : "Open Full POS"}
        <ArrowRight className="ml-2 h-3 w-3" />
      </Button>
    </Card>
  );
}
