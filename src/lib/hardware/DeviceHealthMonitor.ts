import { supabase } from '@/integrations/supabase/client';

export class DeviceHealthMonitor {
  private static intervals: Map<string, number> = new Map();
  private static isMonitoring = false;
  
  /**
   * Start monitoring all devices
   */
  static async startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Starting device health monitoring...');
    
    const { data: devices } = await supabase
      .from('devices')
      .select('*');
    
    if (!devices) return;
    
    for (const device of devices) {
      this.monitorDevice(device);
    }
  }
  
  /**
   * Monitor individual device
   */
  private static monitorDevice(device: any) {
    // Clear existing interval if any
    if (this.intervals.has(device.id)) {
      clearInterval(this.intervals.get(device.id));
    }
    
    // Set up periodic health check
    const interval = window.setInterval(async () => {
      await this.checkDeviceHealth(device);
    }, device.health_check_interval * 1000);
    
    this.intervals.set(device.id, interval);
  }
  
  /**
   * Check device health based on role
   */
  private static async checkDeviceHealth(device: any) {
    let status: 'online' | 'offline' | 'error' = 'offline';
    let errorMessage: string | null = null;
    
    try {
      switch (device.role) {
        case 'PRINTER':
          status = await this.checkPrinterHealth(device);
          break;
        case 'KDS':
          status = await this.checkKDSHealth(device);
          break;
        case 'NFC_SCANNER':
          status = await this.checkNFCHealth(device);
          break;
        default:
          // For other devices, check last_seen timestamp
          const lastSeen = new Date(device.last_seen);
          const now = new Date();
          const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
          status = diffMinutes < 5 ? 'online' : 'offline';
      }
    } catch (error: any) {
      status = 'error';
      errorMessage = error.message;
    }
    
    // Update device status if changed
    if (status !== device.status) {
      await supabase
        .from('devices')
        .update({ 
          status,
          last_seen: new Date().toISOString()
        })
        .eq('id', device.id);
    }
    
    // Log health check
    await supabase.from('device_health_log').insert({
      device_id: device.id,
      status,
      error_message: errorMessage
    });
  }
  
  /**
   * Check printer health via ping
   */
  private static async checkPrinterHealth(device: any): Promise<'online' | 'offline'> {
    if (!device.ip_address) return 'offline';
    
    try {
      // Attempt simple HTTP ping to printer
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://${device.ip_address}`, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok ? 'online' : 'offline';
    } catch {
      return 'offline';
    }
  }
  
  /**
   * Check KDS display health
   */
  private static async checkKDSHealth(device: any): Promise<'online' | 'offline'> {
    // KDS is a web client, check last heartbeat
    const { data } = await supabase
      .from('devices')
      .select('last_seen')
      .eq('id', device.id)
      .single();
    
    if (!data) return 'offline';
    
    const lastSeen = new Date(data.last_seen);
    const now = new Date();
    const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;
    
    return diffSeconds < 30 ? 'online' : 'offline';
  }
  
  /**
   * Check NFC scanner health
   */
  private static async checkNFCHealth(device: any): Promise<'online' | 'offline'> {
    // Check if NFC API is available
    if ('NDEFReader' in window) {
      return 'online';
    }
    return 'offline';
  }
  
  /**
   * Stop monitoring
   */
  static stopMonitoring() {
    console.log('⏸️ Stopping device health monitoring...');
    
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
    this.isMonitoring = false;
  }
  
  /**
   * Update device heartbeat (call from KDS/POS clients)
   */
  static async heartbeat(deviceId: string) {
    await supabase
      .from('devices')
      .update({ 
        last_seen: new Date().toISOString(),
        status: 'online'
      })
      .eq('id', deviceId);
  }
}

// Auto-start monitoring when module loads
if (typeof window !== 'undefined') {
  // Start after a short delay to ensure supabase is ready
  setTimeout(() => {
    DeviceHealthMonitor.startMonitoring();
  }, 2000);
}
