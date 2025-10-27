/**
 * E-Invoice Service
 * Handles B2B immediate submission and B2C consolidation
 */

import { supabase } from '@/integrations/supabase/client';
import { MyInvoisClient, type InvoiceDocument } from './MyInvoisClient';

export interface EInvoiceOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    sstRate: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  customerTin?: string;
  customerName?: string;
  customerAddress?: string;
}

export class EInvoiceService {
  private client: MyInvoisClient | null = null;

  async initialize() {
    const { data: config } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'myinvois')
      .single();

    const settings = config?.value as any;
    if (settings?.enabled) {
      this.client = new MyInvoisClient({
        environment: settings.environment,
        clientId: settings.client_id,
        clientSecret: settings.client_secret,
        supplierTin: settings.supplier_tin,
      });
    }
  }

  async submitB2BInvoice(order: EInvoiceOrder): Promise<string | null> {
    if (!this.client) {
      console.warn('MyInvois not configured');
      return null;
    }

    if (!order.customerTin) {
      throw new Error('B2B invoice requires customer TIN');
    }

    // Build invoice document
    const doc: InvoiceDocument = {
      invoiceNumber: order.orderNumber,
      issueDate: new Date(order.createdAt).toISOString().split('T')[0],
      supplierTin: (await this.getSupplierInfo()).tin,
      supplierName: (await this.getSupplierInfo()).name,
      supplierAddress: (await this.getSupplierInfo()).address,
      buyerTin: order.customerTin,
      buyerName: order.customerName,
      buyerAddress: order.customerAddress,
      items: order.items.map(item => ({
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        taxRate: item.sstRate,
        taxAmount: item.price * item.quantity * item.sstRate,
        subtotal: item.price * item.quantity,
        total: item.price * item.quantity * (1 + item.sstRate),
      })),
      subtotal: order.subtotal,
      taxAmount: order.tax,
      totalAmount: order.total,
      currency: 'MYR',
    };

    // Create pending record
    const { data: einvoice } = await supabase
      .from('einvoice_docs')
      .insert({
        order_id: order.id,
        type: 'Invoice',
        invoice_number: order.orderNumber,
        payload: doc as any,
        status: 'submitting',
        buyer_tin: order.customerTin,
        mode: 'b2b',
      })
      .select()
      .single();

    if (!einvoice) throw new Error('Failed to create e-invoice record');

    try {
      // Submit to LHDN
      const result = await this.client.submitDocument(doc);

      if (result.success && result.uuid) {
        // Update with success
        await supabase
          .from('einvoice_docs')
          .update({
            status: 'validated',
            uuid: result.uuid,
            long_id: result.longId,
            qr_url: this.client.buildQRUrl(result.uuid, result.longId!),
            submitted_at: new Date().toISOString(),
            validated_at: new Date().toISOString(),
          })
          .eq('id', einvoice.id);

        return result.uuid;
      } else {
        // Update with error
        await supabase
          .from('einvoice_docs')
          .update({
            status: 'rejected',
            error_json: {
              error: result.error,
              validationErrors: result.validationErrors,
            },
          })
          .eq('id', einvoice.id);

        throw new Error(result.error || 'Validation failed');
      }
    } catch (error: any) {
      // Mark as queued for retry
      await supabase
        .from('einvoice_docs')
        .update({
          status: 'queued',
          error_json: { error: error.message },
        })
        .eq('id', einvoice.id);

      throw error;
    }
  }

  async addToB2CConsolidation(order: EInvoiceOrder): Promise<void> {
    // Add to current month's consolidation bucket
    const month = new Date(order.createdAt).toISOString().slice(0, 7) + '-01';

    // Direct insert/update instead of RPC
    await supabase.from('b2c_consolidation_buckets').insert({
      month,
      outlet_name: 'Default Outlet',
      total_amount: order.total,
      total_tax: order.tax,
      total_orders: 1,
    });
  }

  async getInvoiceStatus(orderId: string): Promise<any> {
    const { data } = await supabase
      .from('einvoice_docs')
      .select('*')
      .eq('order_id', orderId)
      .single();

    return data;
  }

  async retryFailedSubmissions(): Promise<void> {
    const { data: failed } = await supabase
      .from('einvoice_docs')
      .select('*')
      .eq('status', 'queued')
      .limit(10);

    if (!failed) return;

    for (const doc of failed) {
      try {
        const payload = doc.payload as any;
        const order: EInvoiceOrder = {
          id: doc.order_id,
          orderNumber: doc.invoice_number,
          createdAt: doc.created_at,
          items: payload.items || [],
          subtotal: payload.subtotal || 0,
          tax: payload.taxAmount || 0,
          total: payload.totalAmount || 0,
          customerTin: doc.buyer_tin || undefined,
        };

        await this.submitB2BInvoice(order);
      } catch (error) {
        console.error(`Failed to retry e-invoice ${doc.id}:`, error);
      }
    }
  }

  private async getSupplierInfo() {
    const { data: config } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'myinvois')
      .single();

    const settings = config?.value as any;
    return {
      tin: settings?.supplier_tin || '',
      name: settings?.supplier_name || 'ZENI Restaurant',
      address: settings?.supplier_address || 'Kuala Lumpur, Malaysia',
    };
  }
}

export const eInvoiceService = new EInvoiceService();
