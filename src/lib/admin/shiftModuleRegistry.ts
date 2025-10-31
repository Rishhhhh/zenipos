import { Clock, Coffee, DollarSign, TrendingUp } from 'lucide-react';

export const shiftManagementModule = {
  id: 'shift-management',
  title: 'Shift Management',
  description: 'Employee clock in/out, breaks, and performance tracking',
  icon: Clock,
  route: '/admin/shift-management',
  category: 'employees',
  features: [
    'Clock In/Out with PIN',
    'NFC Badge Support',
    'Break Management',
    'Shift Performance',
    'Labor Cost Tracking',
  ],
  priority: 'high' as const,
};

export const laborCostModule = {
  id: 'labor-cost',
  title: 'Labor Cost Analytics',
  description: 'Real-time labor cost tracking and budget compliance',
  icon: DollarSign,
  category: 'analytics',
  features: [
    'Real-time Labor %',
    'Overtime Alerts',
    'Schedule vs Actual',
    'Budget Compliance',
  ],
  priority: 'high' as const,
};
