import { GlassModal } from '@/components/modals/GlassModal';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Calendar, CreditCard, Hash, User, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: any;
}

export function TransactionDetailModal({ open, onOpenChange, transaction }: TransactionDetailModalProps) {
  if (!transaction) return null;

  const isPayment = transaction.type === 'payment';
  const isRefund = transaction.type === 'refund';
  const isLoyalty = transaction.type === 'loyalty';

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title="Transaction Details"
      description={`${transaction.type?.charAt(0).toUpperCase()}${transaction.type?.slice(1)} transaction`}
      size="md"
      variant="default"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge variant={isPayment ? 'default' : isRefund ? 'destructive' : 'secondary'}>
            {transaction.type?.toUpperCase()}
          </Badge>
          <span className={`text-2xl font-bold ${isPayment ? 'text-green-600' : isRefund ? 'text-destructive' : ''}`}>
            {isPayment ? '+' : isRefund ? '-' : ''}RM {Math.abs(Number(transaction.amount || 0)).toFixed(2)}
          </span>
        </div>

        <Separator />

        {/* Details Grid */}
        <div className="grid gap-3">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Date & Time</p>
              <p className="font-medium">
                {transaction.created_at ? format(new Date(transaction.created_at), 'PPpp') : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium capitalize">{transaction.transaction_type || transaction.method || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Order Reference</p>
              <p className="font-medium font-mono">
                {transaction.order_id ? transaction.order_id.substring(0, 8) : 'N/A'}
              </p>
            </div>
          </div>

          {transaction.provider_ref && (
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Provider Reference</p>
                <p className="font-medium font-mono text-sm">{transaction.provider_ref}</p>
              </div>
            </div>
          )}

          {transaction.tip_amount > 0 && (
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Tip Amount</p>
                <p className="font-medium">RM {Number(transaction.tip_amount).toFixed(2)}</p>
              </div>
            </div>
          )}

          {transaction.change_given > 0 && (
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Change Given</p>
                <p className="font-medium">RM {Number(transaction.change_given).toFixed(2)}</p>
              </div>
            </div>
          )}

          {isRefund && transaction.reason && (
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Refund Reason</p>
                <p className="font-medium">{transaction.reason}</p>
              </div>
            </div>
          )}

          {isLoyalty && transaction.customer && (
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{transaction.customer.name || 'Unknown'}</p>
                {transaction.customer.phone && (
                  <p className="text-sm text-muted-foreground">{transaction.customer.phone}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                 className={transaction.status === 'completed' ? 'bg-green-500' : ''}>
            {transaction.status || 'Unknown'}
          </Badge>
        </div>
      </div>
    </GlassModal>
  );
}