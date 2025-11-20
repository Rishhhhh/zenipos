import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveModal } from '@/components/pos/ResponsiveModal';
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
      
      // OPTIMIZED: Single eager-loaded query combining all 3 steps
      const { data: item, error: itemError } = await supabase
        .from('menu_items')
        .select(`
          category_id,
          menu_categories!inner (
            category_modifier_groups (
              sort_order,
              modifier_groups (
                id,
                name,
                min_selections,
                max_selections,
                modifiers (
                  id,
                  name,
                  price
                )
              )
            )
          )
        `)
        .eq('id', menuItemId)
        .single();

      if (itemError) {
        console.error('Error fetching menu item:', itemError);
        throw itemError;
      }

      if (!item?.category_id || !item.menu_categories?.category_modifier_groups) {
        console.warn('Menu item has no category or modifiers assigned');
        return [];
      }

      // Extract and flatten modifier groups
      const groups = item.menu_categories.category_modifier_groups
        .map((cmg: any) => cmg.modifier_groups)
        .filter((group: any) => group !== null);

      console.log('✅ Modifier groups loaded:', groups?.length || 0, 'groups');
      return groups || [];
    },
    enabled: open && !!menuItemId && menuItemId.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - cache modifiers
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in memory
  });

  // Reset selections when modal opens
  useEffect(() => {
    if (open) {
      setSelectedModifiers([]);
      setGroupSelections({});
    }
  }, [open]);

  // Auto-skip when no modifiers exist (after render, not during)
  useEffect(() => {
    if (open && !isLoading && modifierData?.length === 0) {
      console.log('⏭️ No modifiers for item, auto-skipping');
      const timer = setTimeout(() => {
        handleSkip();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, isLoading, modifierData]);

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

  // Return null if no modifiers (useEffect will handle auto-skip)
  if (!modifierData || modifierData.length === 0) {
    return null;
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Customize: ${menuItemName}`}
      description="Select your options"
      side="bottom"
      className="max-w-2xl"
    >
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

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t mt-4">
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
      </div>
    </ResponsiveModal>
  );
}
