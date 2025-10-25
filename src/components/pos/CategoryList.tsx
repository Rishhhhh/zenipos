import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface CategoryListProps {
  categories: Category[] | undefined;
  isLoading: boolean;
  selectedCategoryId?: string;
  onSelectCategory: (categoryId: string | undefined) => void;
}

export function CategoryList({ 
  categories, 
  isLoading, 
  selectedCategoryId, 
  onSelectCategory 
}: CategoryListProps) {
  return (
    <div className="h-full bg-secondary/30 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Categories</h2>
      
      <Button
        variant={!selectedCategoryId ? "default" : "ghost"}
        className="w-full justify-start mb-2 touch-target"
        onClick={() => onSelectCategory(undefined)}
      >
        All Items
      </Button>
      
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {categories?.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategoryId === cat.id ? "default" : "ghost"}
              className="w-full justify-start touch-target"
              onClick={() => onSelectCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
