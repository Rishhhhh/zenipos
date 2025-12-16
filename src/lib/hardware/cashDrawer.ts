import { supabase } from '@/integrations/supabase/client';

// QZ Tray types
declare const qz: any;

export interface CashDrawerSettings {
  enabled: boolean;
  printerName: string | null;
  kickMode: 0 | 1;
  t1: number;
  t2: number;
  autoOpenOnCashInitiated: boolean;
  autoOpenOnCashCompleted: boolean;
  requireManagerPinForManualOpen: boolean;
}

const SETTINGS_KEY = 'zenipos.cashDrawer.settings';

const DEFAULT_SETTINGS: CashDrawerSettings = {
  enabled: true,
  printerName: null,
  kickMode: 0,
  t1: 25,
  t2: 250,
  autoOpenOnCashInitiated: true,
  autoOpenOnCashCompleted: true,
  requireManagerPinForManualOpen: true,
};

export function getCashDrawerSettings(): CashDrawerSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load cash drawer settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function setCashDrawerSettings(settings: Partial<CashDrawerSettings>): void {
  const current = getCashDrawerSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}

export async function ensureQzConnected(): Promise<boolean> {
  try {
    if (typeof qz === 'undefined') {
      throw new Error('QZ Tray library not loaded');
    }

    if (!qz.websocket.isActive()) {
      await qz.websocket.connect();
    }
    return true;
  } catch (error) {
    console.error('QZ Tray connection failed:', error);
    return false;
  }
}

export async function listQzPrinters(): Promise<string[]> {
  try {
    const connected = await ensureQzConnected();
    if (!connected) {
      return [];
    }
    const printers = await qz.printers.find();
    return Array.isArray(printers) ? printers : [printers];
  } catch (error) {
    console.error('Failed to list printers:', error);
    return [];
  }
}

export async function kickCashDrawer(
  reason: string,
  meta?: { orderId?: string; userId?: string }
): Promise<{ success: boolean; error?: string }> {
  const settings = getCashDrawerSettings();

  if (!settings.enabled) {
    return { success: false, error: 'Cash drawer is disabled in settings' };
  }

  if (!settings.printerName) {
    return { success: false, error: 'No printer configured for cash drawer' };
  }

  try {
    const connected = await ensureQzConnected();
    if (!connected) {
      return { 
        success: false, 
        error: 'QZ Tray not detected. Please ensure QZ Tray is running on this POS.' 
      };
    }

    // ESC/POS drawer kick command: ESC p m t1 t2
    // 0x1B = ESC, 0x70 = 'p', m = pin (0 or 1), t1/t2 = pulse times
    const kickCommand = [0x1B, 0x70, settings.kickMode, settings.t1, settings.t2];
    
    const config = qz.configs.create(settings.printerName);
    
    await qz.print(config, [{
      type: 'raw',
      format: 'command',
      data: kickCommand,
      options: { language: 'ESCPOS' }
    }]);

    // Audit log (non-blocking)
    logDrawerOpen(reason, settings, meta).catch(err => 
      console.warn('Failed to log drawer open:', err)
    );

    return { success: true };
  } catch (error: any) {
    console.error('Cash drawer kick failed:', error);
    return { 
      success: false, 
      error: error?.message || 'Failed to open cash drawer' 
    };
  }
}

async function logDrawerOpen(
  reason: string,
  settings: CashDrawerSettings,
  meta?: { orderId?: string; userId?: string }
): Promise<void> {
  try {
    await supabase.from('audit_log').insert({
      actor: meta?.userId || null,
      action: 'cash_drawer.open',
      entity: 'cash_drawer',
      entity_id: meta?.orderId || null,
      diff: {
        reason,
        printerName: settings.printerName,
        kickMode: settings.kickMode,
        t1: settings.t1,
        t2: settings.t2,
      },
    });
  } catch (error) {
    console.warn('Audit log insert failed:', error);
  }
}

// Check if QZ Tray is available
export function isQzAvailable(): boolean {
  return typeof qz !== 'undefined';
}

// Get QZ connection status
export async function getQzStatus(): Promise<'connected' | 'disconnected' | 'unavailable'> {
  if (!isQzAvailable()) {
    return 'unavailable';
  }
  try {
    return qz.websocket.isActive() ? 'connected' : 'disconnected';
  } catch {
    return 'unavailable';
  }
}
