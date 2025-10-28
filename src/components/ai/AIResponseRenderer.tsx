import { Badge } from "@/components/ui/badge";
import { ReceiptCard } from "./responses/ReceiptCard";
import { SalesChartCard } from "./responses/SalesChartCard";
import { DataTableCard } from "./responses/DataTableCard";
import { KPICards } from "./responses/KPICards";

interface AIResponseRendererProps {
  content: string;
  toolResults?: any[];
  structuredData?: {
    type: 'receipt' | 'sales_chart' | 'table' | 'kpi_cards';
    data: any;
  };
}

export function AIResponseRenderer({ content, toolResults, structuredData }: AIResponseRendererProps) {
  return (
    <div className="space-y-4">
      {/* Text content */}
      <div className="prose prose-sm text-foreground max-w-none">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
      
      {/* Structured data rendering */}
      {structuredData?.type === 'receipt' && (
        <ReceiptCard data={structuredData.data} />
      )}
      
      {structuredData?.type === 'sales_chart' && (
        <SalesChartCard data={structuredData.data} />
      )}
      
      {structuredData?.type === 'table' && (
        <DataTableCard data={structuredData.data} />
      )}
      
      {structuredData?.type === 'kpi_cards' && (
        <KPICards data={structuredData.data} />
      )}
      
      {/* Tool execution badges */}
      {toolResults && toolResults.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-3">
          {toolResults.map((tool, idx) => (
            <Badge 
              key={idx} 
              variant={tool.success ? "default" : "destructive"}
              className="text-xs"
            >
              ✓ {tool.tool.split('.')[1]}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
