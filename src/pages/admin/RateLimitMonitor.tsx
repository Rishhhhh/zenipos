import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, AlertTriangle, TrendingUp, Clock, Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function RateLimitMonitor() {
  const [showViolationsOnly, setShowViolationsOnly] = useState(false);
  const [endpointFilter, setEndpointFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch rate limit logs
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['rate-limit-logs', showViolationsOnly, endpointFilter],
    queryFn: async () => {
      let query = supabase
        .from('rate_limit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (showViolationsOnly) {
        query = query.eq('limit_exceeded', true);
      }

      if (endpointFilter !== 'all') {
        query = query.eq('endpoint', endpointFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  // Calculate stats
  const stats = logs ? {
    totalRequests: logs.length,
    violations: logs.filter(l => l.limit_exceeded).length,
    uniqueEndpoints: new Set(logs.map(l => l.endpoint)).size,
    topEndpoint: logs.reduce((acc, log) => {
      acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  } : null;

  const topEndpoint = stats ? Object.entries(stats.topEndpoint).sort((a, b) => b[1] - a[1])[0] : null;

  // Filter logs by search
  const filteredLogs = logs?.filter(log => {
    if (!searchQuery) return true;
    return log.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
           log.endpoint.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Export CSV
  const exportCSV = () => {
    if (!filteredLogs) return;
    
    const csv = [
      ['Timestamp', 'Endpoint', 'Identifier', 'Type', 'Status', 'Count', 'Window'],
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.endpoint,
        log.identifier,
        log.identifier_type,
        log.limit_exceeded ? 'BLOCKED' : 'ALLOWED',
        log.request_count,
        log.limit_window,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rate-limits-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rate Limit Monitor</h1>
          <p className="text-muted-foreground">Track API usage and abuse prevention</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRequests || 0}</div>
            <p className="text-xs text-muted-foreground">Last 100 logs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.violations || 0}</div>
            <p className="text-xs text-muted-foreground">Rate limits exceeded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endpoints</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.uniqueEndpoints || 0}</div>
            <p className="text-xs text-muted-foreground">Active endpoints</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Endpoint</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold truncate">{topEndpoint?.[0] || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">{topEndpoint?.[1] || 0} requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by identifier or endpoint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={endpointFilter} onValueChange={setEndpointFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Endpoints</SelectItem>
                <SelectItem value="ai-orchestrator">AI Orchestrator</SelectItem>
                <SelectItem value="voice-to-text">Voice to Text</SelectItem>
                <SelectItem value="validate-manager-pin">Validate PIN</SelectItem>
                <SelectItem value="send-push-notification">Push Notifications</SelectItem>
                <SelectItem value="execute-approved-action">Execute Action</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showViolationsOnly ? "default" : "outline"}
              onClick={() => setShowViolationsOnly(!showViolationsOnly)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {showViolationsOnly ? "Show All" : "Violations Only"}
            </Button>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Window</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {format(new Date(log.created_at), 'MM/dd HH:mm:ss')}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.endpoint}</TableCell>
                      <TableCell className="text-xs truncate max-w-[200px]">
                        {log.identifier}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.identifier_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.limit_exceeded ? (
                          <Badge variant="destructive">BLOCKED</Badge>
                        ) : (
                          <Badge variant="secondary">ALLOWED</Badge>
                        )}
                      </TableCell>
                      <TableCell>{log.request_count}</TableCell>
                      <TableCell>{log.limit_window}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No rate limit logs found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
