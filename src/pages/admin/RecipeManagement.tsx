import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBranch } from '@/contexts/BranchContext';
import { BranchSelector } from '@/components/branch/BranchSelector';
import { RecipeModal } from '@/components/admin/RecipeModal';
import { ChefHat, Plus, ArrowLeft, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecipeManagement() {
  const { currentBranch, branches, isLoading: branchLoading, selectBranch, selectedBranchId, hasMultipleBranches } = useBranch();
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);

  const { data: menuItems, isLoading, refetch } = useQuery({
    queryKey: ['menu-items-recipes', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*, menu_categories(name)')
        .eq('branch_id', currentBranch.id)
        .order('name');
      
      if (itemsError) throw itemsError;

      const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select('menu_item_id, inventory_items(name, unit, cost_per_unit), quantity_per_serving')
        .in('menu_item_id', items?.map(i => i.id) || []);
      
      if (recipesError) throw recipesError;

      const recipeMap = recipes?.reduce((acc: any, r: any) => {
        if (!acc[r.menu_item_id]) {
          acc[r.menu_item_id] = [];
        }
        acc[r.menu_item_id].push(r);
        return acc;
      }, {});

      return items?.map(item => ({
        ...item,
        recipes: recipeMap?.[item.id] || [],
        recipeCost: recipeMap?.[item.id]?.reduce((sum: number, r: any) => 
          sum + (r.quantity_per_serving * (r.inventory_items?.cost_per_unit || 0)), 0) || 0,
      }));
    },
    enabled: !!currentBranch?.id,
  });

  const handleEditRecipe = (item: any) => {
    setSelectedMenuItem(item);
    setRecipeModalOpen(true);
  };

  const handleCloseModal = () => {
    setRecipeModalOpen(false);
    setSelectedMenuItem(null);
    refetch();
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 60) return 'text-success';
    if (margin >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Recipe Management</h1>
            <p className="text-muted-foreground">Configure ingredient recipes for menu items</p>
          </div>
          {hasMultipleBranches && (
            <BranchSelector 
              value={selectedBranchId}
              onChange={selectBranch}
              branches={branches}
              isLoading={branchLoading}
              showAll={false}
            />
          )}
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <Card className="p-8 text-center text-muted-foreground">
              Loading menu items...
            </Card>
          ) : menuItems?.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No menu items found in this branch
            </Card>
          ) : (
            menuItems?.map((item) => {
              const margin = item.price > 0 ? ((item.price - item.recipeCost) / item.price * 100) : 0;
              
              return (
                <Card key={item.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{item.name}</h3>
                        <Badge variant="outline">{item.menu_categories?.name}</Badge>
                        {item.recipes.length === 0 ? (
                          <Badge variant="destructive">No Recipe</Badge>
                        ) : (
                          <Badge variant="secondary">
                            <ChefHat className="h-3 w-3 mr-1" />
                            {item.recipes.length} ingredient{item.recipes.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm mt-4">
                        <div>
                          <p className="text-muted-foreground">Sell Price</p>
                          <p className="text-lg font-bold">RM {item.price.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Recipe Cost</p>
                          <p className="text-lg font-bold">RM {item.recipeCost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Gross Margin</p>
                          <p className={`text-lg font-bold ${getMarginColor(margin)}`}>
                            {margin.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Profit per Item</p>
                          <p className="text-lg font-bold">
                            RM {(item.price - item.recipeCost).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {item.recipes.length > 0 && (
                        <div className="mt-4 space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Ingredients:</p>
                          {item.recipes.map((recipe: any, idx: number) => (
                            <div key={idx} className="text-sm flex items-center gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>{recipe.inventory_items?.name}</span>
                              <span className="text-muted-foreground">
                                {recipe.quantity_per_serving} {recipe.inventory_items?.unit}
                              </span>
                              <span className="text-muted-foreground">
                                (RM {(recipe.quantity_per_serving * (recipe.inventory_items?.cost_per_unit || 0)).toFixed(2)})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={() => handleEditRecipe(item)}
                      variant={item.recipes.length === 0 ? 'default' : 'outline'}
                    >
                      {item.recipes.length === 0 ? (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Recipe
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Recipe
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <RecipeModal
          open={recipeModalOpen}
          onOpenChange={handleCloseModal}
          menuItem={selectedMenuItem}
        />
      </div>
    </div>
  );
}
