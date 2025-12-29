import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Save, Star, Trash2, Loader2, FolderOpen } from 'lucide-react';
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

  // Fetch presets for this employee
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

  // Save preset mutation
  const savePreset = useMutation({
    mutationFn: async ({ name, makeDefault }: { name: string; makeDefault: boolean }) => {
      // Convert denominations to string keys for JSONB storage
      const denomsForStorage: Record<string, number> = {};
      Object.entries(currentDenominations).forEach(([key, value]) => {
        denomsForStorage[key] = value;
      });

      // If making default, unset other defaults first
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

  // Delete preset mutation
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

  // Set as default mutation
  const setAsDefault = useMutation({
    mutationFn: async (presetId: string) => {
      // Unset all defaults first
      await supabase
        .from('denomination_presets')
        .update({ is_default: false })
        .eq('employee_id', employeeId);

      // Set new default
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

  const handleSelectPreset = (presetId: string) => {
    const preset = presets?.find((p) => p.id === presetId);
    if (preset) {
      // Convert string keys back to numbers
      const numericDenoms: Record<number, number> = {};
      Object.entries(preset.denominations).forEach(([key, value]) => {
        numericDenoms[parseFloat(key)] = value as number;
      });
      onSelectPreset(numericDenoms);
      toast({ title: 'Preset Loaded', description: `"${preset.name}" applied` });
    }
  };

  const hasCurrentDenominations = Object.values(currentDenominations).some((v) => v > 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Load Preset Dropdown */}
      <Select onValueChange={handleSelectPreset} disabled={isLoading || !presets?.length}>
        <SelectTrigger className="w-[160px] h-8 text-sm">
          <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
          <SelectValue placeholder={isLoading ? 'Loading...' : 'Load Preset'} />
        </SelectTrigger>
        <SelectContent>
          {presets?.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              <div className="flex items-center gap-2">
                {preset.is_default && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                <span>{preset.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Save Preset Button */}
      <Popover open={savePopoverOpen} onOpenChange={setSavePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasCurrentDenominations}
            className="h-8"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save Preset
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-3">
            <div className="text-sm font-medium">Save Current as Preset</div>
            <Input
              placeholder="Preset name (e.g. Morning Float)"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="h-8"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!newPresetName.trim() || savePreset.isPending}
                onClick={() => savePreset.mutate({ name: newPresetName.trim(), makeDefault: false })}
                className="flex-1"
              >
                {savePreset.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Save
              </Button>
              <Button
                size="sm"
                disabled={!newPresetName.trim() || savePreset.isPending}
                onClick={() => savePreset.mutate({ name: newPresetName.trim(), makeDefault: true })}
                className="flex-1"
              >
                <Star className="h-3 w-3 mr-1" />
                Save as Default
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Quick actions for existing presets */}
      {presets && presets.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
              Manage ({presets.length})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-2">
              <div className="text-sm font-medium mb-2">Saved Presets</div>
              {presets.map((preset) => (
                <div key={preset.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    {preset.is_default && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />}
                    <span className="text-sm">{preset.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!preset.is_default && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setAsDefault.mutate(preset.id)}
                        disabled={setAsDefault.isPending}
                      >
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => deletePreset.mutate(preset.id)}
                      disabled={deletePreset.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}