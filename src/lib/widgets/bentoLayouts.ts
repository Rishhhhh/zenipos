/**
 * Bento Layouts - Fixed role-specific widget arrangements
 * Defines preset bento grids for staff, manager, and owner roles
 */

import { BentoWidgetPosition, BentoGridTemplate } from './bentoGrid';

export interface BentoLayout {
  role: 'staff' | 'manager' | 'owner';
  widgets: BentoWidgetPosition[];
  gridTemplate: BentoGridTemplate;
}

/**
 * STAFF LAYOUT (3-6 essential widgets)
 * Focus: POS operations, order management, basic shift tracking
 */
export const STAFF_DESKTOP_LAYOUT: BentoLayout = {
  role: 'staff',
  gridTemplate: {
    columns: 'repeat(4, 1fr)',
    rows: 'repeat(2, 1fr)',
    gap: '1rem',
    minHeight: '100%',
    areas: [
      ['orders', 'orders', 'pos', 'pos'],
      ['eighty-six', 'eighty-six', 'pos', 'pos']
    ]
  },
  widgets: [
    {
      id: 'quick-pos',
      area: 'pos',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'active-orders',
      area: 'orders',
      colSpan: 2,
      rowSpan: 2,
      isMinimized: false
    },
    {
      id: 'eighty-six',
      area: 'eighty-six',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    }
  ]
};

export const STAFF_TABLET_LAYOUT: BentoLayout = {
  role: 'staff',
  gridTemplate: {
    columns: 'repeat(2, 1fr)',
    rows: 'repeat(3, 1fr)',
    gap: '0.875rem',
    minHeight: '100%',
    areas: [
      ['orders', 'orders'],
      ['pos', 'pos'],
      ['eighty-six', 'eighty-six']
    ]
  },
  widgets: [
    {
      id: 'quick-pos',
      area: 'pos',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'active-orders',
      area: 'orders',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'eighty-six',
      area: 'eighty-six',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    }
  ]
};

export const STAFF_MOBILE_LAYOUT: BentoLayout = {
  role: 'staff',
  gridTemplate: {
    columns: '1fr',
    rows: 'repeat(3, minmax(200px, auto))',
    gap: '0.75rem',
    minHeight: 'auto',
    areas: [
      ['orders'],
      ['pos'],
      ['eighty-six']
    ]
  },
  widgets: [
    {
      id: 'quick-pos',
      area: 'pos',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'active-orders',
      area: 'orders',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'eighty-six',
      area: 'eighty-six',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    }
  ]
};

/**
 * MANAGER LAYOUT (6-9 operational widgets)
 * Focus: Sales monitoring, labor management, inventory oversight
 */
export const MANAGER_DESKTOP_LAYOUT: BentoLayout = {
  role: 'manager',
  gridTemplate: {
    columns: 'repeat(4, 1fr)',
    rows: 'repeat(3, 1fr)',
    gap: '1rem',
    minHeight: '100%',
    areas: [
      ['sales', 'sales', 'orders', 'shifts'],
      ['revenue', 'revenue', 'orders', 'labor'],
      ['top-items', 'top-items', 'top-items', 'top-items']
    ]
  },
  widgets: [
    {
      id: 'sales',
      area: 'sales',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'active-orders',
      area: 'orders',
      colSpan: 1,
      rowSpan: 2,
      isMinimized: false
    },
    {
      id: 'active-shifts',
      area: 'shifts',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'revenue-chart',
      area: 'revenue',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'labor-cost',
      area: 'labor',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'top-items',
      area: 'top-items',
      colSpan: 4,
      rowSpan: 1,
      isMinimized: false
    }
  ]
};

export const MANAGER_TABLET_LAYOUT: BentoLayout = {
  role: 'manager',
  gridTemplate: {
    columns: 'repeat(2, 1fr)',
    rows: 'repeat(5, 1fr)',
    gap: '0.875rem',
    minHeight: '100%',
    areas: [
      ['sales', 'sales'],
      ['orders', 'shifts'],
      ['revenue', 'revenue'],
      ['labor', 'labor'],
      ['top-items', 'top-items']
    ]
  },
  widgets: [
    {
      id: 'sales',
      area: 'sales',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'active-orders',
      area: 'orders',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'active-shifts',
      area: 'shifts',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'revenue-chart',
      area: 'revenue',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'labor-cost',
      area: 'labor',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'top-items',
      area: 'top-items',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    }
  ]
};

export const MANAGER_MOBILE_LAYOUT: BentoLayout = {
  role: 'manager',
  gridTemplate: {
    columns: '1fr',
    rows: 'repeat(6, minmax(200px, auto))',
    gap: '0.75rem',
    minHeight: 'auto',
    areas: [
      ['sales'],
      ['orders'],
      ['revenue'],
      ['shifts'],
      ['labor'],
      ['top-items']
    ]
  },
  widgets: [
    {
      id: 'sales',
      area: 'sales',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'active-orders',
      area: 'orders',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'revenue-chart',
      area: 'revenue',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'active-shifts',
      area: 'shifts',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'labor-cost',
      area: 'labor',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'top-items',
      area: 'top-items',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    }
  ]
};

/**
 * OWNER LAYOUT (10-12 analytical widgets)
 * Focus: Business analytics, performance metrics, comprehensive oversight
 */
export const OWNER_DESKTOP_LAYOUT: BentoLayout = {
  role: 'owner',
  gridTemplate: {
    columns: 'repeat(4, 1fr)',
    rows: 'repeat(4, 1fr)',
    gap: '1rem',
    minHeight: '100%',
    areas: [
      ['sales', 'sales', 'revenue', 'revenue'],
      ['orders', 'shifts', 'revenue', 'revenue'],
      ['labor', 'top-items', 'top-items', 'loyalty'],
      ['low-stock', 'web-vitals', 'web-vitals', 'web-vitals']
    ]
  },
  widgets: [
    {
      id: 'sales',
      area: 'sales',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'revenue-chart',
      area: 'revenue',
      colSpan: 2,
      rowSpan: 2,
      isMinimized: false
    },
    {
      id: 'active-orders',
      area: 'orders',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'active-shifts',
      area: 'shifts',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'labor-cost',
      area: 'labor',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'top-items',
      area: 'top-items',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'loyalty-stats',
      area: 'loyalty',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'low-stock',
      area: 'low-stock',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'web-vitals',
      area: 'web-vitals',
      colSpan: 3,
      rowSpan: 1,
      isMinimized: false
    }
  ]
};

export const OWNER_TABLET_LAYOUT: BentoLayout = {
  role: 'owner',
  gridTemplate: {
    columns: 'repeat(2, 1fr)',
    rows: 'repeat(6, 1fr)',
    gap: '0.875rem',
    minHeight: '100%',
    areas: [
      ['sales', 'sales'],
      ['revenue', 'revenue'],
      ['orders', 'shifts'],
      ['labor', 'top-items'],
      ['low-stock', 'loyalty'],
      ['web-vitals', 'web-vitals']
    ]
  },
  widgets: [
    {
      id: 'sales',
      area: 'sales',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'revenue-chart',
      area: 'revenue',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'active-orders',
      area: 'orders',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'active-shifts',
      area: 'shifts',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'labor-cost',
      area: 'labor',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'top-items',
      area: 'top-items',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'low-stock',
      area: 'low-stock',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'loyalty-stats',
      area: 'loyalty',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'web-vitals',
      area: 'web-vitals',
      colSpan: 2,
      rowSpan: 1,
      isMinimized: false
    }
  ]
};

export const OWNER_MOBILE_LAYOUT: BentoLayout = {
  role: 'owner',
  gridTemplate: {
    columns: '1fr',
    rows: 'repeat(9, minmax(200px, auto))',
    gap: '0.75rem',
    minHeight: 'auto',
    areas: [
      ['sales'],
      ['revenue'],
      ['orders'],
      ['shifts'],
      ['labor'],
      ['top-items'],
      ['low-stock'],
      ['loyalty'],
      ['web-vitals']
    ]
  },
  widgets: [
    {
      id: 'sales',
      area: 'sales',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'revenue-chart',
      area: 'revenue',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'active-orders',
      area: 'orders',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'active-shifts',
      area: 'shifts',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'labor-cost',
      area: 'labor',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'top-items',
      area: 'top-items',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'low-stock',
      area: 'low-stock',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'loyalty-stats',
      area: 'loyalty',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    },
    {
      id: 'web-vitals',
      area: 'web-vitals',
      colSpan: 1,
      rowSpan: 1,
      isMinimized: false
    }
  ]
};

/**
 * Get layout for specific role and breakpoint
 */
export function getBentoLayoutForRole(
  role: 'staff' | 'manager' | 'owner',
  breakpoint: 'mobile' | 'tablet' | 'desktop' = 'desktop'
): BentoLayout {
  const layoutMap = {
    staff: {
      desktop: STAFF_DESKTOP_LAYOUT,
      tablet: STAFF_TABLET_LAYOUT,
      mobile: STAFF_MOBILE_LAYOUT
    },
    manager: {
      desktop: MANAGER_DESKTOP_LAYOUT,
      tablet: MANAGER_TABLET_LAYOUT,
      mobile: MANAGER_MOBILE_LAYOUT
    },
    owner: {
      desktop: OWNER_DESKTOP_LAYOUT,
      tablet: OWNER_TABLET_LAYOUT,
      mobile: OWNER_MOBILE_LAYOUT
    }
  };

  return layoutMap[role][breakpoint];
}
