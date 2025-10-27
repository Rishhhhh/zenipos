import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCartStore } from "@/lib/store/cart";
import { ShoppingCart, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function QuickPOSWidget() {
  const navigate = useNavigate();
  const { items, addItem } = useCartStore();

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ["quick-pos-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("in_stock", true)
        .order("name")
        .limit(6);

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
    toast.success(`Added ${item.name} to cart`);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="glass-card p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Quick POS</h3>
        </div>
        {totalItems > 0 && (
          <Badge variant="default" className="bg-primary/20 text-primary">
            {totalItems} items
          </Badge>
        )}
      </div>

      {/* Menu Items Grid */}
      <div className="flex-1 overflow-y-auto mb-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-20 bg-accent/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : menuItems && menuItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleAddToCart(item)}
                className="p-3 bg-accent/30 hover:bg-accent/50 rounded-lg transition-all hover:scale-105 group text-left"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium line-clamp-1 flex-1">
                    {item.name}
                  </p>
                  <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" />
                </div>
                <p className="text-xs text-primary font-semibold">
                  RM {item.price.toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No items available
          </div>
        )}
      </div>

      {/* Go to POS Button */}
      <Button
        onClick={() => navigate("/pos")}
        className="w-full"
        variant="outline"
      >
        Open Full POS
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Card>
  );
}
