import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImpersonateModal } from '@/components/admin/ImpersonateModal';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  AlertCircle,
  MoreHorizontal,
  Eye,
  UserCog,
  Ban,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdmin() {
  const { isImpersonating, impersonatedOrganization, startImpersonation, endImpersonation } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [impersonateModalOpen, setImpersonateModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string } | null>(null);
  const limit = 20;

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['super-admin-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_super_admin_analytics');
      if (error) throw error;
      return data[0];
    },
  });

  // Fetch organizations
  const { data: orgData, isLoading } = useQuery({
    queryKey: ['super-admin-organizations', page, searchQuery],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('super-admin-organizations', {
        body: { page, limit, search: searchQuery }
      });
      if (error) throw error;
      return data;
    },
  });

  // Toggle organization status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ orgId, isActive }: { orgId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('organizations')
        .update({ is_active: !isActive })
        .eq('id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Organization status updated');
    },
  });

  const openImpersonateModal = (orgId: string, orgName: string) => {
    setSelectedOrg({ id: orgId, name: orgName });
    setImpersonateModalOpen(true);
  };

  const handleImpersonate = async (reason: string) => {
    if (!selectedOrg) return;
    await startImpersonation(selectedOrg.id, reason);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-8">
      {/* Impersonation Banner */}
      {isImpersonating && impersonatedOrganization && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Impersonating Organization</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              You are viewing <strong>{impersonatedOrganization.name}</strong>'s data.
            </span>
            <Button variant="outline" size="sm" onClick={endImpersonation}>
              End Impersonation
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_organizations || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Organizations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.active_organizations || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_orders_today || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(analytics?.total_revenue_today) || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Organizations</CardTitle>
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Orders Today</TableHead>
                <TableHead>Revenue Today</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                orgData?.organizations?.map((org: any) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <Badge variant={org.is_active ? 'default' : 'secondary'}>
                        {org.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{org.active_branches}</TableCell>
                    <TableCell>{org.total_orders_today}</TableCell>
                    <TableCell>{formatCurrency(org.total_revenue_today)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openImpersonateModal(org.id, org.name)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Impersonate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                orgId: org.id,
                                isActive: org.is_active,
                              })
                            }
                          >
                            {org.is_active ? (
                              <>
                                <Ban className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} to{' '}
              {Math.min(page * limit, orgData?.total || 0)} of {orgData?.total || 0} organizations
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= (orgData?.total || 0)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impersonate Modal */}
      {selectedOrg && (
        <ImpersonateModal
          open={impersonateModalOpen}
          onOpenChange={setImpersonateModalOpen}
          organizationName={selectedOrg.name}
          organizationId={selectedOrg.id}
          onConfirm={handleImpersonate}
        />
      )}
    </div>
  );
}
