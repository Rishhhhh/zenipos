import { useState } from 'react';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface EightySixManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItemId?: string;
  menuItemName?: string;
}

export function EightySixManagementModal({ 
  open, 
  onOpenChange,
  menuItemId,
  menuItemName 
}: EightySixManagementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState(menuItemId || '');
  const [reason, setReason] = useState('');
  const [estimatedReturn, setEstimatedReturn] = useState('');
  const [selectedAlternatives, setSelectedAlternatives] = useState<string[]>([]);

  // Fetch all menu items for dropdown
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items-for-86'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, category_id, in_stock')
        .eq('in_stock', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !menuItemId,
  });

  // Mark item as 86'd
  const markEightySix = useMutation({
    mutationFn: async () => {
      const estimatedReturnDate = estimatedReturn 
        ? new Date(estimatedReturn).toISOString()
        : null;

      const { data, error } = await supabase.rpc('mark_item_eighty_six', {
        menu_item_id_param: selectedItem,
        reason_param: reason,
        estimated_return_param: estimatedReturnDate,
        alternative_items_param: selectedAlternatives,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: '86\'d Item',
        description: `${menuItemName || 'Item'} has been marked as out of stock`,
      });
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['eighty-six-items'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to 86 Item',
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setSelectedItem(menuItemId || '');
    setReason('');
    setEstimatedReturn('');
    setSelectedAlternatives([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !reason) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select an item and provide a reason',
      });
      return;
    }
    markEightySix.mutate();
  };

  const quickReasons = [
    'Ran out',
    'Equipment broken',
    'Ingredient unavailable',
    'Too busy to prep',
    'Quality issue',
  ];

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title="86 Item (Out of Stock)"
      description="Mark an item as temporarily unavailable"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!menuItemId && (
          <div>
            <Label htmlFor="item">Menu Item *</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger id="item">
                <SelectValue placeholder="Select item to 86" />
              </SelectTrigger>
              <SelectContent>
                {menuItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="reason">Reason *</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this item unavailable?"
            rows={3}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {quickReasons.map((quickReason) => (
              <Button
                key={quickReason}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReason(quickReason)}
              >
                {quickReason}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="estimatedReturn">Estimated Return Time (Optional)</Label>
          <Input
            id="estimatedReturn"
            type="datetime-local"
            value={estimatedReturn}
            onChange={(e) => setEstimatedReturn(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            When do you expect this item to be available again?
          </p>
        </div>

        <div>
          <Label>Alternative Items (Optional)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Suggest alternatives for staff to recommend to customers
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {menuItems
              .filter((item) => item.id !== selectedItem)
              .slice(0, 10)
              .map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`alt-${item.id}`}
                    checked={selectedAlternatives.includes(item.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAlternatives([...selectedAlternatives, item.id]);
                      } else {
                        setSelectedAlternatives(
                          selectedAlternatives.filter((id) => id !== item.id)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={`alt-${item.id}`} className="cursor-pointer">
                    {item.name}
                  </Label>
                </div>
              ))}
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <p className="text-sm">
            This will immediately disable the item on all POS terminals and KDS screens.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={markEightySix.isPending || !selectedItem || !reason}
            className="flex-1"
          >
            {markEightySix.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            86 Item
          </Button>
        </div>
      </form>
    </GlassModal>
  );
}
