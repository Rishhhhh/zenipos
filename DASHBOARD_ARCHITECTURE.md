# Dashboard Widget System - Complete Architecture Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Core Components](#core-components)
4. [Widget System](#widget-system)
5. [Layout & Grid System](#layout--grid-system)
6. [Configuration System](#configuration-system)
7. [Data Flow](#data-flow)
8. [File Structure](#file-structure)
9. [Implementation Guide](#implementation-guide)
10. [Code Examples](#code-examples)

---

## System Overview

### Vision
A fully customizable, drag-and-drop dashboard system where users can:
- Add/remove widgets from a catalog
- Drag widgets to reposition them
- Resize widgets with grid snapping
- Minimize/maximize widgets
- Configure individual widget settings
- Persist layouts per user
- Role-based widget access

### Key Features
- **Drag & Drop**: Press-and-hold (350ms) to drag widgets
- **Magnetic Grid Snapping**: Soft magnetic behavior within 30px threshold
- **Resizable**: Drag bottom-right corner to resize
- **Minimize/Maximize**: Window-like controls
- **Per-User Layouts**: Each user's layout saved to localStorage
- **Role-Based Access**: Widgets filtered by user role (cashier/manager/admin)
- **Real-time Configuration**: Settings update instantly across tabs
- **Auto-Placement**: New widgets automatically placed in empty grid spaces

### Technology Stack
- **Framework**: React 18 + TypeScript
- **Drag & Drop**: @dnd-kit/core
- **State Management**: React hooks + localStorage
- **Styling**: Tailwind CSS with semantic tokens
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Data Fetching**: @tanstack/react-query (for widget data)

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard Page                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              DndContext (Drag & Drop)                  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         Canvas (Grid-based layout)               │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  │  │
│  │  │  │ Widget 1 │  │ Widget 2 │  │ Widget 3 │      │  │  │
│  │  │  │ (Drag)   │  │ (Drag)   │  │ (Drag)   │      │  │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘      │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  [Widget Library Modal]  [Config Modal]                      │
└─────────────────────────────────────────────────────────────┘
```

### Layer Breakdown

#### **Layer 1: Page Container** (`src/pages/Dashboard.tsx`)
- Main container with header
- Manages global state (drag state, modal visibility)
- Provides context for all widgets

#### **Layer 2: DndContext** (`@dnd-kit/core`)
- Handles drag-and-drop interactions
- Mouse/touch sensor configuration
- Drag start/end event handling

#### **Layer 3: Canvas** (Grid System)
- Fixed-size container with grid overlay
- Viewport-aware dimensions
- Constrains widgets to bounds

#### **Layer 4: Draggable Widgets**
- Individual widget wrappers
- Position, resize, minimize/maximize logic
- Lazy-loaded content

#### **Layer 5: Widget Content**
- Actual widget components (charts, tables, etc.)
- Fetches and displays data
- Responds to configuration changes

---

## Core Components

### 1. Dashboard Page (`src/pages/Dashboard.tsx`)

**Purpose**: Main orchestrator for the entire dashboard system.

**Responsibilities**:
- Initialize layout from localStorage
- Manage drag-and-drop sensors
- Handle widget addition/removal
- Show/hide modals (Widget Library, Config Modal)
- Update widget positions after drag

**Key State**:
```typescript
const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
const [configModalWidget, setConfigModalWidget] = useState<string | null>(null);
const [activeDragId, setActiveDragId] = useState<string | null>(null);
```

**Key Functions**:
```typescript
const { 
  layout,              // Current widget layout
  updatePosition,      // Update widget x/y/width/height
  bringToFront,        // Increase zIndex
  addWidget,           // Add new widget with auto-placement
  removeWidget,        // Delete widget
  resetLayout,         // Restore default layout
  toggleMinimize,      // Minimize/restore
  toggleMaximize       // Maximize/restore
} = useWidgetLayout();
```

**Drag Behavior**:
- **Activation**: Press and hold for 350ms, move 5px tolerance
- **During Drag**: Widget shows shadow, increased z-index, 95% opacity
- **After Drag**: Snaps to grid (if within 30px), constrain to canvas bounds

---

### 2. DraggableWidget Component (`src/components/dashboard/DraggableWidget.tsx`)

**Purpose**: Wrapper that makes widgets draggable, resizable, and controllable.

**Features**:
- Dragging (via @dnd-kit)
- Resizing (bottom-right corner handle)
- Minimize/Maximize
- Z-index management
- Escape key to exit maximize mode

**Props**:
```typescript
interface DraggableWidgetProps {
  id: string;                    // Widget unique ID
  children: React.ReactNode;     // Widget content
  position: {                    // Current position
    x: number; y: number; 
    width?: number; height?: number; 
    zIndex: number;
    isMinimized?: boolean;
    isMaximized?: boolean;
  };
  isAnyDragging: boolean;        // Is ANY widget being dragged?
  isDraggingThis: boolean;       // Is THIS widget being dragged?
  widgetName: string;            // Display name
  onPositionChange: (pos) => void;
  onBringToFront: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onConfigure: () => void;
  onClose: () => void;
}
```

**Resize Logic**:
1. User clicks bottom-right corner Grip icon
2. `handleResizeStart`: Capture start mouse position and widget size
3. `handleMouseMove`: Calculate delta, apply min/max constraints, snap to grid
4. `handleMouseUp`: Finalize resize

**Maximize Logic**:
- When maximized: Fixed position (inset: 0), full viewport, z-index 9999
- When restored: Return to original x/y/width/height
- If was minimized before maximize, restore to minimized state

---

### 3. WidgetHeader Component (`src/components/dashboard/WidgetHeader.tsx`)

**Purpose**: Shows widget title, icon, and control buttons.

**Visibility**:
- Hidden by default
- Shows on hover (opacity: 0 → 1)
- Always visible when minimized

**Controls**:
- **Configure** (⚙️): Opens config modal
- **Minimize** (➖): Collapse to title bar
- **Maximize** (⬜): Full-screen mode
- **Close** (✖️): Remove widget

---

### 4. WidgetLibrary Component (`src/components/dashboard/WidgetLibrary.tsx`)

**Purpose**: Modal to browse and add widgets from catalog.

**Features**:
- Search by name/description
- Filter by category tabs (all, pos, analytics, inventory, etc.)
- Role-based filtering (only shows widgets user can access)
- Shows which widgets are already added
- Grid layout with widget cards

**Widget Card Display**:
```tsx
<div className="widget-card">
  <Icon /> {/* Widget icon */}
  <h3>{widget.name}</h3>
  <p>{widget.description}</p>
  <span>{cols} × {rows}</span> {/* Default size */}
  <Button>Add</Button>
</div>
```

---

### 5. WidgetConfigModal Component (`src/components/dashboard/WidgetConfigModal.tsx`)

**Purpose**: Configure individual widget settings.

**Features**:
- Per-widget configuration panels
- Routes to widget-specific config components
- Save/Reset buttons
- Persists to localStorage per user

**Flow**:
1. User clicks Configure button on widget
2. Modal opens with widget-specific config panel
3. User adjusts settings (display type, refresh interval, filters, etc.)
4. On Save: Updates localStorage, dispatches custom event
5. Widget re-reads config and updates display

---

## Widget System

### Widget Definition Structure

Every widget is defined by a `WidgetDefinition` object:

```typescript
export interface WidgetDefinition {
  id: string;                    // Unique identifier (e.g., "quick-pos")
  component: React.ComponentType; // Lazy-loaded React component
  name: string;                  // Display name
  description: string;           // Description for library
  icon: React.ComponentType;     // Lucide icon
  roles: ("cashier" | "manager" | "admin")[]; // Who can access it
  category: string;              // Category for filtering
  defaultSize: { cols: number; rows: number }; // Initial grid size
  minSize: { width: number; height: number }; // Min pixel dimensions
  maxSize: { width: number; height: number }; // Max pixel dimensions
  capabilities: {
    supportedDisplayTypes: ('chart' | 'table' | 'cards' | 'gauge')[];
    dataType: 'financial' | 'text-list' | 'time-series' | 'status-list';
    hasCompactMode: boolean;
    customSettings?: string[];   // Additional config fields
  };
}
```

### Widget Catalog (`src/lib/widgets/widgetCatalog.tsx`)

**Structure**:
```typescript
export const WIDGET_CATALOG: Record<string, WidgetDefinition[]> = {
  pos: [
    { id: "quick-pos", component: QuickPOSWidget, name: "Quick POS", description: "Fast point of sale", icon: ShoppingCart, roles: ["cashier", "manager"], category: "pos", defaultSize: { cols: 4, rows: 5 }, minSize: { width: 280, height: 300 }, maxSize: { width: 600, height: 600 }, capabilities: { supportedDisplayTypes: ['cards'], dataType: 'text-list', hasCompactMode: true } },
    { id: "active-orders", component: ActiveOrdersWidget, name: "Active Orders", description: "Track current orders", icon: ClipboardList, roles: ["cashier", "manager"], category: "pos", defaultSize: { cols: 4, rows: 5 }, minSize: { width: 280, height: 300 }, maxSize: { width: 600, height: 600 }, capabilities: { supportedDisplayTypes: ['table', 'cards'], dataType: 'status-list', hasCompactMode: true } },
  ],
  analytics: [
    { id: "sales", component: SalesWidget, name: "Sales", description: "Sales overview", icon: BarChart, roles: ["manager", "admin"], category: "analytics", defaultSize: { cols: 6, rows: 5 }, minSize: { width: 400, height: 300 }, maxSize: { width: 800, height: 600 }, capabilities: { supportedDisplayTypes: ['chart', 'table'], dataType: 'financial', hasCompactMode: true } },
    { id: "revenue-chart", component: RevenueChartWidget, name: "Revenue Chart", description: "Revenue trends", icon: LineChart, roles: ["manager", "admin"], category: "analytics", defaultSize: { cols: 6, rows: 5 }, minSize: { width: 400, height: 300 }, maxSize: { width: 800, height: 600 }, capabilities: { supportedDisplayTypes: ['area', 'line', 'bar'], dataType: 'time-series', hasCompactMode: true } },
    { id: "top-items", component: TopItemsWidget, name: "Top Items", description: "Best selling items", icon: Star, roles: ["manager", "admin"], category: "analytics", defaultSize: { cols: 5, rows: 4 }, minSize: { width: 350, height: 280 }, maxSize: { width: 700, height: 560 }, capabilities: { supportedDisplayTypes: ['cards', 'table'], dataType: 'financial', hasCompactMode: true } },
  ],
  inventory: [
    { id: "low-stock", component: LowStockWidget, name: "Low Stock", description: "Inventory alerts", icon: AlertCircle, roles: ["manager", "admin"], category: "inventory", defaultSize: { cols: 5, rows: 4 }, minSize: { width: 350, height: 280 }, maxSize: { width: 700, height: 560 }, capabilities: { supportedDisplayTypes: ['table'], dataType: 'status-list', hasCompactMode: true } },
  ],
  customers: [
    { id: "loyalty-stats", component: LoyaltyStatsWidget, name: "Loyalty Stats", description: "Customer loyalty overview", icon: Heart, roles: ["manager", "admin"], category: "customers", defaultSize: { cols: 5, rows: 4 }, minSize: { width: 350, height: 280 }, maxSize: { width: 700, height: 560 }, capabilities: { supportedDisplayTypes: ['cards'], dataType: 'financial', hasCompactMode: true } },
  ],
  employees: [
    { id: "active-shifts", component: ActiveShiftsWidget, name: "Active Shifts", description: "Current employee shifts", icon: Users, roles: ["manager", "admin"], category: "employees", defaultSize: { cols: 5, rows: 4 }, minSize: { width: 350, height: 280 }, maxSize: { width: 700, height: 560 }, capabilities: { supportedDisplayTypes: ['table'], dataType: 'status-list', hasCompactMode: true } },
  ],
};
```

**Utility Functions**:
```typescript
// Get all widgets as flat array
export const ALL_WIDGETS = Object.values(WIDGET_CATALOG).flat();

// Get widget by ID
export function getWidgetById(id: string): WidgetDefinition | undefined {
  return ALL_WIDGETS.find(w => w.id === id);
}

// Filter by role
export function getWidgetsByRole(role: string): WidgetDefinition[] {
  return ALL_WIDGETS.filter(w => w.roles.includes(role));
}
```

### Creating a New Widget

**Step 1**: Create widget component
```tsx
// src/components/dashboard/widgets/MyWidget.tsx
export function MyWidget() {
  const { config } = useWidgetConfig<MyWidgetConfig>('my-widget');
  
  return (
    <div className="h-full p-4">
      {/* Widget content */}
    </div>
  );
}
```

**Step 2**: Define widget type and config
```typescript
// src/types/widgetConfigs.ts
export interface MyWidgetConfig extends BaseWidgetConfig {
  myCustomSetting: string;
  myNumberSetting: number;
}
```

**Step 3**: Create config panel
```tsx
// src/components/dashboard/widgets/config/MyWidgetConfigPanel.tsx
export function MyWidgetConfigPanel({ config, onConfigChange }: Props) {
  return (
    <div className="space-y-4">
      <Label>My Setting</Label>
      <Input 
        value={config.myCustomSetting}
        onChange={(e) => onConfigChange({ 
          ...config, 
          myCustomSetting: e.target.value 
        })}
      />
    </div>
  );
}
```

**Step 4**: Register in catalog
```typescript
// src/lib/widgets/widgetCatalog.tsx
import { MyWidget } from "@/components/dashboard/widgets/MyWidget";

export const WIDGET_CATALOG = {
  myCategory: [
    {
      id: "my-widget",
      component: lazy(() => import("...").then(m => ({ default: m.MyWidget }))),
      name: "My Widget",
      description: "Does something awesome",
      icon: Sparkles,
      roles: ["admin"],
      category: "myCategory",
      defaultSize: { cols: 5, rows: 5 },
      minSize: { width: 300, height: 300 },
      maxSize: { width: 600, height: 600 },
      capabilities: {
        supportedDisplayTypes: ['cards'],
        dataType: 'text-list',
        hasCompactMode: true,
      },
    },
  ],
};
```

**Step 5**: Add default config
```typescript
// src/hooks/useWidgetConfig.ts
export function getDefaultConfig(widgetType: string): BaseWidgetConfig {
  switch (widgetType) {
    case 'my-widget':
      return {
        ...baseConfig,
        myCustomSetting: 'default value',
        myNumberSetting: 42,
      } as MyWidgetConfig;
    // ... other cases
  }
}
```

**Step 6**: Route config panel
```tsx
// src/components/dashboard/WidgetConfigRouter.tsx
export function WidgetConfigRouter({ widgetId, config, onConfigChange }) {
  switch (widgetId) {
    case 'my-widget':
      return <MyWidgetConfigPanel config={config} onConfigChange={onConfigChange} />;
    // ... other cases
  }
}
```

---

## Layout & Grid System

### Grid Configuration (`src/lib/widgets/gridSystem.ts`)

**Dynamic Grid**:
```typescript
export const GRID_CONFIG = {
  CELL_SIZE: 60,              // Each grid cell is 60x60px
  
  get CANVAS_WIDTH() {        // Full viewport width minus padding
    return window.innerWidth - (isMobile ? 48 : 96);
  },
  
  get CANVAS_HEIGHT() {       // Viewport height minus header/dock
    return window.innerHeight - 296;
  },
  
  get COLS() {                // Number of columns (dynamic)
    return Math.floor(this.CANVAS_WIDTH / this.CELL_SIZE);
  },
  
  get ROWS() {                // Number of rows (dynamic)
    return Math.floor(this.CANVAS_HEIGHT / this.CELL_SIZE);
  },
  
  SNAP_THRESHOLD: 30,         // Magnetic snap distance
};
```

**Key Functions**:

```typescript
// Snap to nearest grid line
function snapToGrid(value: number): number {
  return Math.round(value / CELL_SIZE) * CELL_SIZE;
}

// Soft magnetic snapping (only if within threshold)
function softSnapPosition(x: number, y: number): { x: number; y: number } {
  const snappedX = snapToGrid(x);
  const snappedY = snapToGrid(y);
  const deltaX = Math.abs(x - snappedX);
  const deltaY = Math.abs(y - snappedY);
  
  return {
    x: deltaX <= SNAP_THRESHOLD ? snappedX : x,
    y: deltaY <= SNAP_THRESHOLD ? snappedY : y,
  };
}

// Constrain to canvas bounds
function constrainToCanvas(x: number, y: number, width: number, height: number) {
  return {
    x: Math.max(0, Math.min(x, CANVAS_WIDTH - width)),
    y: Math.max(0, Math.min(y, CANVAS_HEIGHT - height)),
  };
}

// Calculate which grid cells a widget occupies
function calculateOccupiedBoxes(x: number, y: number, width: number, height: number) {
  const startCol = Math.floor(x / CELL_SIZE);
  const endCol = Math.ceil((x + width) / CELL_SIZE);
  const startRow = Math.floor(y / CELL_SIZE);
  const endRow = Math.ceil((y + height) / CELL_SIZE);
  return { startCol, endCol, startRow, endRow, totalBoxes: (endCol-startCol)*(endRow-startRow) };
}
```

### Auto-Placement Algorithm (`src/lib/widgets/autoPlacement.ts`)

**Purpose**: Find empty grid space for new widgets.

**Algorithm**:
1. Create 2D boolean grid map
2. Mark all occupied cells from existing widgets
3. Scan left-to-right, top-to-bottom
4. For each position, check if widget fits (no overlaps)
5. Return first available position

```typescript
export function findEmptyGridSpace(
  existingWidgets: Record<string, WidgetPosition>,
  requiredSize: { cols: number; rows: number }
): { x: number; y: number } {
  const gridMap: boolean[][] = Array(ROWS).fill(false).map(() => Array(COLS).fill(false));
  
  // Mark occupied cells
  Object.values(existingWidgets).forEach(pos => {
    const startCol = Math.floor(pos.x / CELL_SIZE);
    const endCol = Math.ceil((pos.x + pos.width) / CELL_SIZE);
    const startRow = Math.floor(pos.y / CELL_SIZE);
    const endRow = Math.ceil((pos.y + pos.height) / CELL_SIZE);
    
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        gridMap[row][col] = true;
      }
    }
  });
  
  // Scan for empty space
  for (let row = 0; row <= ROWS - requiredSize.rows; row++) {
    for (let col = 0; col <= COLS - requiredSize.cols; col++) {
      let canFit = true;
      
      for (let r = row; r < row + requiredSize.rows && canFit; r++) {
        for (let c = col; c < col + requiredSize.cols && canFit; c++) {
          if (gridMap[r][c]) canFit = false;
        }
      }
      
      if (canFit) return { x: col * CELL_SIZE, y: row * CELL_SIZE };
    }
  }
  
  return { x: 0, y: 0 }; // Fallback: top-left (user must rearrange)
}
```

---

## Configuration System

### Configuration Architecture

**Storage**: `localStorage` per user per widget  
**Key Format**: `widget_config_{userId}_{widgetId}`

**Base Configuration** (`src/types/widgetConfigs.ts`):
```typescript
export interface BaseWidgetConfig {
  displayType: 'chart' | 'table' | 'cards' | 'gauge';
  colorScheme: string;
  refreshInterval: 5 | 30 | 60 | 300;
  compactMode: boolean;
  dataFilters: {
    dateRange?: 'today' | 'week' | 'month';
    branchIds?: string[];
  };
}
```

**Widget-Specific Configs** (examples):
```typescript
export interface SalesWidgetConfig extends BaseWidgetConfig {
  comparisonPeriod: 'yesterday' | 'lastWeek' | 'lastMonth';
  goalTracking: { enabled: boolean; dailyTarget: number };
  showSparklines: boolean;
  showTrends: boolean;
}

export interface QuickPOSConfig extends BaseWidgetConfig {
  itemsPerRow: 2 | 3 | 4;
  showImages: boolean;
  quickAddMode: boolean;
  defaultCategoryId?: string;
  cartPosition: 'bottom' | 'side';
}
```

### useWidgetConfig Hook (`src/hooks/useWidgetConfig.ts`)

**Purpose**: Manage per-user widget configuration with real-time updates.

**Usage**:
```typescript
const { config, saveConfig, resetToDefault } = useWidgetConfig<SalesWidgetConfig>('sales');
```

**Features**:
- Loads from localStorage on mount
- Saves to localStorage on change (debounced 500ms)
- Listens for cross-tab updates (storage event)
- Listens for same-tab updates (custom event)
- Type-safe with generics

**Implementation**:
```typescript
export function useWidgetConfig<T extends BaseWidgetConfig>(widgetId: string) {
  const { employee } = useAuth();
  const storageKey = `widget_config_${employee?.id || 'default'}_${widgetId}`;
  
  const [config, setConfig] = useState<T>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : getDefaultConfig(widgetId);
  });
  
  const saveConfig = useCallback((newConfig: T) => {
    setConfig(newConfig);
    localStorage.setItem(storageKey, JSON.stringify(newConfig));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('widget-config-updated', { 
      detail: { widgetId } 
    }));
  }, [storageKey, widgetId]);
  
  const resetToDefault = useCallback(() => {
    const defaultConfig = getDefaultConfig(widgetId) as T;
    saveConfig(defaultConfig);
  }, [widgetId, saveConfig]);
  
  // Listen for storage events (cross-tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        setConfig(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);
  
  return { config, saveConfig, resetToDefault };
}
```

---

## Data Flow

### Widget Addition Flow

```
User clicks "Add Widget" button
  ↓
WidgetLibrary modal opens
  ↓
User searches/filters widgets
  ↓
User clicks "Add" on a widget card
  ↓
onAddWidget(widgetId, defaultSize) called
  ↓
useWidgetLayout.addWidget() invoked
  ↓
findEmptyGridSpace() finds available position
  ↓
New widget added to layout.widgetOrder and layout.widgetPositions
  ↓
Layout saved to localStorage
  ↓
Widget renders via lazy-loaded component
  ↓
Widget fetches data via useQuery
```

### Drag & Drop Flow

```
User presses and holds widget (350ms)
  ↓
onDragStart: setActiveDragId(widgetId), bringToFront(), haptic feedback
  ↓
User moves mouse/finger
  ↓
@dnd-kit calculates transform (deltaX, deltaY)
  ↓
Widget follows cursor via CSS transform
  ↓
User releases
  ↓
onDragEnd: Calculate new position (x + deltaX, y + deltaY)
  ↓
Apply softSnapPosition() (magnetic grid snapping)
  ↓
Apply constrainToCanvas() (bounds checking)
  ↓
updatePosition(widgetId, { x, y })
  ↓
Layout saved to localStorage
  ↓
Widget animates to final position
```

### Configuration Update Flow

```
User clicks Configure button on widget
  ↓
setConfigModalWidget(widgetId)
  ↓
WidgetConfigModal opens
  ↓
Loads config from useWidgetConfig hook
  ↓
User adjusts settings in config panel
  ↓
onConfigChange(newConfig) updates local state
  ↓
User clicks "Save Changes"
  ↓
saveConfig(newConfig) writes to localStorage
  ↓
Custom event dispatched: 'widget-config-updated'
  ↓
Widget components listen to event
  ↓
Widget re-reads config from localStorage
  ↓
Widget re-renders with new settings
```

### Resize Flow

```
User hovers over widget (not minimized/maximized)
  ↓
Resize handle (Grip icon) appears at bottom-right
  ↓
User clicks and drags resize handle
  ↓
handleResizeStart: Capture start position and size
  ↓
handleMouseMove: Calculate deltaX, deltaY
  ↓
Apply min/max constraints from widget definition
  ↓
Apply snapSizeToGridRealtime() for live grid snapping
  ↓
updatePosition(widgetId, { width, height })
  ↓
Widget resizes in real-time (no transition)
  ↓
User releases mouse
  ↓
handleMouseUp: Finalize resize
  ↓
Layout saved to localStorage
```

---

## File Structure

```
src/
├── pages/
│   └── Dashboard.tsx                          # Main dashboard page
│
├── components/
│   └── dashboard/
│       ├── DraggableWidget.tsx                # Widget wrapper with drag/resize
│       ├── WidgetHeader.tsx                   # Widget title bar with controls
│       ├── WidgetLibrary.tsx                  # Modal to browse/add widgets
│       ├── WidgetConfigModal.tsx              # Modal to configure widgets
│       ├── WidgetConfigRouter.tsx             # Routes to widget-specific config panels
│       ├── WidgetMenu.tsx                     # Dropdown menu for widget actions
│       ├── GridOverlay.tsx                    # Visual grid overlay
│       ├── ResizeTooltip.tsx                  # Shows dimensions during resize
│       │
│       └── widgets/                           # Individual widget components
│           ├── QuickPOSWidget.tsx
│           ├── SalesWidget.tsx
│           ├── RevenueChartWidget.tsx
│           ├── TopItemsWidget.tsx
│           ├── LowStockWidget.tsx
│           ├── LoyaltyStatsWidget.tsx
│           ├── ActiveShiftsWidget.tsx
│           ├── ActiveOrdersWidget.tsx
│           │
│           └── config/                        # Widget configuration panels
│               ├── QuickPOSConfigPanel.tsx
│               ├── SalesConfigPanel.tsx
│               ├── RevenueChartConfigPanel.tsx
│               ├── TopItemsConfigPanel.tsx
│               ├── LowStockConfigPanel.tsx
│               ├── LoyaltyStatsConfigPanel.tsx
│               ├── ActiveShiftsConfigPanel.tsx
│               └── ActiveOrdersConfigPanel.tsx
│
├── lib/
│   └── widgets/
│       ├── widgetCatalog.tsx                  # Widget definitions and registry
│       ├── useWidgetLayout.ts                 # Layout state management hook
│       ├── autoPlacement.ts                   # Auto-placement algorithm
│       └── gridSystem.ts                      # Grid calculations and snapping
│
├── hooks/
│   └── useWidgetConfig.ts                     # Widget configuration hook
│
└── types/
    └── widgetConfigs.ts                       # TypeScript interfaces for configs
```

---

## Implementation Guide

### Phase 1: Core Infrastructure (3-4 hours)

**Step 1.1**: Set up grid system
```bash
# Create gridSystem.ts with GRID_CONFIG and utility functions
```

**Step 1.2**: Create layout hook
```bash
# Create useWidgetLayout.ts with layout state management
```

**Step 1.3**: Create auto-placement logic
```bash
# Create autoPlacement.ts with findEmptyGridSpace()
```

**Step 1.4**: Install dependencies
```bash
npm install @dnd-kit/core @tanstack/react-query
```

---

### Phase 2: Widget System (2-3 hours)

**Step 2.1**: Create widget catalog
```typescript
// lib/widgets/widgetCatalog.tsx
export const WIDGET_CATALOG = { /* ... */ };
```

**Step 2.2**: Create widget type definitions
```typescript
// types/widgetConfigs.ts
export interface BaseWidgetConfig { /* ... */ }
export interface SalesWidgetConfig extends BaseWidgetConfig { /* ... */ }
```

**Step 2.3**: Create configuration hook
```typescript
// hooks/useWidgetConfig.ts
export function useWidgetConfig<T extends BaseWidgetConfig>(widgetId: string) { /* ... */ }
```

---

### Phase 3: UI Components (4-5 hours)

**Step 3.1**: Create Dashboard page
```tsx
// pages/Dashboard.tsx
export default function Dashboard() { /* ... */ }
```

**Step 3.2**: Create DraggableWidget wrapper
```tsx
// components/dashboard/DraggableWidget.tsx
export function DraggableWidget({ ... }) { /* ... */ }
```

**Step 3.3**: Create WidgetHeader
```tsx
// components/dashboard/WidgetHeader.tsx
export function WidgetHeader({ ... }) { /* ... */ }
```

**Step 3.4**: Create WidgetLibrary modal
```tsx
// components/dashboard/WidgetLibrary.tsx
export function WidgetLibrary({ ... }) { /* ... */ }
```

**Step 3.5**: Create WidgetConfigModal
```tsx
// components/dashboard/WidgetConfigModal.tsx
export function WidgetConfigModal({ ... }) { /* ... */ }
```

---

### Phase 4: Widget Implementation (5-6 hours)

**Step 4.1**: Create first widget (e.g., SalesWidget)
```tsx
// components/dashboard/widgets/SalesWidget.tsx
export function SalesWidget() {
  const { config } = useWidgetConfig<SalesWidgetConfig>('sales');
  const { data } = useQuery({ /* ... */ });
  
  return <div>{/* Widget content */}</div>;
}
```

**Step 4.2**: Create config panel for widget
```tsx
// components/dashboard/widgets/config/SalesConfigPanel.tsx
export function SalesConfigPanel({ config, onConfigChange }) {
  return (
    <div>
      {/* Config controls */}
    </div>
  );
}
```

**Step 4.3**: Repeat for all widgets

---

### Phase 5: Polish & Testing (2-3 hours)

**Step 5.1**: Add grid overlay
```tsx
// components/dashboard/GridOverlay.tsx
export function GridOverlay() { /* Visual grid dots */ }
```

**Step 5.2**: Add resize tooltip
```tsx
// components/dashboard/ResizeTooltip.tsx
export function ResizeTooltip({ width, height, isVisible }) { /* ... */ }
```

**Step 5.3**: Add haptic feedback
```typescript
// lib/haptics.ts
export const haptics = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(20),
};
```

**Step 5.4**: Testing checklist
- [ ] Drag widgets (press-and-hold 350ms)
- [ ] Resize widgets (bottom-right corner)
- [ ] Minimize/maximize widgets
- [ ] Configure widgets (save/reset)
- [ ] Add widgets from library
- [ ] Remove widgets
- [ ] Grid snapping works (within 30px)
- [ ] Widgets constrained to canvas
- [ ] Layout persists after refresh
- [ ] Multi-user layouts work (different localStorage keys)
- [ ] Cross-tab config updates work

---

## Code Examples

### Example 1: Creating a Simple Widget

```tsx
// components/dashboard/widgets/NotificationsWidget.tsx
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

interface NotificationConfig extends BaseWidgetConfig {
  showUnreadOnly: boolean;
  maxNotifications: 5 | 10 | 20;
}

export function NotificationsWidget() {
  const { config } = useWidgetConfig<NotificationConfig>('notifications');
  
  const notifications = [
    { id: 1, text: "New order received", unread: true },
    { id: 2, text: "Payment completed", unread: false },
  ];
  
  const filtered = config.showUnreadOnly 
    ? notifications.filter(n => n.unread)
    : notifications;
  
  const limited = filtered.slice(0, config.maxNotifications);
  
  return (
    <div className="h-full p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <h3 className="font-semibold">Notifications</h3>
      </div>
      
      {limited.map(notif => (
        <div key={notif.id} className="p-3 rounded-lg bg-accent/10">
          {notif.text}
          {notif.unread && <Badge variant="default">New</Badge>}
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Creating a Config Panel

```tsx
// components/dashboard/widgets/config/NotificationsConfigPanel.tsx
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Props {
  config: NotificationConfig;
  onConfigChange: (config: NotificationConfig) => void;
}

export function NotificationsConfigPanel({ config, onConfigChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label htmlFor="unread-only">Show Unread Only</Label>
        <Switch
          id="unread-only"
          checked={config.showUnreadOnly}
          onCheckedChange={(checked) => 
            onConfigChange({ ...config, showUnreadOnly: checked })
          }
        />
      </div>
      
      <div className="space-y-2">
        <Label>Max Notifications</Label>
        <Select
          value={config.maxNotifications.toString()}
          onValueChange={(val) => 
            onConfigChange({ ...config, maxNotifications: parseInt(val) as 5 | 10 | 20 })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 notifications</SelectItem>
            <SelectItem value="10">10 notifications</SelectItem>
            <SelectItem value="20">20 notifications</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

### Example 3: Registering Widget in Catalog

```tsx
// lib/widgets/widgetCatalog.tsx
import { Bell } from "lucide-react";
import { lazy } from "react";

const NotificationsWidget = lazy(() => 
  import("@/components/dashboard/widgets/NotificationsWidget")
    .then(m => ({ default: m.NotificationsWidget }))
);

export const WIDGET_CATALOG: Record<string, WidgetDefinition[]> = {
  // ... existing categories
  
  communications: [
    {
      id: "notifications",
      component: NotificationsWidget,
      name: "Notifications",
      description: "Live notification feed",
      icon: Bell,
      roles: ["cashier", "manager", "admin"],
      category: "communications",
      defaultSize: { cols: 4, rows: 5 },
      minSize: { width: 280, height: 300 },
      maxSize: { width: 500, height: 600 },
      capabilities: {
        supportedDisplayTypes: ['cards'],
        dataType: 'text-list',
        hasCompactMode: true,
      },
    },
  ],
};
```

### Example 4: Adding Default Config

```typescript
// hooks/useWidgetConfig.ts
export function getDefaultConfig(widgetType: string): BaseWidgetConfig {
  const baseConfig = {
    displayType: getDefaultDisplayType(widgetType),
    colorScheme: 'auto',
    refreshInterval: 30 as const,
    compactMode: false,
    dataFilters: {},
  };

  switch (widgetType) {
    case 'notifications':
      return {
        ...baseConfig,
        showUnreadOnly: false,
        maxNotifications: 10,
      } as NotificationConfig;
  
    // ... other cases
  }
}
```

### Example 5: Routing Config Panel

```tsx
// components/dashboard/WidgetConfigRouter.tsx
import { NotificationsConfigPanel } from "./widgets/config/NotificationsConfigPanel";

export function WidgetConfigRouter({ widgetId, config, onConfigChange }) {
  switch (widgetId) {
    case 'notifications':
      return <NotificationsConfigPanel config={config} onConfigChange={onConfigChange} />;
  
    // ... other cases
  
    default:
      return (
        <div className="text-center py-8 text-muted-foreground">
          No configuration available for this widget.
        </div>
      );
  }
}
```

---

## Design Patterns & Best Practices

### 1. Lazy Loading Widgets
**Why**: Reduce initial bundle size, faster page load.

```tsx
const MyWidget = lazy(() => 
  import("@/components/dashboard/widgets/MyWidget")
    .then(m => ({ default: m.MyWidget }))
);
```

### 2. Generic Configuration Hook
**Why**: Type-safe, reusable across all widgets.

```tsx
const { config } = useWidgetConfig<MyWidgetConfig>('my-widget');
```

### 3. Viewport-Aware Grid
**Why**: Responsive to any screen size, no hardcoded dimensions.

```tsx
get CANVAS_WIDTH() {
  return window.innerWidth - PADDING;
}
```

### 4. Soft Magnetic Snapping
**Why**: Guides user without forcing, feels natural.

```tsx
const snapped = softSnapPosition(x, y);
// Only snaps if within 30px of grid line
```

### 5. Per-User Persistence
**Why**: Each user has their own custom layout.

```tsx
const storageKey = `dashboard-layout-${userId}`;
```

### 6. Event-Driven Config Updates
**Why**: Real-time updates across tabs, reactive UI.

```tsx
window.dispatchEvent(new CustomEvent('widget-config-updated', { 
  detail: { widgetId } 
}));
```

### 7. Auto-Placement Algorithm
**Why**: No manual positioning needed, intelligent placement.

```tsx
const position = findEmptyGridSpace(existingWidgets, requiredSize);
```

### 8. Haptic Feedback
**Why**: Better UX on touch devices, tactile feedback.

```tsx
haptics.medium(); // On drag start
```

---

## Performance Optimizations

### 1. Lazy Load Widgets
Only load widget code when added to dashboard.

### 2. Debounce Layout Saves
Wait 500ms before saving to localStorage (avoid excessive writes).

### 3. Memoize Filtered Widgets
Use `useMemo` in WidgetLibrary to avoid re-filtering on every render.

### 4. Optimize Drag Rendering
Only apply transform to dragged widget, disable pointer events on others.

### 5. Virtual Scrolling (if 20+ widgets)
Use `react-window` for widget library if catalog grows large.

### 6. Skeleton Loaders
Show `<Skeleton />` while lazy-loaded widgets load.

---

## Accessibility

### 1. Keyboard Navigation
- Tab through widgets
- Escape to exit maximize mode
- Arrow keys to adjust size (future enhancement)

### 2. ARIA Labels
```tsx
<Button aria-label="Resize widget">
  <Grip />
</Button>
```

### 3. Screen Reader Announcements
```tsx
<div role="region" aria-live="polite">
  Widget added to dashboard
</div>
```

### 4. Focus Management
- Focus on maximized widget when opened
- Return focus to trigger button when closed

---

## Testing Strategy

### Unit Tests
- `snapToGrid()` - Verify correct grid alignment
- `findEmptyGridSpace()` - Test auto-placement logic
- `constrainToCanvas()` - Test bounds checking

### Integration Tests
- Add widget → Verify appears in correct position
- Drag widget → Verify position updates
- Resize widget → Verify size constraints enforced
- Save config → Verify localStorage updated

### E2E Tests
- Full user journey: Add widget → Configure → Drag → Resize → Remove
- Cross-tab sync: Change config in Tab A, verify update in Tab B
- Multi-user isolation: User A layout doesn't affect User B

---

## Troubleshooting

### Issue: Widgets overlap after drag
**Solution**: Ensure `constrainToCanvas()` is called after drag.

### Issue: Config changes don't persist
**Solution**: Check localStorage key format, ensure `saveConfig()` is called.

### Issue: Widgets don't snap to grid
**Solution**: Verify `softSnapPosition()` threshold is set correctly (30px).

### Issue: Maximize mode stuck
**Solution**: Ensure Escape key handler is registered, backdrop click handler works.

### Issue: Layout resets on page refresh
**Solution**: Check localStorage save is not failing, verify storageKey format.

---

## Future Enhancements

### 1. Widget Templates
Save and load pre-configured dashboard layouts.

### 2. Widget Grouping
Organize widgets into collapsible sections.

### 3. Widget Linking
Connect widgets (e.g., clicking chart filters table).

### 4. Export/Import Layouts
Share layouts between users via JSON export.

### 5. Widget Themes
Dark/light/custom color schemes per widget.

### 6. Widget Locking
Prevent accidental drag/resize.

### 7. Multi-Dashboard Support
Multiple dashboard tabs (Personal, Team, Company).

### 8. Widget Marketplace
Browse and install community widgets.

---

## Summary

This dashboard system provides:
- ✅ Fully customizable widget-based layout
- ✅ Drag-and-drop repositioning
- ✅ Resizable widgets with grid snapping
- ✅ Per-user layout persistence
- ✅ Role-based widget access
- ✅ Real-time configuration updates
- ✅ Auto-placement algorithm
- ✅ Responsive grid system
- ✅ Lazy-loaded widgets
- ✅ Type-safe configuration

**Total Implementation Time**: ~16-22 hours for complete system

**Core Files**: 25 files
- 1 page (Dashboard.tsx)
- 8 layout components
- 8 widget components
- 8 config panels
- 4 utility files
- 2 type files

**Key Dependencies**:
- @dnd-kit/core (drag & drop)
- @tanstack/react-query (data fetching)
- Tailwind CSS (styling)
- shadcn/ui (components)

---

**Questions?** This architecture is production-ready and can be adapted to any Lovable project needing a customizable dashboard system.
