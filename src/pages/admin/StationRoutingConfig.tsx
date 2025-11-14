import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Trash, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function StationRoutingConfig() {
  const { stationId } = useParams();
  const queryClient = useQueryClient();
  const [prepTimes, setPrepTimes] = useState<Record<string, number>>({});

  const { data: station } = useQuery({
    queryKey: ['stations', stationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('id', stationId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: routingRules } = useQuery({
    queryKey: ['routing-rules', stationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('station_routing_rules')
        .select(`
          *,
          menu_items(id, name, category:menu_categories(name)),
          menu_categories(id, name)
        `)
        .eq('station_id', stationId);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: menuItems } = useQuery({
    queryKey: ['menu_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, category:menu_categories(name)')
        .eq('archived', false);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['menu_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const assignItem = useMutation({
    mutationFn: async ({ menuItemId, categoryId }: any) => {
      const { error } = await supabase
        .from('station_routing_rules')
        .upsert({
          station_id: stationId,
          menu_item_id: menuItemId,
          category_id: categoryId,
          prep_time_minutes: prepTimes[menuItemId || categoryId] || 5,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routing-rules', stationId] });
      toast.success('Routing rule added');
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from('station_routing_rules')
        .delete()
        .eq('id', ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routing-rules', stationId] });
      toast.success('Routing rule removed');
    }
  });

  const assignedItemIds = new Set(
    routingRules?.filter(r => r.menu_item_id).map(r => r.menu_item_id)
  );
  const assignedCategoryIds = new Set(
    routingRules?.filter(r => r.category_id).map(r => r.category_id)
  );

  const availableItems = menuItems?.filter(item => !assignedItemIds.has(item.id));
  const availableCategories = categories?.filter(cat => !assignedCategoryIds.has(cat.id));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          Station Routing: {station?.name}
        </h1>
        <p className="text-muted-foreground">
          Configure which menu items and categories route to this station
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Available Items */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Available to Assign</h3>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Categories (bulk assign)</h4>
            <ScrollArea className="h-[200px]">
              {availableCategories?.map(category => (
                <div
                  key={category.id}
                  className="p-3 mb-2 border rounded-lg flex items-center justify-between hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">Category</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => assignItem.mutate({ categoryId: category.id })}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Individual Items</h4>
            <ScrollArea className="h-[400px]">
              {availableItems?.map(item => (
                <div
                  key={item.id}
                  className="p-3 mb-2 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.category.name}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => assignItem.mutate({ menuItemId: item.id })}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Prep time (min)"
                      min="1"
                      className="h-8"
                      onChange={(e) => setPrepTimes({
                        ...prepTimes,
                        [item.id]: parseInt(e.target.value) || 5
                      })}
                    />
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </Card>
        
        {/* Right: Assigned to Station */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">
            Assigned to {station?.name}
          </h3>
          <ScrollArea className="h-[680px]">
            {routingRules?.map(rule => (
              <div key={rule.id} className="p-3 mb-2 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {rule.menu_items?.name || rule.menu_categories?.name}
                    </p>
                    {rule.category_id && (
                      <Badge variant="secondary" className="mt-1">
                        Entire Category
                      </Badge>
                    )}
                    <div className="mt-2">
                      <Badge variant="outline">
                        Prep: {rule.prep_time_minutes || 5}min
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRule.mutate(rule.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!routingRules || routingRules.length === 0) && (
              <div className="text-center text-muted-foreground py-8">
                No items assigned yet. Add items from the left panel.
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
