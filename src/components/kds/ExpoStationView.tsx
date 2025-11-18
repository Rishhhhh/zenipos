import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/lib/realtime/RealtimeService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Flame, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { trackPerformance } from '@/lib/monitoring/sentry';

interface CourseStatus {
  course_number: number;
  course_name: string;
  items_count: number;
  held_count: number;
  fired_count: number;
  preparing_count: number;
  completed_count: number;
  status: string;
  fired_at: string | null;
}

interface Order {
  id: string;
  table_id?: string;
  order_type: string;
  created_at: string;
  current_course: number;
  course_timing_rules: {
    gap_minutes: number;
    vip_custom: boolean;
  };
}

export function ExpoStationView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  // Fetch orders with course control
  const { data: orders, isLoading } = useQuery({
    queryKey: ['expo-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['kitchen_queue', 'pending', 'preparing'])
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as unknown as Order[];
    },
    refetchInterval: 5000,
  });

  // Fetch course status for selected order
  const { data: courseStatus } = useQuery({
    queryKey: ['course-status', selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return null;
      
      const { data, error } = await supabase
        .rpc('get_order_course_status' as any, { order_id_param: selectedOrder });
      
      if (error) throw error;
      return data as unknown as CourseStatus[];
    },
    enabled: !!selectedOrder,
    refetchInterval: 3000,
  });

  // Fire course mutation
  const fireCourse = useMutation({
    mutationFn: async ({ orderId, courseNumber }: { orderId: string; courseNumber: number }) => {
      const { data, error } = await supabase.rpc('fire_course' as any, {
        order_id_param: orderId,
        course_number_param: courseNumber,
      });

      if (error) throw error;
      
      const result = data as unknown as { success: boolean; error?: string; items_fired?: number };
      if (!result.success) {
        throw new Error(result.error || 'Failed to fire course');
      }
      
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Course Fired",
        description: `${data.items_fired} items sent to kitchen`,
      });
      queryClient.invalidateQueries({ queryKey: ['expo-orders'] });
      queryClient.invalidateQueries({ queryKey: ['course-status'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to fire course",
        description: error.message,
      });
    },
  });

  // Real-time subscriptions using unified service with latency tracking
  useRealtimeTable('orders', (payload) => {
    queryClient.invalidateQueries({ queryKey: ['expo-orders'] });
    
    // Track KDS update latency
    if (payload.eventType === 'INSERT' && payload.new) {
      const orderCreatedAt = new Date((payload.new as any).created_at).getTime();
      const receivedAt = Date.now();
      const latency = receivedAt - orderCreatedAt;
      
      // Only track if order is fresh (< 10 seconds old)
      if (latency < 10000) {
        trackPerformance('kds_update', latency, {
          page: 'ExpoStation',
          order_id: (payload.new as any).id,
          order_type: (payload.new as any).order_type,
        });
      }
    }
  });

  useRealtimeTable('course_fires', () => {
    queryClient.invalidateQueries({ queryKey: ['course-status'] });
  });

  // Auto-select first order
  useEffect(() => {
    if (orders && orders.length > 0 && !selectedOrder) {
      setSelectedOrder(orders[0].id);
    }
  }, [orders, selectedOrder]);

  const getCourseStatusColor = (status: string) => {
    switch (status) {
      case 'held': return 'bg-muted text-muted-foreground';
      case 'active': return 'bg-warning/20 text-warning border-warning';
      case 'completed': return 'bg-success/20 text-success border-success';
      default: return 'bg-muted';
    }
  };

  const getCourseIcon = (status: string) => {
    switch (status) {
      case 'held': return Clock;
      case 'active': return Flame;
      case 'completed': return CheckCircle2;
      default: return AlertCircle;
    }
  };

  const canFireCourse = (course: CourseStatus, currentCourse: number) => {
    return course.held_count > 0 && course.course_number >= currentCourse;
  };

  if (isLoading) {
    return (
      <div className="h-screen p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading expo station...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="h-screen p-8 flex items-center justify-center">
        <Card className="p-12 text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-success" />
          <p className="text-xl font-semibold">All Clear!</p>
          <p className="text-muted-foreground mt-2">No orders in queue</p>
        </Card>
      </div>
    );
  }

  const selectedOrderData = orders.find(o => o.id === selectedOrder);

  return (
    <div className="h-screen flex">
      {/* Order List Sidebar */}
      <div className="w-80 border-r bg-muted/30 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Active Orders ({orders.length})</h2>
        <div className="space-y-2">
          {orders.map((order) => (
            <Card
              key={order.id}
              className={`cursor-pointer transition-all ${
                selectedOrder === order.id ? 'border-primary shadow-md' : ''
              }`}
              onClick={() => setSelectedOrder(order.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">
                      {order.table_id ? `Table ${order.table_id}` : order.order_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      #{order.id.substring(0, 8)}
                    </p>
                  </div>
                  <Badge variant="outline">
                    Course {order.current_course}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Course Control Panel */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedOrderData && courseStatus && (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Expo Station</h1>
              <div className="flex items-center gap-4">
                <p className="text-lg text-muted-foreground">
                  {selectedOrderData.table_id 
                    ? `Table ${selectedOrderData.table_id}` 
                    : selectedOrderData.order_type}
                </p>
                {selectedOrderData.course_timing_rules.vip_custom && (
                  <Badge variant="outline" className="bg-primary/10">
                    VIP Custom Timing
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courseStatus.map((course) => {
                const Icon = getCourseIcon(course.status);
                const canFire = canFireCourse(course, selectedOrderData.current_course);

                return (
                  <Card
                    key={course.course_number}
                    className={`${getCourseStatusColor(course.status)} transition-all`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            Course {course.course_number}
                          </CardTitle>
                          <p className="text-sm mt-1">{course.course_name}</p>
                        </div>
                        <Badge variant="outline">
                          {course.items_count} items
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Status Breakdown */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {course.held_count > 0 && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{course.held_count} held</span>
                            </div>
                          )}
                          {course.fired_count > 0 && (
                            <div className="flex items-center gap-2">
                              <Flame className="h-4 w-4 text-warning" />
                              <span>{course.fired_count} fired</span>
                            </div>
                          )}
                          {course.preparing_count > 0 && (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-blue-500" />
                              <span>{course.preparing_count} preparing</span>
                            </div>
                          )}
                          {course.completed_count > 0 && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-success" />
                              <span>{course.completed_count} ready</span>
                            </div>
                          )}
                        </div>

                        {/* Fire Time */}
                        {course.fired_at && (
                          <p className="text-xs text-muted-foreground">
                            Fired {formatDistanceToNow(new Date(course.fired_at), { addSuffix: true })}
                          </p>
                        )}

                        {/* Fire Button */}
                        {canFire && (
                          <Button
                            className="w-full"
                            size="lg"
                            onClick={() => fireCourse.mutate({
                              orderId: selectedOrderData.id,
                              courseNumber: course.course_number,
                            })}
                            disabled={fireCourse.isPending}
                          >
                            <Flame className="h-4 w-4 mr-2" />
                            Fire Course {course.course_number}
                          </Button>
                        )}

                        {/* Timing Info */}
                        {course.status === 'held' && 
                         course.course_number > selectedOrderData.current_course && (
                          <p className="text-xs text-muted-foreground italic">
                            Waiting for Course {selectedOrderData.current_course} to complete
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
