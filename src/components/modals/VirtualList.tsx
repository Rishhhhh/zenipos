import React, { memo } from 'react';
// @ts-ignore - react-window types may not be perfect
import ReactWindow from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const { FixedSizeList } = ReactWindow as any;

interface VirtualListProps<T> {
  items: T[];
  rowHeight: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  className?: string;
  maxHeight?: number;
}

function VirtualListInner<T>({
  items,
  rowHeight,
  renderRow,
  className,
  maxHeight = 600
}: VirtualListProps<T>) {
  const Row = memo(({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {renderRow(items[index], index)}
    </div>
  ));

  return (
    <div className={className} style={{ height: Math.min(items.length * rowHeight, maxHeight) }}>
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => (
          <FixedSizeList
            height={height}
            width={width}
            itemCount={items.length}
            itemSize={rowHeight}
            overscanCount={3}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;
