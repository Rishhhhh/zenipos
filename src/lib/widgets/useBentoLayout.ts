import { useState, useEffect } from 'react';
import { getBentoLayoutForRole } from './bentoLayouts';
import type { BentoBreakpoint } from './bentoGrid';

export interface BentoWidgetState {
  isMinimized: boolean;
  customConfig?: any;
}

export interface BentoLayoutState {
  widgetStates: Record<string, BentoWidgetState>;
  activeWidgets: string[];
}

const STORAGE_KEY = 'zenipos-bento-layout';

function getDefaultBentoState(role: 'staff' | 'manager' | 'owner', breakpoint: BentoBreakpoint): BentoLayoutState {
  const layout = getBentoLayoutForRole(role, breakpoint);
  const activeWidgets = layout.widgets.map(w => w.id);
  const widgetStates: Record<string, BentoWidgetState> = {};
  
  activeWidgets.forEach(id => {
    widgetStates[id] = { isMinimized: false };
  });

  return {
    widgetStates,
    activeWidgets,
  };
}

export function useBentoLayout(role: 'staff' | 'manager' | 'owner', breakpoint: BentoBreakpoint) {
  const [state, setState] = useState<BentoLayoutState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that saved state matches current role
        if (parsed.role === role) {
          return parsed.state;
        }
      }
    } catch (error) {
      console.error('Failed to load bento layout from localStorage:', error);
    }
    return getDefaultBentoState(role, breakpoint);
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        role,
        state,
      }));
    } catch (error) {
      console.error('Failed to save bento layout to localStorage:', error);
    }
  }, [state, role]);

  const toggleMinimize = (widgetId: string) => {
    setState(prev => ({
      ...prev,
      widgetStates: {
        ...prev.widgetStates,
        [widgetId]: {
          ...prev.widgetStates[widgetId],
          isMinimized: !prev.widgetStates[widgetId]?.isMinimized,
        },
      },
    }));
  };

  const updateConfig = (widgetId: string, config: any) => {
    setState(prev => ({
      ...prev,
      widgetStates: {
        ...prev.widgetStates,
        [widgetId]: {
          ...prev.widgetStates[widgetId],
          customConfig: config,
        },
      },
    }));
  };

  return {
    widgetStates: state.widgetStates,
    activeWidgets: state.activeWidgets,
    toggleMinimize,
    updateConfig,
  };
}
