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
import { Wallet, TrendingUp, AlertCircle, DollarSign, Download } from "lucide-react";
import { format } from "date-fns";

export default function Cashbook() {
  const { currentBranch } = useBranch();
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: tillSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["till-sessions", currentBranch, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("till_sessions")
        .select(`
          *,
          employee:employees(name),
          shift:shifts(*)
        `)
        .eq("branch_id", currentBranch)
        .gte("opened_at", `${startDate}T00:00:00`)
        .lte("opened_at", `${endDate}T23:59:59`)
        .order("opened_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentBranch,
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

      const { data, error } = await supabase
        .from("till_ledger")
        .select(`
          *,
          order:orders(order_number),
          payment:payments(method, amount)
        `)
        .in("till_session_id", sessionIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Opening Float</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalOpening.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All till sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Closing</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalClosing.toFixed(2)}</div>
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
              ${Math.abs(totalVariance).toFixed(2)}
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
            <p className="text-xs text-muted-foreground">Sessions &gt; $5 variance</p>
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
                    <TableRow key={session.id} className={hasVariance ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        {format(new Date(session.opened_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>{session.employee?.name || "N/A"}</TableCell>
                      <TableCell className="text-right">${Number(session.opening_float || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">${Number(session.expected_cash || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">${Number(session.actual_cash || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={hasVariance ? 'text-destructive font-semibold' : ''}>
                          ${Math.abs(variance).toFixed(2)} {variance > 0 ? '(Over)' : variance < 0 ? '(Short)' : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          session.status === 'open' ? 'default' : 
                          session.status === 'reconciled' ? 'success' : 
                          'secondary'
                        }>
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
                    <TableCell>${Number(event.denomination || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{event.quantity || 0}</TableCell>
                    <TableCell className="text-right">${Number(event.running_balance || 0).toFixed(2)}</TableCell>
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
    </div>
  );
}
