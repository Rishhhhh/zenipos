import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ModalOptions {
  variant?: 'default' | 'drawer' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disableBackdropClick?: boolean;
  onClose?: () => void;
}

export interface Modal {
  id: string;
  component: React.ComponentType<any>;
  props: any;
  options: ModalOptions;
}

interface ModalContextType {
  modals: Modal[];
  openModal: (component: React.ComponentType<any>, props?: any, options?: ModalOptions) => string;
  closeModal: (id: string) => void;
  closeAll: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<Modal[]>([]);

  const openModal = useCallback((
    component: React.ComponentType<any>,
    props: any = {},
    options: ModalOptions = {}
  ) => {
    const startTime = performance.now();
    const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const modal: Modal = {
      id,
      component,
      props: {
        ...props,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) {
            closeModal(id);
          }
        }
      },
      options
    };

    setModals(prev => [...prev, modal]);
    
    // Track modal open time (target: <100ms)
    requestAnimationFrame(() => {
      const openTime = performance.now() - startTime;
      // Track performance if needed
      if (openTime > 100) {
        console.warn(`Modal ${id} took ${openTime.toFixed(2)}ms to open (target: <100ms)`);
      }
    });

    return id;
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals(prev => {
      const modal = prev.find(m => m.id === id);
      if (modal?.options.onClose) {
        modal.options.onClose();
      }
      return prev.filter(m => m.id !== id);
    });
  }, []);

  const closeAll = useCallback(() => {
    modals.forEach(modal => {
      if (modal.options.onClose) {
        modal.options.onClose();
      }
    });
    setModals([]);
  }, [modals]);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal, closeAll }}>
      {children}
      {/* Only render the topmost modal (queue system) */}
      {modals.length > 0 && (() => {
        const activeModal = modals[modals.length - 1];
        const ModalComponent = activeModal.component;
        return (
          <React.Suspense fallback={null}>
            <ModalComponent key={activeModal.id} {...activeModal.props} />
          </React.Suspense>
        );
      })()}
    </ModalContext.Provider>
  );
}

export function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within ModalProvider');
  }
  return context;
}
