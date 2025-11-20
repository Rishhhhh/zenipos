import { supabase } from '@/integrations/supabase/client';
import {
  generateTestPageHTML,
  generate58mmReceiptHTML,
  generate80mmKitchenTicketHTML,
  TestPageData,
  ReceiptData,
  KitchenTicketData
} from './browserPrintTemplates';

/**
 * Browser-native print service using window.print()
 * Works with any Windows printer via the browser's print dialog
 */
export class BrowserPrintService {
  /**
   * Print HTML content using browser's native print dialog
   */
  static printHTML(html: string, deviceId?: string, deviceName?: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Create a hidden iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        // Write content to iframe
        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) {
          throw new Error('Failed to access iframe document');
        }

        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        // Wait for content to load, then trigger print
        iframe.onload = () => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            // Log successful print attempt
            this.logPrintAttempt(deviceId, 'success', deviceName);
            
            console.log(`🖨️ Print dialog opened for: ${deviceName || 'default printer'}`);
            
            // Clean up after a delay (user may still be in print dialog)
            setTimeout(() => {
              document.body.removeChild(iframe);
              resolve(true);
            }, 1000);
          } catch (printError) {
            console.error('Print error:', printError);
            this.logPrintAttempt(deviceId, 'error', deviceName, String(printError));
            document.body.removeChild(iframe);
            resolve(false);
          }
        };
      } catch (error) {
        console.error('Failed to create print window:', error);
        this.logPrintAttempt(deviceId, 'error', deviceName, String(error));
        resolve(false);
      }
    });
  }

  /**
   * Print a test page for device verification
   */
  static async printTestPage(deviceData: TestPageData & { id?: string }): Promise<boolean> {
    const html = generateTestPageHTML(deviceData);
    return this.printHTML(html, deviceData.id, deviceData.deviceName);
  }

  /**
   * Print a customer receipt
   */
  static async printReceipt(receiptData: ReceiptData, deviceId?: string, deviceName?: string): Promise<boolean> {
    const html = generate58mmReceiptHTML(receiptData);
    return this.printHTML(html, deviceId, deviceName);
  }

  /**
   * Print a kitchen ticket
   */
  static async printKitchenTicket(ticketData: KitchenTicketData, deviceId?: string, deviceName?: string): Promise<boolean> {
    const html = generate80mmKitchenTicketHTML(ticketData);
    return this.printHTML(html, deviceId, deviceName);
  }

  /**
   * Log print attempt to device health log
   */
  private static async logPrintAttempt(
    deviceId: string | undefined,
    status: 'success' | 'error',
    deviceName?: string,
    errorMessage?: string
  ): Promise<void> {
    if (!deviceId) return;

    try {
      await supabase.from('device_health_log').insert({
        device_id: deviceId,
        status: status === 'success' ? 'online' : 'error',
        error_message: errorMessage || null,
        metadata: {
          print_method: 'browser',
          timestamp: new Date().toISOString(),
          device_name: deviceName
        }
      });
    } catch (error) {
      console.error('Failed to log print attempt:', error);
    }
  }

  /**
   * Check if browser supports printing
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.print === 'function';
  }

  /**
   * Open system printer settings (Windows only)
   */
  static openSystemPrinterSettings(): void {
    // Try Windows settings deep link
    const settingsUrl = 'ms-settings:printers';
    window.open(settingsUrl, '_blank');
    
    console.log('🔧 Opening Windows printer settings...');
  }

  /**
   * Get printer status from recent health logs
   */
  static async getPrinterStatus(deviceId: string): Promise<{
    status: 'ready' | 'idle' | 'offline' | 'unknown';
    lastSeen: Date | null;
    lastError: string | null;
  }> {
    try {
      const { data: logs } = await supabase
        .from('device_health_log')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!logs || logs.length === 0) {
        return { status: 'unknown', lastSeen: null, lastError: null };
      }

      const lastLog = logs[0];
      const lastSeen = new Date(lastLog.created_at || Date.now());
      const minutesSinceLastPrint = (Date.now() - lastSeen.getTime()) / 1000 / 60;

      let status: 'ready' | 'idle' | 'offline' | 'unknown';
      if (lastLog.status === 'error') {
        status = 'offline';
      } else if (minutesSinceLastPrint < 5) {
        status = 'ready';
      } else if (minutesSinceLastPrint < 60) {
        status = 'idle';
      } else {
        status = 'offline';
      }

      return {
        status,
        lastSeen,
        lastError: lastLog.error_message || null
      };
    } catch (error) {
      console.error('Failed to get printer status:', error);
      return { status: 'unknown', lastSeen: null, lastError: null };
    }
  }
}
