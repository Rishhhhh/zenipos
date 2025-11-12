import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface BusinessHoursPickerProps {
  hours: Record<string, { open: string; close: string }> | undefined;
  onChange: (hours: Record<string, { open: string; close: string }>) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function BusinessHoursPicker({ hours = {}, onChange }: BusinessHoursPickerProps) {
  const handleTimeChange = (day: string, type: 'open' | 'close', value: string) => {
    onChange({
      ...hours,
      [day.toLowerCase()]: {
        ...hours[day.toLowerCase()],
        [type]: value
      }
    });
  };

  const handleClosedToggle = (day: string, closed: boolean) => {
    if (closed) {
      onChange({
        ...hours,
        [day.toLowerCase()]: { open: 'closed', close: 'closed' }
      });
    } else {
      onChange({
        ...hours,
        [day.toLowerCase()]: { open: '09:00', close: '22:00' }
      });
    }
  };

  return (
    <div className="space-y-3 mt-2">
      {DAYS.map(day => {
        const dayKey = day.toLowerCase();
        const dayHours = hours[dayKey] || { open: '09:00', close: '22:00' };
        const isClosed = dayHours.open === 'closed';

        return (
          <div key={day} className="flex items-center gap-4">
            <div className="w-28">
              <span className="text-sm font-medium">{day}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id={`closed-${day}`}
                checked={isClosed}
                onCheckedChange={(checked) => handleClosedToggle(day, checked as boolean)}
              />
              <Label htmlFor={`closed-${day}`} className="text-sm">
                Closed
              </Label>
            </div>

            {!isClosed && (
              <>
                <Input
                  type="time"
                  value={dayHours.open}
                  onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                  className="w-32"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={dayHours.close}
                  onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                  className="w-32"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}