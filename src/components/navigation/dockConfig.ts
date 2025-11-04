import { Monitor, ChefHat, Flame, Package, BarChart3, Settings, Moon, Sun, LogOut, FileText, BookOpen, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AppRole = 'cashier' | 'manager' | 'admin';

export interface DockApp {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  shortcut: string;
  roles: AppRole[];
}

export interface DockUtility {
  id: string;
  label: string;
  icon: LucideIcon;
  iconDark?: LucideIcon;
  action: 'theme' | 'logout';
  shortcut: string;
}

export const DOCK_APPS: DockApp[] = [
  {
    id: 'pos',
    label: 'POS',
    icon: Monitor,
    route: '/pos',
    shortcut: '⌘1',
    roles: ['cashier', 'manager', 'admin'],
  },
  {
    id: 'tables',
    label: 'Tables',
    icon: LayoutGrid,
    route: '/tables',
    shortcut: '⌘2',
    roles: ['cashier', 'manager', 'admin'],
  },
  {
    id: 'kds',
    label: 'Kitchen',
    icon: ChefHat,
    route: '/kds',
    shortcut: '⌘3',
    roles: ['cashier', 'manager', 'admin'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    route: '/admin/inventory',
    shortcut: '⌘4',
    roles: ['manager', 'admin'],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    route: '/admin/reports',
    shortcut: '⌘5',
    roles: ['manager', 'admin'],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Settings,
    route: '/admin',
    shortcut: '⌘6',
    roles: ['admin'],
  },
  {
    id: 'changelog',
    label: 'Changelog',
    icon: FileText,
    route: '/changelog',
    shortcut: '⌘8',
    roles: ['manager', 'admin'],
  },
  {
    id: 'docs',
    label: 'Docs',
    icon: BookOpen,
    route: '/documentation',
    shortcut: '⌘9',
    roles: ['manager', 'admin'],
  },
  {
    id: 'expo',
    label: 'Expo Station',
    icon: Flame,
    route: '/expo-station',
    shortcut: '⌘E',
    roles: ['admin'],
  },
];

export const DOCK_UTILITIES: DockUtility[] = [
  {
    id: 'theme',
    label: 'Theme',
    icon: Sun,
    iconDark: Moon,
    action: 'theme',
    shortcut: '⌘T',
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: LogOut,
    action: 'logout',
    shortcut: '⌘Q',
  },
];

export function getVisibleApps(role: AppRole | null): DockApp[] {
  if (!role) return [];
  return DOCK_APPS.filter(app => app.roles.includes(role));
}
