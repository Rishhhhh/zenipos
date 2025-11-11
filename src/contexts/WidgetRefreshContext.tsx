import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface WidgetRefreshContextValue {
  registerRefresh: (refetchFn: () => void) => void;
  triggerRefresh: () => void;
  hasRefresh: boolean;
}

const WidgetRefreshContext = createContext<WidgetRefreshContextValue | undefined>(undefined);

export function WidgetRefreshProvider({ children }: { children: ReactNode }) {
  const [refetchFn, setRefetchFn] = useState<(() => void) | null>(null);

  const registerRefresh = useCallback((fn: () => void) => {
    setRefetchFn(() => fn);
  }, []);

  const triggerRefresh = useCallback(() => {
    if (refetchFn) {
      refetchFn();
    }
  }, [refetchFn]);

  return (
    <WidgetRefreshContext.Provider value={{ 
      registerRefresh, 
      triggerRefresh, 
      hasRefresh: refetchFn !== null 
    }}>
      {children}
    </WidgetRefreshContext.Provider>
  );
}

export function useWidgetRefresh() {
  const context = useContext(WidgetRefreshContext);
  if (!context) {
    throw new Error('useWidgetRefresh must be used within WidgetRefreshProvider');
  }
  return context;
}
