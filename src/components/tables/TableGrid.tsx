import { TableCard } from './TableCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { getGridClasses, getGapClasses } from '@/lib/utils/responsiveGrid';
import { cn } from '@/lib/utils';

interface TableGridProps {
  tables: any[];
  isLoading: boolean;
  onTableClick: (tableId: string) => void;
}

export function TableGrid({ tables, isLoading, onTableClick }: TableGridProps) {
  const { device } = useDeviceDetection();
  const gridClasses = getGridClasses('tables', device);
  const gapClasses = getGapClasses(device);

  if (isLoading) {
    return (
      <div className={cn("grid", gridClasses, gapClasses)}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (!tables || tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No tables configured
      </div>
    );
  }

  return (
    <div className={cn("table-grid grid", gridClasses, gapClasses)}>
      {tables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          onClick={() => onTableClick(table.id)}
        />
      ))}
    </div>
  );
}
