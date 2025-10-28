import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ReceiptCardProps {
  data: any;
}

export function ReceiptCard({ data }: ReceiptCardProps) {
  if (!data) return null;

  return (
    <Card className="p-6 bg-card border-border max-w-md">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">ZENIPOS</h3>
          <p className="text-xs text-muted-foreground">Receipt #{data.order_id?.slice(0, 8)}</p>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          {data.items?.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-foreground">
                {item.quantity}x {item.name}
              </span>
              <span className="text-foreground font-medium">
                RM {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        
        <Separator />
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">RM {data.subtotal?.toFixed(2)}</span>
          </div>
          {data.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="text-foreground">RM {data.tax?.toFixed(2)}</span>
            </div>
          )}
          {data.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-RM {data.discount?.toFixed(2)}</span>
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="flex justify-between text-lg font-bold">
          <span className="text-foreground">Total</span>
          <span className="text-primary">RM {data.total?.toFixed(2)}</span>
        </div>
        
        <div className="text-center text-xs text-muted-foreground mt-4">
          {new Date(data.created_at).toLocaleString()}
        </div>
      </div>
    </Card>
  );
}
