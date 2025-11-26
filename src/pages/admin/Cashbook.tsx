// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/contexts/BranchContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, AlertCircle, DollarSign, Download, Clock } from "lucide-react";
import { format, formatDistance } from "date-fns";
import { TillReconciliationDialog } from "@/components/admin/TillReconciliationDialog";

export default function Cashbook() {
  const { currentBranch } = useBranch();
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Fetch active (open) till sessions
  const { data: activeSessions, isLoading: activeLoading } = useQuery({
    queryKey: ["active-till-sessions", currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      
      const { data, error } = await supabase
        .from("till_sessions")
        .select(`
          *,
          employee:employees(name)
        `)
        .eq("branch_id", currentBranch.id)
        .eq("status", "open")
        .order("opened_at", { ascending: false });

      if (error) throw error;

      // Get transaction counts for each session
      const sessionsWithCounts = await Promise.all(
        (data || []).map(async (session) => {
          const { count } = await supabase
            .from("till_ledger")
            .select("*", { count: "exact", head: true })
            .eq("till_session_id", session.id);

          return { ...session, transaction_count: count || 0 };
        })
      );

      return sessionsWithCounts;
    },
    enabled: !!currentBranch?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: tillSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["till-sessions", currentBranch?.id, startDate, endDate],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      
      const { data, error } = await supabase
        .from("till_sessions")
        .select(`
          *,
          employee:employees(name),
          shift:shifts(*)
        `)
        .eq("branch_id", currentBranch.id)
        .gte("opened_at", `${startDate}T00:00:00`)
        .lte("opened_at", `${endDate}T23:59:59`)
        .order("opened_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentBranch?.id,
  });

  const { data: floatEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["float-events", currentBranch, startDate, endDate],
    queryFn: async () => {
      const sessionIds = tillSessions?.map(s => s.id) || [];
      if (sessionIds.length === 0) return [];

      const { data, error } = await supabase
        .from("cash_float_events")
        .select("*")
        .in("till_session_id", sessionIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tillSessions && tillSessions.length > 0,
  });

  const { data: ledgerEntries, isLoading: ledgerLoading } = useQuery({
    queryKey: ["till-ledger", currentBranch, startDate, endDate],
    queryFn: async () => {
      const sessionIds = tillSessions?.map(s => s.id) || [];
      if (sessionIds.length === 0) return [];

      // Try to get from till_ledger first
      const { data: ledgerData, error } = await supabase
        .from("till_ledger")
        .select(`
          *,
          order:orders(order_number),
          payment:payments(method, amount)
        `)
        .in("till_session_id", sessionIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // If till_ledger is empty, fallback to payments table
      if (!ledgerData || ledgerData.length === 0) {
        console.log('[Cashbook] till_ledger empty, fetching from payments table');
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select(`
            *,
            order:orders(order_number, branch_id)
          `)
          .eq('order.branch_id', currentBranch?.id)
          .gte("created_at", `${startDate}T00:00:00`)
          .lte("created_at", `${endDate}T23:59:59`)
          .order("created_at", { ascending: false });

        if (paymentsError) throw paymentsError;
        
        // Transform payments to match till_ledger format
        return (paymentsData || []).map(p => ({
          id: p.id,
          created_at: p.created_at,
          amount: p.amount,
          transaction_type: p.method,
          order: p.order,
          payment: { method: p.method, amount: p.amount },
          till_session_id: null,
        }));
      }

      return ledgerData;
    },
    enabled: !!tillSessions && tillSessions.length > 0,
  });

  const totalOpening = tillSessions?.reduce((sum, s) => sum + Number(s.opening_float || 0), 0) || 0;
  const totalClosing = tillSessions?.reduce((sum, s) => sum + Number(s.closing_float || 0), 0) || 0;
  const totalVariance = tillSessions?.reduce((sum, s) => sum + Number(s.variance || 0), 0) || 0;
  const sessionsWithVariance = tillSessions?.filter(s => Math.abs(Number(s.variance || 0)) > 5).length || 0;

  const exportToCsv = () => {
    const csvData = tillSessions?.map(session => ({
      Date: format(new Date(session.opened_at), "yyyy-MM-dd HH:mm"),
      Employee: session.employee?.name || "N/A",
      Opening: session.opening_float,
      Closing: session.closing_float,
      Expected: session.expected_cash,
      Actual: session.actual_cash,
      Variance: session.variance,
      Status: session.status,
    })) || [];

    const csv = [
      Object.keys(csvData[0] || {}).join(","),
      ...csvData.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cashbook-${startDate}-to-${endDate}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cashbook</h1>
          <p className="text-muted-foreground">Daily cash reconciliation and till management</p>
        </div>
        <Button onClick={exportToCsv} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Start Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">End Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Active Till Sessions */}
      {activeSessions && activeSessions.length > 0 && (
        <Card className="border-2 border-green-500/30 bg-green-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                Active Till Sessions
              </CardTitle>
              <Badge variant="default" className="bg-green-500">
                {activeSessions.length} Open
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 bg-background/50 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{session.employee?.name || "N/A"}</span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Opened:</span>
                      <span>{formatDistance(new Date(session.opened_at), new Date(), { addSuffix: true })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expected Cash:</span>
                      <span className="font-semibold text-primary">
                        RM {Number(session.expected_cash || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transactions:</span>
                      <span>{session.transaction_count || 0}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Opening Float</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {totalOpening.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All till sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Closing</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {totalClosing.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">End of day totals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Variance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalVariance !== 0 ? 'text-destructive' : ''}`}>
              RM {Math.abs(totalVariance).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalVariance > 0 ? 'Over' : totalVariance < 0 ? 'Short' : 'Balanced'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discrepancies</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionsWithVariance}</div>
            <p className="text-xs text-muted-foreground">Sessions &gt; RM 5 variance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Till Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <p>Loading sessions...</p>
          ) : !tillSessions || tillSessions.length === 0 ? (
            <p className="text-muted-foreground">No till sessions found for this date range</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Opening Float</TableHead>
                  <TableHead className="text-right">Expected Cash</TableHead>
                  <TableHead className="text-right">Actual Cash</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tillSessions.map((session) => {
                  const variance = Number(session.variance || 0);
                  const hasVariance = Math.abs(variance) > 5;
                  
                  return (
                    <TableRow 
                      key={session.id} 
                      className={`${hasVariance ? 'bg-destructive/5' : ''} cursor-pointer hover:bg-muted/50`}
                      onClick={() => setSelectedSessionId(session.id)}
                    >
                      <TableCell>
                        {format(new Date(session.opened_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>{session.employee?.name || "N/A"}</TableCell>
                      <TableCell className="text-right">RM {Number(session.opening_float || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">RM {Number(session.expected_cash || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">RM {Number(session.actual_cash || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={hasVariance ? 'text-destructive font-semibold' : ''}>
                          RM {Math.abs(variance).toFixed(2)} {variance > 0 ? '(Over)' : variance < 0 ? '(Short)' : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          session.status === 'open' ? 'default' : 
                          session.status === 'reconciled' ? 'default' : 
                          'secondary'
                        } className={session.status === 'reconciled' ? 'bg-green-500 hover:bg-green-600' : ''}>
                          {session.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {floatEvents && floatEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Float Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Denomination</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Running Balance</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {floatEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{format(new Date(event.created_at), "HH:mm:ss")}</TableCell>
                    <TableCell className="capitalize">{event.event_type?.replace('_', ' ')}</TableCell>
                    <TableCell>RM {Number(event.denomination || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{event.quantity || 0}</TableCell>
                    <TableCell className="text-right">RM {Number(event.running_balance || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {event.metadata && typeof event.metadata === 'object' 
                        ? JSON.stringify(event.metadata) 
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedSessionId && (
        <TillReconciliationDialog
          open={!!selectedSessionId}
          onOpenChange={(open) => !open && setSelectedSessionId(null)}
          sessionId={selectedSessionId}
        />
      )}
    </div>
  );
}
