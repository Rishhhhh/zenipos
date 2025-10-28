import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DataTableCardProps {
  data: any;
}

export function DataTableCard({ data }: DataTableCardProps) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  // Get columns from first row
  const columns = Object.keys(data[0]).filter(key => 
    !key.includes('id') || key === 'order_id'
  );

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return '-';
    
    // Format currency
    if (key.includes('price') || key.includes('cost') || key.includes('total') || 
        key.includes('sales') || key.includes('revenue')) {
      return `RM ${parseFloat(value).toFixed(2)}`;
    }
    
    // Format quantity
    if (key.includes('qty') || key.includes('quantity')) {
      return parseFloat(value).toFixed(0);
    }
    
    // Format status
    if (key === 'status') {
      return (
        <Badge variant={
          value === 'completed' || value === 'paid' ? 'default' :
          value === 'pending' ? 'secondary' :
          value === 'cancelled' ? 'destructive' : 'outline'
        }>
          {value}
        </Badge>
      );
    }
    
    // Format dates
    if (key.includes('date') || key.includes('at')) {
      return new Date(value).toLocaleString();
    }
    
    return value.toString();
  };

  const formatColumnName = (col: string) => {
    return col
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="p-6 bg-card border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              {columns.map((col) => (
                <TableHead key={col} className="text-muted-foreground font-semibold">
                  {formatColumnName(col)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx} className="border-border">
                {columns.map((col) => (
                  <TableCell key={col} className="text-foreground">
                    {formatValue(col, row[col])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
