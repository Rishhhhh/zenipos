// Wrapper to handle react-window's CommonJS exports
import ReactWindow from 'react-window';

// Extract components using proper CommonJS interop
const windowModule = ReactWindow as any;

export const FixedSizeList = windowModule.FixedSizeList || windowModule.default?.FixedSizeList;
export const VariableSizeList = windowModule.VariableSizeList || windowModule.default?.VariableSizeList;
export const FixedSizeGrid = windowModule.FixedSizeGrid || windowModule.default?.FixedSizeGrid;
export const VariableSizeGrid = windowModule.VariableSizeGrid || windowModule.default?.VariableSizeGrid;

// Type re-exports
export type {
  FixedSizeListProps,
  VariableSizeListProps,
  FixedSizeGridProps,
  VariableSizeGridProps,
  ListChildComponentProps,
  GridChildComponentProps
} from 'react-window';
