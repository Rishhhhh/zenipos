// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/contexts/BranchContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Download, Filter } from "lucide-react";
import { format } from "date-fns";

export default function GeneralLedger() {
  const { currentBranch } = useBranch();
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filterType, setFilterType] = useState<string>("all");

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["ledger-payments", currentBranch?.id, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          order:orders!inner(
            order_number, 
            created_by, 
            branch_id,
            status,
            paid_at,
            employees(name)
          )
        `)
        .eq('order.branch_id', currentBranch.id)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .eq("status", "completed")
        .not("order.paid_at", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(p => ({
        ...p,
        type: 'payment',
        transaction_type: p.method,
        description: `Payment for Order #${p.order?.order_number || p.order_id}`,
      }));
    },
    enabled: !!currentBranch?.id,
  });

  const { data: refunds, isLoading: refundsLoading } = useQuery({
    queryKey: ["ledger-refunds", currentBranch?.id, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refunds")
        .select(`
          *,
          order:orders!inner(order_number, branch_id),
          employee:employees(name)
        `)
        .eq('order.branch_id', currentBranch.id)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        type: 'refund',
        transaction_type: 'refund',
        description: `Refund - ${r.reason || 'No reason'}`,
      }));
    },
    enabled: !!currentBranch?.id,
  });

  const { data: loyaltyTransactions, isLoading: loyaltyLoading } = useQuery({
    queryKey: ["ledger-loyalty", currentBranch?.id, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_ledger")
        .select(`
          *,
          customer:customers!inner(name, phone, branch_id),
          order:orders(order_number)
        `)
        .eq('customer.branch_id', currentBranch.id)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(l => ({
        ...l,
        type: 'loyalty',
        transaction_type: l.transaction_type,
        amount: l.points_delta * 0.01,
        description: `Loyalty ${l.transaction_type} - ${l.customer?.name || 'Unknown'}`,
      }));
    },
    enabled: !!currentBranch?.id,
  });

  const allTransactions = [
    ...(payments || []),
    ...(refunds || []),
    ...(loyaltyTransactions || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredTransactions = filterType === "all" 
    ? allTransactions 
    : allTransactions.filter(t => t.type === filterType);

  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalRefunds = refunds?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
  const totalTips = payments?.reduce((sum, p) => sum + Number(p.tip_amount || 0), 0) || 0;
  const netRevenue = totalRevenue - totalRefunds;

  const exportToCsv = () => {
    const csvData = filteredTransactions.map(txn => ({
      Date: format(new Date(txn.created_at), "yyyy-MM-dd HH:mm:ss"),
      Type: txn.type,
      Method: txn.transaction_type,
      Amount: txn.amount,
      Description: txn.description,
      Reference: txn.order?.order_number || txn.order_id || 'N/A',
      Status: txn.status,
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(","),
      ...csvData.map(row => Object.values(row).map(v => `"${v}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `general-ledger-${startDate}-to-${endDate}.csv`;
    a.click();
  };

  const isLoading = paymentsLoading || refundsLoading || loyaltyLoading;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">General Ledger</h1>
          <p className="text-muted-foreground">All financial transactions and accounting records</p>
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
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Transaction Type</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
              <SelectItem value="refund">Refunds</SelectItem>
              <SelectItem value="loyalty">Loyalty</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">RM {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{payments?.length || 0} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refunds</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">RM {totalRefunds.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{refunds?.length || 0} refunds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tips</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {totalTips.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Employee tips</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {netRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">After refunds</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading transactions...</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-muted-foreground">No transactions found for this date range</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((txn, idx) => {
                  const isCredit = txn.type === 'payment';
                  const isDebit = txn.type === 'refund';
                  
                  return (
                    <TableRow key={`${txn.type}-${txn.id}-${idx}`}>
                      <TableCell className="text-sm">
                        {format(new Date(txn.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          txn.type === 'payment' ? 'default' : 
                          txn.type === 'refund' ? 'destructive' : 
                          'secondary'
                        }>
                          {txn.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{txn.transaction_type}</TableCell>
                      <TableCell className="text-sm">{txn.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {txn.order?.order_number || txn.order_id || '-'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        isCredit ? 'text-success' : isDebit ? 'text-destructive' : ''
                      }`}>
                        {isCredit ? '+' : isDebit ? '-' : ''}RM {Math.abs(Number(txn.amount)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          txn.status === 'completed' ? 'success' : 
                          txn.status === 'pending' ? 'default' : 
                          'secondary'
                        }>
                          {txn.status}
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
    </div>
  );
}
