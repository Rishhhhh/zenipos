import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Utensils, Clock } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  course_sequence: number;
  prep_time_minutes: number;
  category_id: string;
}

const COURSE_NAMES = {
  1: 'Appetizers',
  2: 'Soups & Salads',
  3: 'Main Courses',
  4: 'Desserts',
};

export function CourseConfigPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch menu items
  const { data: menuItems } = useQuery({
    queryKey: ['menu-items-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, course_sequence, prep_time_minutes, category_id')
        .order('name');
      
      if (error) throw error;
      return data as MenuItem[];
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('id, name')
        .order('sort_order');
      
      if (error) throw error;
      return data;
    },
  });

  // Update course mutation
  const updateCourse = useMutation({
    mutationFn: async ({ itemId, courseSequence, prepTime }: { 
      itemId: string; 
      courseSequence: number;
      prepTime: number;
    }) => {
      const { error } = await supabase
        .from('menu_items')
        .update({
          course_sequence: courseSequence,
          prep_time_minutes: prepTime,
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Course updated",
        description: "Menu item course assignment saved",
      });
      queryClient.invalidateQueries({ queryKey: ['menu-items-courses'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to update course",
        description: error.message,
      });
    },
  });

  const filteredItems = selectedCategory
    ? menuItems?.filter(item => item.category_id === selectedCategory)
    : menuItems;

  const groupedByCourse = filteredItems?.reduce((acc, item) => {
    const course = item.course_sequence;
    if (!acc[course]) acc[course] = [];
    acc[course].push(item);
    return acc;
  }, {} as Record<number, MenuItem[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Course Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Assign menu items to courses for proper pacing
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label>Filter by Category</Label>
            <Select
              value={selectedCategory || 'all'}
              onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6">
            {[1, 2, 3, 4].map((courseNum) => {
              const items = groupedByCourse?.[courseNum] || [];
              
              return (
                <div key={courseNum}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-sm">
                      Course {courseNum}
                    </Badge>
                    <span className="text-sm font-medium">
                      {COURSE_NAMES[courseNum as keyof typeof COURSE_NAMES]}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {items.length} items
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {items.map((item) => (
                      <Card key={item.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Utensils className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{item.prep_time_minutes} min prep time</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Select
                                value={item.course_sequence.toString()}
                                onValueChange={(value) => updateCourse.mutate({
                                  itemId: item.id,
                                  courseSequence: parseInt(value),
                                  prepTime: item.prep_time_minutes,
                                })}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Course 1</SelectItem>
                                  <SelectItem value="2">Course 2</SelectItem>
                                  <SelectItem value="3">Course 3</SelectItem>
                                  <SelectItem value="4">Course 4</SelectItem>
                                </SelectContent>
                              </Select>

                              <Input
                                type="number"
                                min="1"
                                max="60"
                                value={item.prep_time_minutes}
                                onChange={(e) => updateCourse.mutate({
                                  itemId: item.id,
                                  courseSequence: item.course_sequence,
                                  prepTime: parseInt(e.target.value) || 10,
                                })}
                                className="w-20"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {items.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No items assigned to this course
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Timing Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Badge variant="outline">1</Badge>
              <div>
                <p className="font-medium">Appetizers</p>
                <p className="text-muted-foreground">First to be served, quick prep items</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">2</Badge>
              <div>
                <p className="font-medium">Soups & Salads</p>
                <p className="text-muted-foreground">Light courses before mains</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">3</Badge>
              <div>
                <p className="font-medium">Main Courses</p>
                <p className="text-muted-foreground">Primary dishes, longest prep time</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">4</Badge>
              <div>
                <p className="font-medium">Desserts</p>
                <p className="text-muted-foreground">Final course after mains cleared</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
