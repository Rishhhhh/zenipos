import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { CreditCard, Clock, DollarSign, X, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function OpenTabs() {
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: openTabs = [], isLoading } = useQuery({
    queryKey: ['open-tabs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('open_tabs')
        .select(`
          *,
          table:tables(label),
          opened_by_employee:employees!open_tabs_opened_by_fkey(name)
        `)
        .eq('status', 'open')
        .order('opened_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const closeTabMutation = useMutation({
    mutationFn: async (tabId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      const { error } = await supabase
        .from('open_tabs')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closed_by: employee?.id,
        })
        .eq('id', tabId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tab closed successfully');
      queryClient.invalidateQueries({ queryKey: ['open-tabs'] });
      setShowCloseDialog(false);
      setSelectedTab(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to close tab');
    },
  });

  const handleCloseTab = () => {
    if (selectedTab) {
      closeTabMutation.mutate(selectedTab);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'closed':
        return 'secondary';
      case 'transferred':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Open Tabs</h1>
          <Badge variant="outline">
            {openTabs.length} Active Tab{openTabs.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {isLoading ? (
          <p className="text-center py-12 text-muted-foreground">Loading tabs...</p>
        ) : openTabs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openTabs.map((tab: any) => (
              <Card key={tab.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        {tab.customer_name || 'Guest'}
                      </CardTitle>
                      {tab.table && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Table: {tab.table.label}
                        </p>
                      )}
                    </div>
                    <Badge variant={getStatusColor(tab.status)}>
                      {tab.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Balance:</span>
                      <span className="font-bold">RM {Number(tab.current_balance).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pre-Auth:</span>
                      <span>RM {Number(tab.pre_auth_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Card:</span>
                      <span>**** {tab.card_last_4}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Clock className="w-3 h-3" />
                      Opened {formatDistanceToNow(new Date(tab.opened_at), { addSuffix: true })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      By: {tab.opened_by_employee?.name}
                    </div>
                  </div>

                  <div className="pt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        // TODO: Navigate to order details or add items to tab
                        toast.info('Feature coming soon');
                      }}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Add Items
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedTab(tab.id);
                        setShowCloseDialog(true);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Close Tab
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Open Tabs</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Open tabs will appear here. They allow customers to keep a running balance
                throughout their visit and pay at the end.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Tab</AlertDialogTitle>
            <AlertDialogDescription>
              This will close the tab and process the final payment. Make sure all items have been added and the customer is ready to pay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseTab}
              disabled={closeTabMutation.isPending}
            >
              {closeTabMutation.isPending ? 'Closing...' : 'Close Tab'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
