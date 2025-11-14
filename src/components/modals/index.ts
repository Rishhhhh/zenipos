import { lazy } from 'react';

export const MODAL_REGISTRY = {
  payment: lazy(() => import('@/components/pos/PaymentModal').then(m => ({ default: m.PaymentModal }))),
  menuItem: lazy(() => import('@/components/admin/MenuItemModal').then(m => ({ default: m.MenuItemModal }))),
  categoryEdit: lazy(() => import('@/components/admin/CategoryEditModal').then(m => ({ default: m.CategoryEditModal }))),
  managerPin: lazy(() => import('@/components/pos/ManagerPinModal').then(m => ({ default: m.ManagerPinModal }))),
  employeeClockIn: lazy(() => import('@/components/pos/EmployeeClockInModal').then(m => ({ default: m.EmployeeClockInModal }))),
  employeeClockOut: lazy(() => import('@/components/pos/EmployeeClockOutModal').then(m => ({ default: m.EmployeeClockOutModal }))),
  refund: lazy(() => import('@/components/admin/RefundModal').then(m => ({ default: m.RefundModal }))),
  stockAdjustment: lazy(() => import('@/components/admin/StockAdjustmentModal').then(m => ({ default: m.StockAdjustmentModal }))),
  inventoryItem: lazy(() => import('@/components/admin/InventoryItemModal').then(m => ({ default: m.InventoryItemModal }))),
  employee: lazy(() => import('@/components/admin/EmployeeModal').then(m => ({ default: m.EmployeeModal }))),
  promotion: lazy(() => import('@/components/admin/PromotionModal').then(m => ({ default: m.PromotionModal }))),
  zReport: lazy(() => import('@/components/admin/reports/ZReportModal').then(m => ({ default: m.ZReportModal }))),
  qrPay: lazy(() => import('@/components/customer/QrPayModal').then(m => ({ default: m.QrPayModal }))),
  aiApproval: lazy(() => import('@/components/ai/AIApprovalDialog').then(m => ({ default: m.AIApprovalDialog }))),
  aiForecast: lazy(() => import('@/components/admin/AIForecastPanel').then(m => ({ default: m.AIForecastPanel }))),
};

export type ModalType = keyof typeof MODAL_REGISTRY;
