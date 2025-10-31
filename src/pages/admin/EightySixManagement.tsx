import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Plus, History } from 'lucide-react';
import { EightySixListPanel } from '@/components/pos/EightySixListPanel';
import { EightySixManagementModal } from '@/components/pos/EightySixManagementModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function EightySixManagement() {
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch history of resolved 86 items
  const { data: history = [] } = useQuery({
    queryKey: ['eighty-six-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eighty_six_items')
        .select(`
          *,
          menu_item:menu_items(name, category_id),
          created_by_emp:employees!eighty_six_items_created_by_fkey(name),
          resolved_by_emp:employees!eighty_six_items_resolved_by_fkey(name)
        `)
        .eq('active', false)
        .order('resolved_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">86 List Management</h1>
          <p className="text-muted-foreground">
            Manage out-of-stock items across all terminals
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          86 Item
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Active 86 Items
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <EightySixListPanel />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recently Resolved 86 Items</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No resolved items in history
                </p>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {history.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-4 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">
                              {item.menu_item?.name || 'Unknown Item'}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.reason}
                            </p>
                          </div>
                          {item.auto_generated && (
                            <Badge variant="outline" className="ml-2">
                              Auto-86
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>
                            <p className="font-medium mb-1">86'd</p>
                            <p>{format(new Date(item.created_at), 'MMM dd, h:mm a')}</p>
                            {item.created_by_emp?.name && (
                              <p>by {item.created_by_emp.name}</p>
                            )}
                          </div>
                          <div>
                            <p className="font-medium mb-1">Restored</p>
                            <p>{format(new Date(item.resolved_at), 'MMM dd, h:mm a')}</p>
                            {item.resolved_by_emp?.name && (
                              <p>by {item.resolved_by_emp.name}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EightySixManagementModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  );
}
