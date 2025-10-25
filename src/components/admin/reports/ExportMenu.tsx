import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, Printer } from "lucide-react";
import { exportToPDF, exportToCSV, printReport } from "@/lib/export/reportExporter";
import { toast } from "sonner";

interface ExportMenuProps {
  data: any[];
  filename: string;
  elementId?: string;
}

export function ExportMenu({ data, filename, elementId = 'dashboard-content' }: ExportMenuProps) {
  const handleExportPDF = async () => {
    try {
      await exportToPDF(elementId, `${filename}.pdf`);
      toast.success('Report exported to PDF');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    }
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(data, `${filename}.csv`);
      toast.success('Data exported to CSV');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error(error);
    }
  };

  const handlePrint = () => {
    try {
      printReport(elementId);
      toast.success('Print dialog opened');
    } catch (error) {
      toast.error('Failed to print');
      console.error(error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
