import { DeviceType } from '@/hooks/useDeviceDetection';

/**
 * Responsive grid configurations for different device types
 * Provides consistent grid column counts across the application
 */
export const GRID_CONFIGS = {
  mobile: {
    menuItems: 'grid-cols-2',
    tables: 'grid-cols-2',
    adminModules: 'grid-cols-1',
    kdsOrders: 'grid-cols-1',
    statsCards: 'grid-cols-2',
    widgets: 'grid-cols-1'
  },
  'portrait-tablet': {
    menuItems: 'grid-cols-3',
    tables: 'grid-cols-3',
    adminModules: 'grid-cols-2',
    kdsOrders: 'grid-cols-2',
    statsCards: 'grid-cols-3',
    widgets: 'grid-cols-2'
  },
  'landscape-tablet': {
    menuItems: 'grid-cols-4',
    tables: 'grid-cols-4',
    adminModules: 'grid-cols-3',
    kdsOrders: 'grid-cols-3',
    statsCards: 'grid-cols-4',
    widgets: 'grid-cols-3'
  },
  desktop: {
    menuItems: 'grid-cols-3 xl:grid-cols-4',
    tables: 'grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
    adminModules: 'grid-cols-3 xl:grid-cols-4',
    kdsOrders: 'grid-cols-3 xl:grid-cols-4',
    statsCards: 'grid-cols-4',
    widgets: 'grid-cols-4'
  }
} as const;

export type GridType = keyof typeof GRID_CONFIGS['mobile'];

/**
 * Get grid classes for a specific grid type and device
 * @param type - Type of grid (menuItems, tables, etc.)
 * @param device - Current device type
 * @returns Tailwind grid column classes
 */
export function getGridClasses(type: GridType, device: DeviceType): string {
  return GRID_CONFIGS[device][type];
}

/**
 * Responsive gap sizes for different device types
 */
export const GAP_CONFIGS = {
  mobile: 'gap-2',
  'portrait-tablet': 'gap-3',
  'landscape-tablet': 'gap-4',
  desktop: 'gap-4'
} as const;

/**
 * Get gap classes for current device
 */
export function getGapClasses(device: DeviceType): string {
  return GAP_CONFIGS[device];
}

/**
 * Responsive padding sizes for containers
 */
export const PADDING_CONFIGS = {
  mobile: 'p-3',
  'portrait-tablet': 'p-4',
  'landscape-tablet': 'p-5',
  desktop: 'p-6'
} as const;

/**
 * Get padding classes for current device
 */
export function getPaddingClasses(device: DeviceType): string {
  return PADDING_CONFIGS[device];
}

/**
 * Complete device configuration tokens
 * Use these for consistent sizing, spacing, and behavior across devices
 */
export const DEVICE_CONFIG = {
  mobile: {
    padding: '0.75rem',
    gap: '0.5rem',
    fontSize: '14px',
    cardMinHeight: '100px',
    touchTarget: '48px',
    disableAnimations: true,
    disableBlur: true,
    maxColumns: 2
  },
  'portrait-tablet': {
    padding: '1rem',
    gap: '0.75rem',
    fontSize: '15px',
    cardMinHeight: '120px',
    touchTarget: '44px',
    disableAnimations: false,
    disableBlur: false,
    maxColumns: 3
  },
  'landscape-tablet': {
    padding: '1.25rem',
    gap: '1rem',
    fontSize: '15px',
    cardMinHeight: '140px',
    touchTarget: '44px',
    disableAnimations: false,
    disableBlur: false,
    maxColumns: 4
  },
  desktop: {
    padding: '1.5rem',
    gap: '1rem',
    fontSize: '16px',
    cardMinHeight: '160px',
    touchTarget: 'auto',
    disableAnimations: false,
    disableBlur: false,
    maxColumns: 6
  }
} as const;

/**
 * Get complete device configuration
 */
export function getDeviceConfig(device: DeviceType) {
  return DEVICE_CONFIG[device];
}
