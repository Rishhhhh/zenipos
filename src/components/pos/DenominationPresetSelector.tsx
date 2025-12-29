import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Save, Star, Trash2, Loader2, ChevronDown, Bookmark, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface DenominationPreset {
  id: string;
  name: string;
  denominations: Record<string, number>;
  is_default: boolean;
  preset_type: string;
}

interface DenominationPresetSelectorProps {
  employeeId: string;
  organizationId: string;
  branchId?: string;
  presetType: 'opening' | 'closing' | 'both';
  currentDenominations: Record<number, number>;
  onSelectPreset: (denominations: Record<number, number>) => void;
}

export function DenominationPresetSelector({
  employeeId,
  organizationId,
  branchId,
  presetType,
  currentDenominations,
  onSelectPreset,
}: DenominationPresetSelectorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPresetName, setNewPresetName] = useState('');
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);

  const { data: presets, isLoading } = useQuery({
    queryKey: ['denomination-presets', employeeId, presetType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('denomination_presets')
        .select('*')
        .eq('employee_id', employeeId)
        .in('preset_type', [presetType, 'both'])
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      return data as DenominationPreset[];
    },
  });

  const savePreset = useMutation({
    mutationFn: async ({ name, makeDefault }: { name: string; makeDefault: boolean }) => {
      const denomsForStorage: Record<string, number> = {};
      Object.entries(currentDenominations).forEach(([key, value]) => {
        denomsForStorage[key] = value;
      });

      if (makeDefault && presets?.length) {
        await supabase
          .from('denomination_presets')
          .update({ is_default: false })
          .eq('employee_id', employeeId)
          .in('preset_type', [presetType, 'both']);
      }

      const { error } = await supabase.from('denomination_presets').insert({
        employee_id: employeeId,
        organization_id: organizationId,
        branch_id: branchId,
        name,
        preset_type: presetType,
        denominations: denomsForStorage,
        is_default: makeDefault,
      });

      if (error) throw error;
    },
    onSuccess: (_, { name }) => {
      toast({ title: 'Preset Saved', description: `"${name}" saved successfully` });
      queryClient.invalidateQueries({ queryKey: ['denomination-presets'] });
      setNewPresetName('');
      setSavePopoverOpen(false);
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    },
  });

  const deletePreset = useMutation({
    mutationFn: async (presetId: string) => {
      const { error } = await supabase
        .from('denomination_presets')
        .delete()
        .eq('id', presetId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Preset Deleted' });
      queryClient.invalidateQueries({ queryKey: ['denomination-presets'] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
    },
  });

  const setAsDefault = useMutation({
    mutationFn: async (presetId: string) => {
      await supabase
        .from('denomination_presets')
        .update({ is_default: false })
        .eq('employee_id', employeeId);

      const { error } = await supabase
        .from('denomination_presets')
        .update({ is_default: true })
        .eq('id', presetId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Default Updated' });
      queryClient.invalidateQueries({ queryKey: ['denomination-presets'] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    },
  });

  const handleSelectPreset = (preset: DenominationPreset) => {
    const numericDenoms: Record<number, number> = {};
    Object.entries(preset.denominations).forEach(([key, value]) => {
      numericDenoms[parseFloat(key)] = value as number;
    });
    onSelectPreset(numericDenoms);
    toast({ title: 'Preset Loaded', description: `"${preset.name}" applied` });
  };

  const hasCurrentDenominations = Object.values(currentDenominations).some((v) => v > 0);
  const hasPresets = presets && presets.length > 0;

  return (
    <div className="flex items-center gap-2">
      {/* Load/Manage Presets Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-2 bg-background border-border hover:bg-muted"
            disabled={isLoading}
          >
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">Presets</span>
            {hasPresets && (
              <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                {presets.length}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-popover border-border z-50">
          {hasPresets ? (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Quick Load
              </div>
              {presets.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {preset.is_default ? (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <Bookmark className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{preset.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    {!preset.is_default && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAsDefault.mutate(preset.id);
                        }}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreset.mutate(preset.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No presets saved yet</p>
              <p className="text-xs mt-1">Save your current count as a preset</p>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save Preset Button */}
      <Popover open={savePopoverOpen} onOpenChange={setSavePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!hasCurrentDenominations}
            className="h-9 gap-2"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 bg-popover border-border z-50" align="end">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm">Save as Preset</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Quick-load this count next time
              </p>
            </div>
            <Input
              placeholder="e.g. Morning Float RM200"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="h-10"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!newPresetName.trim() || savePreset.isPending}
                onClick={() => savePreset.mutate({ name: newPresetName.trim(), makeDefault: false })}
                className="h-9"
              >
                {savePreset.isPending && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
                Save
              </Button>
              <Button
                size="sm"
                disabled={!newPresetName.trim() || savePreset.isPending}
                onClick={() => savePreset.mutate({ name: newPresetName.trim(), makeDefault: true })}
                className="h-9 gap-1.5"
              >
                <Star className="h-3.5 w-3.5" />
                Default
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}