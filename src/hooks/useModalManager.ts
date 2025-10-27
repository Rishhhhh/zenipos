import { useModalContext, ModalOptions } from '@/contexts/ModalContext';
import React, { lazy } from 'react';
import { MODAL_REGISTRY, ModalType } from '@/components/modals';

export function useModalManager() {
  const { openModal: openModalContext, closeModal, closeAll, modals } = useModalContext();

  const openModal = (modalType: ModalType, props?: any, options?: ModalOptions) => {
    const ModalComponent = MODAL_REGISTRY[modalType];
    if (!ModalComponent) {
      throw new Error(`Modal type "${modalType}" not found in registry`);
    }
    return openModalContext(ModalComponent as any, props, options);
  };

  return {
    openModal,
    closeModal,
    closeAll,
    activeModals: modals,
    hasActiveModal: modals.length > 0
  };
}
