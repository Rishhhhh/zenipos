import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function EightySixWidget() {
  const navigate = useNavigate();

  const { data: eightySixItems = [], isLoading } = useQuery({
    queryKey: ['eighty-six-items-widget'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_eighty_six_items');
      if (error) throw error;
      return (data || []).slice(0, 5); // Show top 5
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">86 List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">86 List</CardTitle>
        <AlertTriangle className="h-4 w-4 text-warning" />
      </CardHeader>
      <CardContent>
        {eightySixItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              All items available
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{eightySixItems.length}</span>
              <Badge variant="destructive">Out of Stock</Badge>
            </div>

            <div className="space-y-2">
              {eightySixItems.map((item: any) => (
                <div
                  key={item.id}
                  className="p-2 bg-warning/5 rounded-lg border border-warning/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.menu_item_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.reason}
                      </p>
                    </div>
                    {item.auto_generated && (
                      <Badge variant="outline" className="text-xs ml-2">
                        Auto
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/admin/eighty-six')}
            >
              View All 86 Items
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
