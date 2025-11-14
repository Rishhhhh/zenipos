import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useBranch } from '@/contexts/BranchContext';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface RecipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem?: any;
}

interface RecipeIngredient {
  inventory_item_id: string;
  quantity_per_serving: number;
  tempId: string;
}

export function RecipeModal({ open, onOpenChange, menuItem }: RecipeModalProps) {
  const { toast } = useToast();
  const { currentBranch } = useBranch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory-items-for-recipe', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!currentBranch?.id && open,
  });

  const { data: existingRecipes } = useQuery({
    queryKey: ['menu-item-recipes', menuItem?.id],
    queryFn: async () => {
      if (!menuItem?.id) return [];
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('menu_item_id', menuItem.id);
      if (error) throw error;
      return data;
    },
    enabled: !!menuItem?.id && open,
  });

  useEffect(() => {
    if (existingRecipes && existingRecipes.length > 0) {
      setIngredients(existingRecipes.map((r: any) => ({
        inventory_item_id: r.inventory_item_id,
        quantity_per_serving: r.quantity_per_serving,
        tempId: r.id,
      })));
    } else {
      setIngredients([]);
    }
  }, [existingRecipes, open]);

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        inventory_item_id: '',
        quantity_per_serving: 0,
        tempId: `temp-${Date.now()}`,
      },
    ]);
  };

  const removeIngredient = (tempId: string) => {
    setIngredients(ingredients.filter(i => i.tempId !== tempId));
  };

  const updateIngredient = (tempId: string, field: keyof RecipeIngredient, value: any) => {
    setIngredients(ingredients.map(i => 
      i.tempId === tempId ? { ...i, [field]: value } : i
    ));
  };

  const getIngredientCost = (ingredientId: string, quantity: number) => {
    const item = inventoryItems?.find(i => i.id === ingredientId);
    if (!item) return 0;
    return quantity * item.cost_per_unit;
  };

  const totalCost = ingredients.reduce((sum, ing) => 
    sum + getIngredientCost(ing.inventory_item_id, ing.quantity_per_serving), 0
  );

  const grossMargin = menuItem?.price > 0 ? ((menuItem.price - totalCost) / menuItem.price * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuItem?.id) return;

    const validIngredients = ingredients.filter(i => 
      i.inventory_item_id && i.quantity_per_serving > 0
    );

    if (validIngredients.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please add at least one ingredient with quantity',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await supabase
        .from('recipes')
        .delete()
        .eq('menu_item_id', menuItem.id);

      const recipesToInsert = validIngredients.map(ing => ({
        menu_item_id: menuItem.id,
        inventory_item_id: ing.inventory_item_id,
        quantity_per_serving: ing.quantity_per_serving,
      }));

      const { error } = await supabase
        .from('recipes')
        .insert(recipesToInsert);

      if (error) throw error;

      toast({
        title: 'Recipe Saved',
        description: `Recipe for ${menuItem.name} has been updated successfully`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!menuItem) return null;

  return (
    <GlassModal 
      open={open} 
      onOpenChange={onOpenChange}
      title={`Recipe: ${menuItem.name}`}
      size="lg"
      variant="default"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-4 bg-muted">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Menu Item Price</p>
              <p className="text-xl font-bold">RM {menuItem.price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Recipe Cost</p>
              <p className="text-xl font-bold">RM {totalCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gross Margin</p>
              <p className={`text-xl font-bold ${
                grossMargin >= 60 ? 'text-success' : 
                grossMargin >= 40 ? 'text-warning' : 'text-destructive'
              }`}>
                {grossMargin.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Profit per Item</p>
              <p className="text-xl font-bold">
                RM {(menuItem.price - totalCost).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Ingredients</Label>
            <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </div>

          {ingredients.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No ingredients added yet. Click "Add Ingredient" to start.
            </Card>
          ) : (
            ingredients.map((ingredient) => {
              const item = inventoryItems?.find(i => i.id === ingredient.inventory_item_id);
              const cost = getIngredientCost(ingredient.inventory_item_id, ingredient.quantity_per_serving);
              
              return (
                <Card key={ingredient.tempId} className="p-4">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <Label>Inventory Item</Label>
                      <Select
                        value={ingredient.inventory_item_id}
                        onValueChange={(val) => updateIngredient(ingredient.tempId, 'inventory_item_id', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems?.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} ({item.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label>Quantity per Serving</Label>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={ingredient.quantity_per_serving}
                        onChange={(e) => updateIngredient(ingredient.tempId, 'quantity_per_serving', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Cost</Label>
                      <div className="flex items-center h-10 px-3 rounded-md bg-muted text-sm">
                        RM {cost.toFixed(2)}
                        {item && <span className="ml-2 text-muted-foreground">/ {item.unit}</span>}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredient(ingredient.tempId)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || ingredients.length === 0}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Recipe
          </Button>
        </div>
      </form>
    </GlassModal>
  );
}
