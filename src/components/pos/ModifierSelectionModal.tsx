import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CartModifier } from '@/lib/store/cart';

interface ModifierSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItemId: string;
  menuItemName: string;
  onConfirm: (modifiers: CartModifier[]) => void;
}

export function ModifierSelectionModal({
  open,
  onOpenChange,
  menuItemId,
  menuItemName,
  onConfirm,
}: ModifierSelectionModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<CartModifier[]>([]);
  const [groupSelections, setGroupSelections] = useState<Record<string, string[]>>({});

  const { data: modifierData, isLoading } = useQuery({
    queryKey: ['category-modifiers', menuItemId],
    queryFn: async () => {
      console.log('🔍 Modifier query triggered with menuItemId:', menuItemId);
      
      // Defensive check for empty/invalid menuItemId
      if (!menuItemId || menuItemId.length === 0) {
        console.warn('⚠️ menuItemId is undefined or empty!');
        return [];
      }
      
      // Step 1: Get the menu item's category
      const { data: item, error: itemError } = await supabase
        .from('menu_items')
        .select('category_id')
        .eq('id', menuItemId)
        .single();

      if (itemError) {
        console.error('Error fetching menu item:', itemError);
        throw itemError;
      }

      if (!item?.category_id) {
        console.warn('Menu item has no category assigned');
        return [];
      }
      
      console.log('📂 Menu item category:', item.category_id);

      // Step 2: Fetch modifier groups linked to that category
      const { data: links, error: linksError } = await supabase
        .from('category_modifier_groups')
        .select('modifier_group_id, sort_order')
        .eq('category_id', item.category_id)
        .order('sort_order');

      if (linksError) {
        console.error('Error fetching category modifier links:', linksError);
        throw linksError;
      }

      if (!links || links.length === 0) {
        return [];
      }

      const groupIds = links.map(l => l.modifier_group_id);

      // Step 3: Fetch full modifier groups with modifiers
      const { data: groups, error: groupsError } = await supabase
        .from('modifier_groups')
        .select(`
          id,
          name,
          min_selections,
          max_selections,
          modifiers (
            id,
            name,
            price
          )
        `)
        .in('id', groupIds);

      if (groupsError) {
        console.error('Error fetching modifier groups:', groupsError);
        throw groupsError;
      }

      console.log('✅ Modifier groups loaded:', groups?.length || 0, 'groups');
      return groups || [];
    },
    enabled: open && !!menuItemId && menuItemId.length > 0,
  });

  // Reset selections when modal opens
  useEffect(() => {
    if (open) {
      setSelectedModifiers([]);
      setGroupSelections({});
    }
  }, [open]);

  const handleCheckboxChange = (groupId: string, modifier: any, checked: boolean) => {
    const group = modifierData?.find(g => g.id === groupId);
    if (!group) return;

    const currentSelections = groupSelections[groupId] || [];
    
    if (checked) {
      // Check max selections
      if (currentSelections.length >= group.max_selections) {
        return; // Prevent exceeding max
      }
      
      setGroupSelections({
        ...groupSelections,
        [groupId]: [...currentSelections, modifier.id],
      });
      
      setSelectedModifiers([
        ...selectedModifiers,
        { id: modifier.id, name: modifier.name, price: modifier.price },
      ]);
    } else {
      setGroupSelections({
        ...groupSelections,
        [groupId]: currentSelections.filter(id => id !== modifier.id),
      });
      
      setSelectedModifiers(selectedModifiers.filter(m => m.id !== modifier.id));
    }
  };

  const handleRadioChange = (groupId: string, modifier: any) => {
    // Remove previous selection for this group
    const previousSelection = groupSelections[groupId]?.[0];
    if (previousSelection) {
      setSelectedModifiers(selectedModifiers.filter(m => m.id !== previousSelection));
    }

    setGroupSelections({
      ...groupSelections,
      [groupId]: [modifier.id],
    });

    setSelectedModifiers([
      ...selectedModifiers.filter(m => {
        const prevMod = modifierData?.find(g => g.id === groupId)?.modifiers?.find((mod: any) => mod.id === m.id);
        return !prevMod;
      }),
      { id: modifier.id, name: modifier.name, price: modifier.price },
    ]);
  };

  const canConfirm = () => {
    if (!modifierData) return true;
    
    // Check all groups meet min_selections requirement
    return modifierData.every(group => {
      const selections = groupSelections[group.id]?.length || 0;
      return selections >= group.min_selections;
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedModifiers);
    onOpenChange(false);
  };

  const handleSkip = () => {
    onConfirm([]);
    onOpenChange(false);
  };

  const getTotalModifierPrice = () => {
    return selectedModifiers.reduce((sum, mod) => sum + mod.price, 0);
  };

  if (!modifierData || modifierData.length === 0) {
    // No modifiers for this item, auto-confirm
    if (open) {
      handleSkip();
    }
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Customize: {menuItemName}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-6">
            {isLoading ? (
              <p className="text-center text-muted-foreground">Loading options...</p>
            ) : (
              modifierData?.map((group: any) => (
                <Card key={group.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {group.min_selections > 0 && `Select at least ${group.min_selections}`}
                        {group.min_selections > 0 && group.max_selections > 1 && ' - '}
                        {group.max_selections > 1 && `Max ${group.max_selections}`}
                        {group.min_selections === 0 && group.max_selections === 1 && 'Optional'}
                      </p>
                    </div>
                    {group.min_selections > 0 && (
                      <Badge variant="destructive">Required</Badge>
                    )}
                  </div>

                  {group.max_selections === 1 ? (
                    // Radio buttons for single selection
                    <RadioGroup
                      value={groupSelections[group.id]?.[0] || ''}
                      onValueChange={(value) => {
                        const modifier = group.modifiers.find((m: any) => m.id === value);
                        if (modifier) handleRadioChange(group.id, modifier);
                      }}
                    >
                      {group.modifiers?.map((modifier: any) => (
                        <div key={modifier.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value={modifier.id} id={modifier.id} />
                            <Label htmlFor={modifier.id} className="cursor-pointer">
                              {modifier.name}
                            </Label>
                          </div>
                          {modifier.price > 0 && (
                            <span className="text-sm text-muted-foreground">
                              +RM {modifier.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    // Checkboxes for multiple selections
                    <div className="space-y-2">
                      {group.modifiers?.map((modifier: any) => (
                        <div key={modifier.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={modifier.id}
                              checked={groupSelections[group.id]?.includes(modifier.id)}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange(group.id, modifier, checked as boolean)
                              }
                            />
                            <Label htmlFor={modifier.id} className="cursor-pointer">
                              {modifier.name}
                            </Label>
                          </div>
                          {modifier.price > 0 && (
                            <span className="text-sm text-muted-foreground">
                              +RM {modifier.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm">
            {getTotalModifierPrice() > 0 && (
              <span className="font-semibold">
                Additional: +RM {getTotalModifierPrice().toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSkip}>
              Skip
            </Button>
            <Button onClick={handleConfirm} disabled={!canConfirm()}>
              Add to Cart
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
