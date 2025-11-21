import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Check } from 'lucide-react';

interface TableQuickEditPanelProps {
  table: any;
  onSave: (updates: any) => void;
  onCancel: () => void;
}

export function TableQuickEditPanel({ table, onSave, onCancel }: TableQuickEditPanelProps) {
  const [label, setLabel] = useState(table.label);
  const [seats, setSeats] = useState(table.seats);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Quick Edit: {table.label}</h3>
        <Button size="icon" variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <Label>Table Name</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>

      <div>
        <Label>Seats</Label>
        <Input
          type="number"
          value={seats}
          onChange={(e) => setSeats(parseInt(e.target.value))}
        />
      </div>

      <Button
        className="w-full"
        onClick={() => onSave({ label, seats })}
      >
        <Check className="h-4 w-4 mr-2" />
        Save Changes
      </Button>
    </Card>
  );
}
