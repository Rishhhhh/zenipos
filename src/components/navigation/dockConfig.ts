import { Monitor, ChefHat, Flame, Package, BarChart3, Settings, Moon, Sun, LogOut, FileText, BookOpen, LayoutGrid, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AppRole = 'staff' | 'manager' | 'owner' | 'kitchen';

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
    roles: ['staff', 'manager', 'owner'],
  },
  {
    id: 'tables',
    label: 'Tables',
    icon: LayoutGrid,
    route: '/tables',
    shortcut: '⌘2',
    roles: ['staff', 'manager', 'owner'],
  },
  {
    id: 'kds',
    label: 'Kitchen',
    icon: ChefHat,
    route: '/kds',
    shortcut: '⌘3',
    roles: ['staff', 'manager', 'owner', 'kitchen'],
  },
  {
    id: 'cashbook',
    label: 'Cashbook',
    icon: Wallet,
    route: '/admin/cashbook',
    shortcut: '⌘4',
    roles: ['manager', 'owner'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    route: '/admin/inventory',
    shortcut: '⌘5',
    roles: ['manager', 'owner'],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    route: '/admin/reports',
    shortcut: '⌘6',
    roles: ['manager', 'owner'],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Settings,
    route: '/admin',
    shortcut: '⌘7',
    roles: ['owner'],
  },
  {
    id: 'changelog',
    label: 'Changelog',
    icon: FileText,
    route: '/changelog',
    shortcut: '⌘8',
    roles: ['manager', 'owner'],
  },
  {
    id: 'docs',
    label: 'Docs',
    icon: BookOpen,
    route: '/documentation',
    shortcut: '⌘9',
    roles: ['manager', 'owner'],
  },
  {
    id: 'expo',
    label: 'Expo Station',
    icon: Flame,
    route: '/expo-station',
    shortcut: '⌘E',
    roles: ['owner'],
  },
];

// Speed mode fixed modules (only 4)
export const SPEED_MODE_APP_IDS = ['pos', 'tables', 'cashbook', 'admin'];

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

/**
 * Get visible apps based on role and optional module filter
 * @param role User role
 * @param moduleIds Optional array of module IDs to filter (for speed mode or custom config)
 */
export function getVisibleApps(role: AppRole | null, moduleIds?: string[]): DockApp[] {
  if (!role) return [];
  
  let apps = DOCK_APPS.filter(app => app.roles.includes(role));
  
  // If moduleIds provided, filter to only those modules
  if (moduleIds && moduleIds.length > 0) {
    apps = apps.filter(app => moduleIds.includes(app.id));
    // Sort by the order in moduleIds
    apps.sort((a, b) => moduleIds.indexOf(a.id) - moduleIds.indexOf(b.id));
  }
  
  return apps;
}
