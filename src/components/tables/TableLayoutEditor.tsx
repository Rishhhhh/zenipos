import { useState } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, X, Grid3x3 } from 'lucide-react';

interface TableLayoutEditorProps {
  tables: any[];
  onExit: () => void;
  onSave: () => void;
}

export function TableLayoutEditor({ tables, onExit, onSave }: TableLayoutEditorProps) {
  const { toast } = useToast();
  const [positions, setPositions] = useState(
    tables.reduce((acc, t) => ({
      ...acc,
      [t.id]: { x: t.grid_x || 0, y: t.grid_y || 0 }
    }), {} as Record<string, { x: number; y: number }>)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement to activate drag
      }
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const tableId = active.id as string;
    
    setPositions(prev => {
      const currentPos = prev[tableId];
      if (!currentPos) return prev;
      
      return {
        ...prev,
        [tableId]: {
          x: currentPos.x + Math.round(delta.x / 100), // Grid snapping
          y: currentPos.y + Math.round(delta.y / 100),
        }
      };
    });
  };

  const handleReset = () => {
    const newPositions = tables.reduce((acc, table, index) => {
      const gridX = (index % 6) * 2;
      const gridY = Math.floor(index / 6) * 2;
      return {
        ...acc,
        [table.id]: { x: gridX, y: gridY }
      };
    }, {} as Record<string, { x: number; y: number }>);
    
    setPositions(newPositions);
    toast({
      title: 'Layout Reset',
      description: 'Tables arranged in neat 6-column grid',
    });
  };

  const handleSave = async () => {
    const updates = tables.map(table => {
      const pos = positions[table.id];
      return {
        id: table.id,
        label: table.label,
        organization_id: table.organization_id,
        branch_id: table.branch_id,
        grid_x: pos.x,
        grid_y: pos.y,
      };
    });

    const { error } = await supabase
      .from('tables')
      .upsert(updates);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save layout',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Layout Saved',
      description: 'Table positions updated',
    });
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur z-[10100]">
      <div className="h-full flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Layout Editor</h2>
            <span className="text-sm text-muted-foreground">
              Drag tables to reposition
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onExit}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <Grid3x3 className="h-4 w-4 mr-2" />
              Reset Layout
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Layout
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-8 bg-muted/20">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div 
              className="relative min-h-[800px] min-w-[1200px]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                `,
                backgroundSize: '100px 100px'
              }}
            >
              {tables.map(table => {
                const pos = positions[table.id];
                return (
                  <Card
                    key={table.id}
                    className="absolute w-32 h-32 cursor-move hover:shadow-xl transition-shadow"
                    style={{
                      left: `${pos.x * 100 + 50}px`,
                      top: `${pos.y * 100 + 50}px`,
                    }}
                  >
                    <div className="p-4 flex flex-col items-center justify-center h-full">
                      <div className="text-2xl font-bold">{table.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {table.seats} seats
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
