import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCartStore } from '@/lib/store/cart';
import { LayoutGrid, Search, ShoppingCart, Wifi, WifiOff, CreditCard } from 'lucide-react';
import { NFCCardScanner } from '@/components/nfc/NFCCardScanner';
import { TableSelectionModal } from '@/components/pos/TableSelectionModal';
import { toast } from 'sonner';

export default function TabletPOS() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  
  const { items, addItem, tableId, setTable } = useCartStore();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing...');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Offline mode - orders will sync when back online');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data: categories = [] } = useQuery({
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

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items', selectedCategory, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('in_stock', true);

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: tables } = useQuery<any[]>({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('active', true)
        .order('label');
      if (error) throw error;
      return data || [];
    },
  });
  
  const tableList = tables || [];

  const handleNFCScan = async (cardData: any) => {
    const table = tableList.find(t => t.nfc_card_id === cardData.card_uid);
    if (table) {
      setTable(table.id, table.label);
      toast.success(`Loaded Table ${table.label}`);
    } else {
      toast.error('Table not found for this NFC card');
    }
  };

  const cartTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Tablet POS</h1>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowTableModal(true)}>
            {tableId ? `Table ${useCartStore.getState().tableName}` : 'Select Table'}
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <NFCCardScanner onScanSuccess={async (tableId) => {
            const table = tables.find(t => t.id === tableId);
            if (table) {
              setTable(table.id, table.label);
              toast.success(`Loaded Table ${table.label}`);
            }
          }} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="menu" className="h-full flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="menu" className="flex-1">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex-1">
              <CreditCard className="w-4 h-4 mr-2" />
              Tables
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="flex-1 overflow-hidden p-4 pt-0 mt-4">
            {/* Categories */}
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-auto h-[calc(100%-4rem)]">
              {menuItems.map((item) => (
                <Card
                  key={item.id}
                  className="p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    addItem({
                      menu_item_id: item.id,
                      name: item.name,
                      price: Number(item.price),
                      modifiers: [],
                      notes: '',
                    });
                    toast.success(`Added ${item.name}`);
                  }}
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                  )}
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.name}</h3>
                  <p className="text-primary font-bold">
                    ${Number(item.price).toFixed(2)}
                  </p>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tables" className="flex-1 overflow-auto p-4 pt-0 mt-4">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {tableList.map((table) => (
                <Card
                  key={table.id}
                  className={`p-6 text-center cursor-pointer hover:border-primary transition-colors ${
                    table.status === 'occupied' ? 'bg-orange-500/10 border-orange-500' :
                    table.status === 'reserved' ? 'bg-blue-500/10 border-blue-500' :
                    'bg-card'
                  }`}
                  onClick={() => {
                    setTable(table.id, table.label);
                    toast.success(`Selected Table ${table.label}`);
                  }}
                >
                  <div className="text-3xl font-bold mb-2">{table.label}</div>
                  <Badge variant="outline" className="text-xs">
                    {table.status}
                  </Badge>
                  {table.nfc_card_id && (
                    <div className="mt-2">
                      <CreditCard className="w-4 h-4 mx-auto text-muted-foreground" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Cart Footer */}
      {cartCount > 0 && (
        <div className="border-t bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-muted-foreground">{cartCount} items</div>
              <div className="text-2xl font-bold text-primary">
                ${cartTotal.toFixed(2)}
              </div>
            </div>
            <Button size="lg" className="px-8">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Checkout
            </Button>
          </div>
        </div>
      )}

      <TableSelectionModal
        open={showTableModal}
        onOpenChange={setShowTableModal}
        onSelect={(tableId, orderType) => {
          setTable(tableId, null);
          setShowTableModal(false);
        }}
      />
    </div>
  );
}
