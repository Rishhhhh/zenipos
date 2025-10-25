import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, CalendarIcon, Printer } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export function ZReportModal() {
  const [date, setDate] = useState<Date>(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['z-report', date],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('generate_z_report' as any, {
        report_date: format(date, 'yyyy-MM-dd')
      }) as any;
      
      if (error) throw error;
      return data?.[0];
    },
    enabled: isOpen,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Z-Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>End of Day Report (Z-Report)</DialogTitle>
          <DialogDescription>
            Generate and print daily sales summary
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button onClick={handlePrint} disabled={isLoading || !reportData}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>

          {isLoading && (
            <div className="text-center text-muted-foreground py-8">
              Loading report...
            </div>
          )}

          {reportData && (
            <div id="z-report-content" className="space-y-4 p-6 bg-background">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Z-REPORT</h2>
                <p className="text-muted-foreground">{format(date, 'PPP')}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Sales Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total Orders:</div>
                  <div className="text-right font-medium">{reportData.order_count}</div>
                  
                  <div>Gross Sales:</div>
                  <div className="text-right font-medium">RM {Number(reportData.total_sales).toFixed(2)}</div>
                  
                  <div>Tax:</div>
                  <div className="text-right">RM {Number(reportData.total_tax).toFixed(2)}</div>
                  
                  <div>Discounts:</div>
                  <div className="text-right text-red-600">-RM {Number(reportData.total_discounts).toFixed(2)}</div>
                  
                  <div>Refunds:</div>
                  <div className="text-right text-red-600">-RM {Number(reportData.refund_amount).toFixed(2)}</div>
                  
                  <Separator className="col-span-2" />
                  
                  <div className="font-semibold">Net Sales:</div>
                  <div className="text-right font-bold">RM {Number(reportData.net_sales).toFixed(2)}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Payment Methods</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Cash:</div>
                  <div className="text-right">RM {Number(reportData.cash_sales).toFixed(2)}</div>
                  
                  <div>Card:</div>
                  <div className="text-right">RM {Number(reportData.card_sales).toFixed(2)}</div>
                  
                  <div>QR Payment:</div>
                  <div className="text-right">RM {Number(reportData.qr_sales).toFixed(2)}</div>
                  
                  <Separator className="col-span-2" />
                  
                  <div>Tips Collected:</div>
                  <div className="text-right">RM {Number(reportData.tips_collected).toFixed(2)}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Other Metrics</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Average Ticket:</div>
                  <div className="text-right">RM {Number(reportData.avg_ticket).toFixed(2)}</div>
                  
                  <div>Void Count:</div>
                  <div className="text-right">{reportData.void_count}</div>
                  
                  <div>Refund Count:</div>
                  <div className="text-right">{reportData.refund_count}</div>
                </div>
              </div>

              <div className="text-center text-xs text-muted-foreground pt-4">
                Generated on {format(new Date(), 'PPP p')}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
