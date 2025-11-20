import { useState } from 'react';
import { ResponsiveModal } from '@/components/pos/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface TableConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: any;
  onSave: (updates: any) => Promise<void>;
}

export function TableConfigModal({ open, onOpenChange, table, onSave }: TableConfigModalProps) {
  const [formData, setFormData] = useState({
    label: table.label || '',
    seats: table.seats || 4,
    custom_name: table.custom_name || '',
    grid_x: table.grid_x || 0,
    grid_y: table.grid_y || 0,
    reservation_name: table.reservation_name || '',
    reservation_time: table.reservation_time ? new Date(table.reservation_time).toISOString().slice(0, 16) : '',
    reservation_contact: table.reservation_contact || '',
    notes: table.notes || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save table config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Configure ${table.label}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="label">Table Name</Label>
          <Input
            id="label"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="seats">Number of Seats</Label>
          <Input
            id="seats"
            type="number"
            min={1}
            max={20}
            value={formData.seats}
            onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="grid_x">Grid Position X</Label>
            <Input
              id="grid_x"
              type="number"
              value={formData.grid_x}
              onChange={(e) => setFormData({ ...formData, grid_x: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="grid_y">Grid Position Y</Label>
            <Input
              id="grid_y"
              type="number"
              value={formData.grid_y}
              onChange={(e) => setFormData({ ...formData, grid_y: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <Separator />
        
        <h3 className="font-semibold">Reservation</h3>
        
        <div>
          <Label htmlFor="reservation_name">Guest Name</Label>
          <Input
            id="reservation_name"
            value={formData.reservation_name}
            onChange={(e) => setFormData({ ...formData, reservation_name: e.target.value })}
            placeholder="Leave empty if not reserved"
          />
        </div>

        <div>
          <Label htmlFor="reservation_time">Reservation Time</Label>
          <Input
            id="reservation_time"
            type="datetime-local"
            value={formData.reservation_time}
            onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="reservation_contact">Contact</Label>
          <Input
            id="reservation_contact"
            value={formData.reservation_contact}
            onChange={(e) => setFormData({ ...formData, reservation_contact: e.target.value })}
            placeholder="Phone or email"
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Special requests, allergies, etc."
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="flex-1"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
