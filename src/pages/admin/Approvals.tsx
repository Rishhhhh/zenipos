import { useState } from 'react';
import { ApprovalRequestModal } from '@/components/pos/ApprovalRequestModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Approvals() {
  const [showModal, setShowModal] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['approval-stats'],
    queryFn: async () => {
      const [pending, approved, rejected] = await Promise.all([
        supabase
          .from('approval_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('approval_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('approval_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'rejected')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      return {
        pending: pending.count || 0,
        approved: approved.count || 0,
        rejected: rejected.count || 0,
      };
    },
    refetchInterval: 5000,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card p-4">
        <h1 className="text-2xl font-bold">Manager Approvals</h1>
      </div>

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button onClick={() => setShowModal(true)} size="lg">
            <Shield className="w-5 h-5 mr-2" />
            Open Approval Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved (24h)</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.approved || 0}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected (24h)</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.rejected || 0}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Approval System Overview</CardTitle>
            <CardDescription>
              Manage and review all approval requests from staff members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Actions Requiring Manager Approval:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Void items from orders</li>
                  <li>Apply discounts over 10%</li>
                  <li>Process cash refunds</li>
                  <li>Override prices</li>
                  <li>Delete completed orders</li>
                  <li>Modify inventory counts</li>
                  <li>Close employee shifts</li>
                  <li>Access safe/cash drawer</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Features:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Real-time approval notifications</li>
                  <li>PIN-based verification</li>
                  <li>30-minute request expiration</li>
                  <li>Complete audit trail</li>
                  <li>Multi-level approval support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ApprovalRequestModal open={showModal} onOpenChange={setShowModal} />
    </div>
  );
}
