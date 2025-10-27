import { useModalContext, ModalOptions } from '@/contexts/ModalContext';
import React from 'react';

export function useModalManager() {
  const { openModal, closeModal, closeAll, modals } = useModalContext();

  return {
    openModal: (component: React.ComponentType<any>, props?: any, options?: ModalOptions) => {
      return openModal(component, props, options);
    },
    closeModal,
    closeAll,
    activeModals: modals,
    hasActiveModal: modals.length > 0
  };
}
