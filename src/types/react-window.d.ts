declare module 'react-window' {
  import * as React from 'react';

  export interface ListChildComponentProps<T = any> {
    index: number;
    style: React.CSSProperties;
    data: T;
  }

  export interface GridChildComponentProps<T = any> {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
    data: T;
  }

  export interface FixedSizeListProps {
    children: React.ComponentType<ListChildComponentProps>;
    className?: string;
    direction?: 'ltr' | 'rtl';
    height: number | string;
    initialScrollOffset?: number;
    innerRef?: React.Ref<any>;
    innerElementType?: React.ElementType;
    itemCount: number;
    itemData?: any;
    itemKey?: (index: number, data: any) => any;
    itemSize: number;
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
    onScroll?: (props: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => void;
    outerRef?: React.Ref<any>;
    outerElementType?: React.ElementType;
    overscanCount?: number;
    style?: React.CSSProperties;
    useIsScrolling?: boolean;
    width: number | string;
  }

  export interface VariableSizeListProps {
    children: React.ComponentType<ListChildComponentProps>;
    className?: string;
    direction?: 'ltr' | 'rtl';
    estimatedItemSize?: number;
    height: number | string;
    initialScrollOffset?: number;
    innerRef?: React.Ref<any>;
    innerElementType?: React.ElementType;
    itemCount: number;
    itemData?: any;
    itemKey?: (index: number, data: any) => any;
    itemSize: (index: number) => number;
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
    onScroll?: (props: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => void;
    outerRef?: React.Ref<any>;
    outerElementType?: React.ElementType;
    overscanCount?: number;
    style?: React.CSSProperties;
    useIsScrolling?: boolean;
    width: number | string;
  }

  export interface FixedSizeGridProps {
    children: React.ComponentType<GridChildComponentProps>;
    className?: string;
    columnCount: number;
    columnWidth: number;
    direction?: 'ltr' | 'rtl';
    height: number | string;
    initialScrollLeft?: number;
    initialScrollTop?: number;
    innerRef?: React.Ref<any>;
    innerElementType?: React.ElementType;
    itemData?: any;
    itemKey?: (params: { columnIndex: number; rowIndex: number; data: any }) => any;
    onItemsRendered?: (props: {
      overscanColumnStartIndex: number;
      overscanColumnStopIndex: number;
      overscanRowStartIndex: number;
      overscanRowStopIndex: number;
      visibleColumnStartIndex: number;
      visibleColumnStopIndex: number;
      visibleRowStartIndex: number;
      visibleRowStopIndex: number;
    }) => void;
    onScroll?: (props: {
      horizontalScrollDirection: 'forward' | 'backward';
      scrollLeft: number;
      scrollTop: number;
      scrollUpdateWasRequested: boolean;
      verticalScrollDirection: 'forward' | 'backward';
    }) => void;
    outerRef?: React.Ref<any>;
    outerElementType?: React.ElementType;
    overscanColumnCount?: number;
    overscanRowCount?: number;
    rowCount: number;
    rowHeight: number;
    style?: React.CSSProperties;
    useIsScrolling?: boolean;
    width: number | string;
  }

  export interface VariableSizeGridProps {
    children: React.ComponentType<GridChildComponentProps>;
    className?: string;
    columnCount: number;
    columnWidth: (index: number) => number;
    direction?: 'ltr' | 'rtl';
    estimatedColumnWidth?: number;
    estimatedRowHeight?: number;
    height: number | string;
    initialScrollLeft?: number;
    initialScrollTop?: number;
    innerRef?: React.Ref<any>;
    innerElementType?: React.ElementType;
    itemData?: any;
    itemKey?: (params: { columnIndex: number; rowIndex: number; data: any }) => any;
    onItemsRendered?: (props: {
      overscanColumnStartIndex: number;
      overscanColumnStopIndex: number;
      overscanRowStartIndex: number;
      overscanRowStopIndex: number;
      visibleColumnStartIndex: number;
      visibleColumnStopIndex: number;
      visibleRowStartIndex: number;
      visibleRowStopIndex: number;
    }) => void;
    onScroll?: (props: {
      horizontalScrollDirection: 'forward' | 'backward';
      scrollLeft: number;
      scrollTop: number;
      scrollUpdateWasRequested: boolean;
      verticalScrollDirection: 'forward' | 'backward';
    }) => void;
    outerRef?: React.Ref<any>;
    outerElementType?: React.ElementType;
    overscanColumnCount?: number;
    overscanRowCount?: number;
    rowCount: number;
    rowHeight: (index: number) => number;
    style?: React.CSSProperties;
    useIsScrolling?: boolean;
    width: number | string;
  }

  export const FixedSizeList: React.ComponentType<FixedSizeListProps>;
  export const VariableSizeList: React.ComponentType<VariableSizeListProps>;
  export const FixedSizeGrid: React.ComponentType<FixedSizeGridProps>;
  export const VariableSizeGrid: React.ComponentType<VariableSizeGridProps>;
}
