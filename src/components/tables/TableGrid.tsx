import { TableCard } from './TableCard';
import { Skeleton } from '@/components/ui/skeleton';

interface TableGridProps {
  tables: any[];
  isLoading: boolean;
  onTableClick: (tableId: string) => void;
}

export function TableGrid({ tables, isLoading, onTableClick }: TableGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
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
