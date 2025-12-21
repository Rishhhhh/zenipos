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
import { DollarSign, TrendingUp, TrendingDown, Download, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { TransactionDetailModal } from "@/components/admin/TransactionDetailModal";
import { HeaderWithClockIn } from "@/components/layout/HeaderWithClockIn";

export default function GeneralLedger() {
  const { currentBranch } = useBranch();
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  console.log('[GeneralLedger] Render state:', {
    currentBranch: currentBranch ? { id: currentBranch.id, name: currentBranch.name } : null,
    dateRange: { startDate, endDate }
  });

  const { data: payments, isLoading: paymentsLoading, error: paymentsError } = useQuery({
    queryKey: ["ledger-payments", currentBranch?.id, startDate, endDate],
    queryFn: async () => {
      console.log('[GeneralLedger] 💰 Fetching payments...', {
        branchId: currentBranch?.id,
        startDate,
        endDate
      });

      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          order:orders!inner(
            id,
            created_by, 
            branch_id,
            status,
            paid_at
          )
        `)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      console.log('[GeneralLedger] 📊 Raw payments query result:', {
        dataCount: data?.length || 0,
        error: error,
        sampleData: data?.slice(0, 2)
      });

      if (error) {
        console.error('[GeneralLedger] ❌ Payments query error:', error);
        throw error;
      }
      
      // Optional client-side filter for branch (if branch selected)
      const filtered = currentBranch?.id 
        ? (data || []).filter(p => {
            const matches = p.order?.branch_id === currentBranch.id && p.order?.paid_at !== null;
            if (!matches) {
              console.log('[GeneralLedger] Filtered out payment:', {
                paymentId: p.id,
                orderBranchId: p.order?.branch_id,
                currentBranchId: currentBranch.id,
                paidAt: p.order?.paid_at
              });
            }
            return matches;
          })
        : (data || []).filter(p => p.order?.paid_at !== null);
      
      console.log('[GeneralLedger] ✅ Filtered payments:', {
        beforeFilter: data?.length || 0,
        afterFilter: filtered.length,
        branchFilter: currentBranch?.id ? 'Applied' : 'Skipped'
      });
      
      return filtered.map(p => ({
        ...p,
        type: 'payment',
        transaction_type: p.method,
        description: `Payment for Order ${p.order_id.substring(0, 8)}`,
      }));
    },
    // Always enabled - show org-level data if no branch
    enabled: true,
  });

  const { data: refunds, isLoading: refundsLoading, error: refundsError } = useQuery({
    queryKey: ["ledger-refunds", currentBranch?.id, startDate, endDate],
    queryFn: async () => {
      console.log('[GeneralLedger] 💸 Fetching refunds...');

      const { data, error } = await supabase
        .from("refunds")
        .select(`
          *,
          order:orders!inner(id, branch_id)
        `)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });

      console.log('[GeneralLedger] 📊 Raw refunds query result:', {
        dataCount: data?.length || 0,
        error: error
      });

      if (error) {
        console.error('[GeneralLedger] ❌ Refunds query error:', error);
        throw error;
      }
      
      // Optional client-side filter for branch
      const filtered = currentBranch?.id 
        ? (data || []).filter(r => r.order?.branch_id === currentBranch.id)
        : (data || []);
      
      console.log('[GeneralLedger] ✅ Filtered refunds:', {
        beforeFilter: data?.length || 0,
        afterFilter: filtered.length
      });
      
      return filtered.map(r => ({
        ...r,
        type: 'refund',
        transaction_type: 'refund',
        description: `Refund - ${r.reason || 'No reason'}`,
      }));
    },
    enabled: true,
  });

  const { data: loyaltyTransactions, isLoading: loyaltyLoading, error: loyaltyError } = useQuery({
    queryKey: ["ledger-loyalty", currentBranch?.id, startDate, endDate],
    queryFn: async () => {
      console.log('[GeneralLedger] 🎁 Fetching loyalty transactions...');

      const { data, error } = await supabase
        .from("loyalty_ledger")
        .select(`
          *,
          customer:customers!inner(name, phone, branch_id),
          order:orders(id)
        `)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });

      console.log('[GeneralLedger] 📊 Raw loyalty query result:', {
        dataCount: data?.length || 0,
        error: error
      });

      if (error) {
        console.error('[GeneralLedger] ❌ Loyalty query error:', error);
        throw error;
      }
      
      // Optional client-side filter for branch
      const filtered = currentBranch?.id 
        ? (data || []).filter(l => l.customer?.branch_id === currentBranch.id)
        : (data || []);
      
      console.log('[GeneralLedger] ✅ Filtered loyalty:', {
        beforeFilter: data?.length || 0,
        afterFilter: filtered.length
      });
      
      return filtered.map(l => ({
        ...l,
        type: 'loyalty',
        transaction_type: l.transaction_type,
        amount: l.points_delta * 0.01,
        description: `Loyalty ${l.transaction_type} - ${l.customer?.name || 'Unknown'}`,
      }));
    },
    enabled: true,
  });

  const allTransactions = [
    ...(payments || []),
    ...(refunds || []),
    ...(loyaltyTransactions || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  console.log('[GeneralLedger] 📋 All transactions combined:', {
    payments: payments?.length || 0,
    refunds: refunds?.length || 0,
    loyalty: loyaltyTransactions?.length || 0,
    total: allTransactions.length,
    errors: {
      payments: paymentsError ? 'Error' : 'OK',
      refunds: refundsError ? 'Error' : 'OK',
      loyalty: loyaltyError ? 'Error' : 'OK'
    }
  });

  const filteredTransactions = filterType === "all" 
    ? allTransactions 
    : allTransactions.filter(t => t.type === filterType);

  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalRefunds = refunds?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
  const totalTips = payments?.reduce((sum, p) => sum + Number(p.tip_amount || 0), 0) || 0;
  const netRevenue = totalRevenue - totalRefunds;

  console.log('[GeneralLedger] 💵 Calculated totals:', {
    totalRevenue,
    totalRefunds,
    totalTips,
    netRevenue
  });

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
        <Button onClick={exportToCsv} variant="outline" size="sm" disabled={!currentBranch}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {!currentBranch && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            <p className="text-sm text-muted-foreground">
              Showing organization-wide transactions. Select a branch to filter by location.
            </p>
          </CardContent>
        </Card>
      )}

      {(paymentsError || refundsError || loyaltyError) && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Error Loading Transactions</p>
              <p className="text-xs text-muted-foreground mt-1">
                {paymentsError && `Payments: ${(paymentsError as any)?.message || 'Unknown error'}`}
                {refundsError && ` | Refunds: ${(refundsError as any)?.message || 'Unknown error'}`}
                {loyaltyError && ` | Loyalty: ${(loyaltyError as any)?.message || 'Unknown error'}`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                    <TableRow 
                      key={`${txn.type}-${txn.id}-${idx}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedTransaction(txn)}
                    >
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
                        {txn.order_id ? txn.order_id.substring(0, 8) : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        isCredit ? 'text-green-600' : isDebit ? 'text-destructive' : ''
                      }`}>
                        {isCredit ? '+' : isDebit ? '-' : ''}RM {Math.abs(Number(txn.amount)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          txn.status === 'completed' ? 'default' : 
                          txn.status === 'pending' ? 'secondary' : 
                          'secondary'
                        } className={txn.status === 'completed' ? 'bg-green-500' : ''}>
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

      <TransactionDetailModal
        open={!!selectedTransaction}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
    </div>
  );
}
  );
}
