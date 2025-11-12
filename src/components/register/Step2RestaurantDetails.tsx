import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { BusinessHoursPicker } from './BusinessHoursPicker';
import type { RegistrationData } from '@/hooks/useRegistrationWizard';

interface Step2Props {
  data: Partial<RegistrationData>;
  onUpdate: (updates: Partial<RegistrationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const BUSINESS_TYPES = [
  'Cafe', 'Restaurant', 'Fast Food', 'Fine Dining', 
  'Food Truck', 'Bakery', 'Bar', 'Catering'
];

const CUISINE_TYPES = [
  'Malaysian', 'Chinese', 'Western', 'Japanese', 'Korean',
  'Thai', 'Indian', 'Italian', 'Mexican', 'Mediterranean'
];

const TIMEZONES = [
  { value: 'Asia/Kuala_Lumpur', label: 'Malaysia (GMT+8)' },
  { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
  { value: 'Asia/Bangkok', label: 'Thailand (GMT+7)' },
  { value: 'Asia/Jakarta', label: 'Indonesia (GMT+7)' },
];

export function Step2RestaurantDetails({ data, onUpdate, onNext, onPrev }: Step2Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!data.businessType) newErrors.businessType = 'Business type is required';
    if (!data.cuisineTypes || data.cuisineTypes.length === 0) {
      newErrors.cuisineTypes = 'Select at least one cuisine type';
    }
    if (!data.address?.trim()) newErrors.address = 'Address is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Business Type *</Label>
        <Select
          value={data.businessType}
          onValueChange={(value) => onUpdate({ businessType: value })}
        >
          <SelectTrigger className="bg-background/50">
            <SelectValue placeholder="Select business type" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map(type => (
              <SelectItem key={type} value={type.toLowerCase()}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.businessType && <p className="text-sm text-danger mt-1">{errors.businessType}</p>}
      </div>

      <div>
        <Label>Cuisine Types * (Select multiple)</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {CUISINE_TYPES.map(cuisine => (
            <div key={cuisine} className="flex items-center gap-2">
              <Checkbox
                id={`cuisine-${cuisine}`}
                checked={data.cuisineTypes?.includes(cuisine)}
                onCheckedChange={(checked) => {
                  const current = data.cuisineTypes || [];
                  if (checked) {
                    onUpdate({ cuisineTypes: [...current, cuisine] });
                  } else {
                    onUpdate({ cuisineTypes: current.filter(c => c !== cuisine) });
                  }
                }}
              />
              <Label htmlFor={`cuisine-${cuisine}`} className="text-sm cursor-pointer">
                {cuisine}
              </Label>
            </div>
          ))}
        </div>
        {errors.cuisineTypes && <p className="text-sm text-danger mt-1">{errors.cuisineTypes}</p>}
      </div>

      <div>
        <Label>Address *</Label>
        <Textarea
          value={data.address || ''}
          onChange={(e) => onUpdate({ address: e.target.value })}
          placeholder="Full restaurant address"
          rows={3}
          className="bg-background/50"
        />
        {errors.address && <p className="text-sm text-danger mt-1">{errors.address}</p>}
      </div>

      <div>
        <Label>Timezone</Label>
        <Select
          value={data.timezone}
          onValueChange={(value) => onUpdate({ timezone: value })}
        >
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map(tz => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Business Hours</Label>
        <BusinessHoursPicker
          hours={data.businessHours}
          onChange={(hours) => onUpdate({ businessHours: hours })}
        />
      </div>

      <div>
        <Label>Currency</Label>
        <Select
          value={data.currency}
          onValueChange={(value) => onUpdate({ currency: value })}
        >
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MYR">MYR (RM)</SelectItem>
            <SelectItem value="SGD">SGD ($)</SelectItem>
            <SelectItem value="THB">THB (฿)</SelectItem>
            <SelectItem value="IDR">IDR (Rp)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue to Branch Setup
        </Button>
      </div>
    </form>
  );
}