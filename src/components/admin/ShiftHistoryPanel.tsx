import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, DollarSign, ShoppingCart, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface ShiftHistoryPanelProps {
  employeeId: string;
}

export function ShiftHistoryPanel({ employeeId }: ShiftHistoryPanelProps) {
  const { data: shifts } = useQuery({
    queryKey: ['shifts', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('employee_id', employeeId)
        .order('clock_in_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card className="p-6">
      <h3 className="font-bold text-lg mb-4">Recent Shifts</h3>
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {shifts?.map(shift => (
            <Card key={shift.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {format(new Date(shift.clock_in_at), 'MMM dd, yyyy')}
                  </span>
                </div>
                <Badge variant={shift.status === 'active' ? 'default' : 'secondary'}>
                  {shift.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Clock In</p>
                  <p className="font-medium">{format(new Date(shift.clock_in_at), 'HH:mm')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Clock Out</p>
                  <p className="font-medium">
                    {shift.clock_out_at ? format(new Date(shift.clock_out_at), 'HH:mm') : '-'}
                  </p>
                </div>
              </div>

              {shift.status === 'closed' && (
                <>
                  <div className="border-t mt-3 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Hours</span>
                      </div>
                      <span className="font-medium">{shift.total_hours?.toFixed(1)}h</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ShoppingCart className="h-3 w-3" />
                        <span>Orders</span>
                      </div>
                      <span className="font-medium">{shift.orders_processed}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>Sales</span>
                      </div>
                      <span className="font-medium">RM {shift.total_sales?.toFixed(2)}</span>
                    </div>

                    {shift.voids_count > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-warning">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Voids</span>
                        </div>
                        <span className="font-medium text-warning">{shift.voids_count}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>
          ))}

          {!shifts?.length && (
            <p className="text-center text-muted-foreground py-8">No shift history</p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
