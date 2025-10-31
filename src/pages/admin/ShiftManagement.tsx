import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Coffee,
  AlertCircle,
  User,
  Calendar,
  MapPin,
  Camera
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function ShiftManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Fetch active shifts
  const { data: activeShifts = [], isLoading: loadingActive } = useQuery({
    queryKey: ['active-shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          employee:employees(id, name, role, pay_rate, branch_id)
        `)
        .eq('status', 'active')
        .is('clock_out_at', null)
        .order('clock_in_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Fetch shifts for selected date
  const { data: dateShifts = [], isLoading: loadingDate } = useQuery({
    queryKey: ['shifts-by-date', selectedDate],
    queryFn: async () => {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          employee:employees(id, name, role, pay_rate),
          break_logs(*)
        `)
        .gte('clock_in_at', startOfDay.toISOString())
        .lte('clock_in_at', endOfDay.toISOString())
        .order('clock_in_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch break logs for active shifts
  const { data: activeBreaks = [] } = useQuery({
    queryKey: ['active-breaks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('break_logs')
        .select(`
          *,
          employee:employees(name),
          shift:shifts(clock_in_at)
        `)
        .is('end_at', null);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  const calculateShiftMetrics = (shift: any) => {
    const clockIn = new Date(shift.clock_in_at);
    const clockOut = shift.clock_out_at ? new Date(shift.clock_out_at) : new Date();
    const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
    const breakHours = (shift.break_minutes || 0) / 60;
    const netHours = hoursWorked - breakHours;
    const laborCost = netHours * (shift.employee?.pay_rate || 0);

    return {
      hoursWorked: hoursWorked.toFixed(2),
      netHours: netHours.toFixed(2),
      laborCost: laborCost.toFixed(2),
      breaks: shift.break_minutes || 0,
    };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Shift Management</h1>
        <p className="text-muted-foreground">
          Monitor active shifts, breaks, and labor costs in real-time
        </p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Shifts</TabsTrigger>
          <TabsTrigger value="history">Shift History</TabsTrigger>
          <TabsTrigger value="breaks">Active Breaks</TabsTrigger>
        </TabsList>

        {/* Active Shifts */}
        <TabsContent value="active" className="space-y-4">
          {loadingActive ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Loading active shifts...</p>
              </CardContent>
            </Card>
          ) : activeShifts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No active shifts</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeShifts.map((shift: any) => {
                const metrics = calculateShiftMetrics(shift);
                return (
                  <Card key={shift.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5" />
                          <div>
                            <CardTitle className="text-lg">{shift.employee?.name}</CardTitle>
                            <p className="text-sm text-muted-foreground capitalize">
                              {shift.employee?.role}
                            </p>
                          </div>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Clock In</p>
                          <p className="font-medium">{format(new Date(shift.clock_in_at), 'h:mm a')}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(shift.clock_in_at), { addSuffix: true })}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Hours Worked</p>
                          <p className="text-lg font-bold">{metrics.netHours}h</p>
                          {shift.break_minutes > 0 && (
                            <p className="text-xs text-muted-foreground">
                              ({metrics.breaks}m break)
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Labor Cost</p>
                          <p className="text-lg font-bold">RM {metrics.laborCost}</p>
                          <p className="text-xs text-muted-foreground">
                            @ RM{shift.employee?.pay_rate}/hr
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Performance</p>
                          <p className="font-medium">{shift.orders_processed || 0} orders</p>
                          <p className="text-xs text-muted-foreground">
                            RM {(shift.total_sales || 0).toFixed(2)} sales
                          </p>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-xs">
                        {shift.clock_in_location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>Location verified</span>
                          </div>
                        )}
                        {shift.clock_in_photo_url && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Camera className="h-3 w-3" />
                            <span>Photo captured</span>
                          </div>
                        )}
                        {shift.nfc_card_uid && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Badge variant="outline" className="h-5">NFC Badge</Badge>
                          </div>
                        )}
                        {shift.overtime_minutes > 0 && (
                          <div className="flex items-center gap-2 text-warning">
                            <AlertCircle className="h-3 w-3" />
                            <span>{shift.overtime_minutes}m overtime</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Shift History */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>

          {loadingDate ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Loading shifts...</p>
              </CardContent>
            </Card>
          ) : dateShifts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No shifts for this date</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {dateShifts.map((shift: any) => {
                  const metrics = calculateShiftMetrics(shift);
                  return (
                    <Card key={shift.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold">{shift.employee?.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {shift.employee?.role}
                            </p>
                          </div>
                          <Badge variant={shift.status === 'closed' ? 'secondary' : 'default'}>
                            {shift.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Time</p>
                            <p className="font-medium">
                              {format(new Date(shift.clock_in_at), 'h:mm a')} - {' '}
                              {shift.clock_out_at ? format(new Date(shift.clock_out_at), 'h:mm a') : 'Active'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Hours</p>
                            <p className="font-medium">{metrics.netHours}h</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Labor Cost</p>
                            <p className="font-medium">RM {metrics.laborCost}</p>
                          </div>
                        </div>

                        {shift.break_logs && shift.break_logs.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Breaks</p>
                            <div className="flex flex-wrap gap-2">
                              {shift.break_logs.map((breakLog: any) => (
                                <Badge key={breakLog.id} variant="outline" className="text-xs">
                                  <Coffee className="h-3 w-3 mr-1" />
                                  {breakLog.duration_minutes}m ({breakLog.break_type})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Active Breaks */}
        <TabsContent value="breaks" className="space-y-4">
          {activeBreaks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Coffee className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No active breaks</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeBreaks.map((breakLog: any) => {
                const duration = Math.floor(
                  (new Date().getTime() - new Date(breakLog.start_at).getTime()) / 60000
                );
                return (
                  <Card key={breakLog.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Coffee className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-semibold">{breakLog.employee?.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {breakLog.break_type} Break
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{duration}m</p>
                          <p className="text-xs text-muted-foreground">
                            Started {formatDistanceToNow(new Date(breakLog.start_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
