import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useModalManager } from '@/hooks/useModalManager';
import { useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ArrowLeft } from 'lucide-react';
import { CategoryDragList } from '@/components/admin/CategoryDragList';
import { MenuItemsTable } from '@/components/admin/MenuItemsTable';
import { MenuImportExport } from '@/components/admin/MenuImportExport';
import { BulkImageGenerator } from '@/components/admin/BulkImageGenerator';
import { Link, useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { toast } from 'sonner';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

interface MenuItem {
  id: string;
  name: string;
  sku: string | null;
  category_id: string | null;
  station_id: string | null;
  price: number;
  cost: number | null;
  tax_rate: number | null;
  description: string | null;
  image_url: string | null;
  in_stock: boolean;
  archived: boolean;
}

export default function MenuManagement() {
  usePerformanceMonitor('MenuManagement');
  const navigate = useNavigate();
  const { openModal } = useModalManager();
  const { currentBranch, isReady, isLoading: branchLoading, error: branchError } = useBranch();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch menu items with station info
  const { data: menuItems = [], isLoading: itemsLoading, refetch: refetchItems } = useQuery({
    queryKey: ['menuItems', selectedCategoryId, debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('archived', false);

      if (selectedCategoryId) {
        query = query.eq('category_id', selectedCategoryId);
      }

      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,sku.ilike.%${debouncedSearch}%`);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data as MenuItem[];
    },
  });

  const handleEditItem = (item: MenuItem) => {
    openModal('menuItem', {
      item,
      categoryId: selectedCategoryId,
      categories,
    });
  };

  const handleAddItem = () => {
    openModal('menuItem', {
      categoryId: selectedCategoryId,
      categories,
    });
  };

  const handleAddCategory = async () => {
    const maxSortOrder = categories.reduce(
      (max, cat) => Math.max(max, cat.sort_order),
      0
    );

    openModal('categoryEdit', {
      category: null,
      branchId: currentBranch?.id || null, // Optional branch in dev mode
      maxSortOrder,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Menu Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage categories, items, and pricing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MenuImportExport categoryId={selectedCategoryId} />
            <BulkImageGenerator
              menuItems={menuItems.map(item => ({
                id: item.id,
                name: item.name,
                category_id: item.category_id || '',
                image_url: item.image_url,
              }))}
              onComplete={() => refetchItems()}
            />
            <Button onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items by name or SKU..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Categories Sidebar */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full overflow-y-auto p-4">
              <CategoryDragList
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                onAddCategory={handleAddCategory}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Items Table */}
          <ResizablePanel defaultSize={75}>
            <div className="h-full overflow-y-auto p-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">
                  {selectedCategoryId
                    ? categories.find((c) => c.id === selectedCategoryId)?.name
                    : 'All Items'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {menuItems.length} item{menuItems.length !== 1 ? 's' : ''}
                </p>
              </div>

              {itemsLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading items...
                </div>
              ) : (
                <MenuItemsTable items={menuItems} onEditItem={handleEditItem} />
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
