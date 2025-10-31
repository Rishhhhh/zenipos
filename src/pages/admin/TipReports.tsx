import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Heart, TrendingUp, DollarSign, Users } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function TipReports() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: tipReport, isLoading } = useQuery({
    queryKey: ['tip-report', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tip_report', {
        start_date_param: new Date(startDate).toISOString(),
        end_date_param: new Date(endDate).toISOString(),
      });
      
      if (error) throw error;
      return data;
    },
  });

  const totalTips = tipReport?.reduce((sum, emp) => sum + Number(emp.total_tips), 0) || 0;
  const totalCashTips = tipReport?.reduce((sum, emp) => sum + Number(emp.cash_tips), 0) || 0;
  const totalCardTips = tipReport?.reduce((sum, emp) => sum + Number(emp.card_tips), 0) || 0;
  const totalTipCount = tipReport?.reduce((sum, emp) => sum + Number(emp.tip_count), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card p-4">
        <h1 className="text-2xl font-bold">Tip Reports</h1>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tips</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">RM {totalTips.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{totalTipCount} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Tips</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">RM {totalCashTips.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {((totalCashTips / totalTips) * 100 || 0).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Card Tips</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">RM {totalCardTips.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {((totalCardTips / totalTips) * 100 || 0).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Per Transaction</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                RM {totalTipCount > 0 ? (totalTips / totalTipCount).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Average tip amount</p>
            </CardContent>
          </Card>
        </div>

        {/* Employee Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Tips by Employee</CardTitle>
            <CardDescription>
              Breakdown of tips received by each employee during the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : tipReport && tipReport.length > 0 ? (
              <div className="space-y-3">
                {tipReport.map((emp: any) => (
                  <div
                    key={emp.employee_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{emp.employee_name}</h3>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Cash: RM {Number(emp.cash_tips).toFixed(2)}</span>
                        <span>Card: RM {Number(emp.card_tips).toFixed(2)}</span>
                        <span>{emp.tip_count} transactions</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        RM {Number(emp.total_tips).toFixed(2)}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {((Number(emp.total_tips) / totalTips) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No tip data found for the selected period
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
