import { supabase } from '@/integrations/supabase/client';
import qz from 'qz-tray';

export type CommandProfile = 'AUTO' | 'ESC_P' | 'PULSE';

export interface CashDrawerSettings {
  enabled: boolean;
  printerName: string | null;
  kickMode: 0 | 1;
  t1: number;
  t2: number;
  commandProfile: CommandProfile;
  autoOpenOnCashInitiated: boolean;
  autoOpenOnCashCompleted: boolean;
  requireManagerPinForManualOpen: boolean;
}

export type DebugLogger = (msg: string) => void;

export interface KickResult {
  success: boolean;
  error?: string;
  logs: string[];
}

const SETTINGS_KEY = 'zenipos.cashDrawer.settings';

const DEFAULT_SETTINGS: CashDrawerSettings = {
  enabled: true,
  printerName: null,
  kickMode: 0,
  t1: 25,
  t2: 250,
  commandProfile: 'AUTO',
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

// ============ HEX COMMAND HELPERS ============

// Convert number to 2-char uppercase hex
function toHexByte(n: number): string {
  return n.toString(16).toUpperCase().padStart(2, '0');
}

// Build ESC p m t1 t2 command as hex string
function buildEscPKickHex(kickMode: 0 | 1, t1: number, t2: number): string {
  // ESC=1B, p=70, then mode, t1, t2
  return `1B70${toHexByte(kickMode)}${toHexByte(t1)}${toHexByte(t2)}`;
}

// DLE DC4 pulse command (alternative drawer kick)
const PULSE_HEX = '1014010005'; // DLE=10, DC4=14, p=01, t1=00, t2=05

// Print hex commands using QZ raw API with correct format
async function printHexCommands(
  printerName: string,
  hexCommands: string[],
  debug?: DebugLogger
): Promise<void> {
  const config = qz.configs.create(printerName);

  const data = hexCommands.map(h => ({
    type: 'raw' as const,
    format: 'command' as const,
    flavor: 'hex' as const,
    data: h
  }));

  debug?.(`[QZ] Sending HEX blocks: ${JSON.stringify(hexCommands)}`);
  await qz.print(config, data);
  debug?.(`[QZ] Print job sent successfully`);
}

// Print visible test line to confirm job reached printer
async function printVisibleTestLine(
  printerName: string,
  debug?: DebugLogger
): Promise<void> {
  const config = qz.configs.create(printerName);
  const line = `DRAWER TEST ${new Date().toISOString()}\n`;

  debug?.(`[QZ] Printing visible line: "${line.trim()}"`);
  await qz.print(config, [line]);
}

// ============ MAIN KICK FUNCTION ============

export async function kickCashDrawer(
  reason: string,
  meta?: { orderId?: string; userId?: string },
  debug?: DebugLogger
): Promise<KickResult> {
  const logs: string[] = [];
  const log = (msg: string) => {
    const entry = `${new Date().toISOString().substring(11, 23)} ${msg}`;
    logs.push(entry);
    debug?.(msg);
  };

  const settings = getCashDrawerSettings();

  log(`[Config] enabled=${settings.enabled}, printer=${settings.printerName}`);
  log(`[Config] profile=${settings.commandProfile}, kickMode=${settings.kickMode}, t1=${settings.t1}, t2=${settings.t2}`);

  if (!settings.enabled) {
    log(`[ERROR] Cash drawer disabled in settings`);
    return { success: false, error: 'Cash drawer is disabled in settings', logs };
  }

  if (!settings.printerName) {
    log(`[ERROR] No printer configured`);
    return { success: false, error: 'No printer configured for cash drawer', logs };
  }

  try {
    log(`[QZ] Checking connection...`);
    const connected = await ensureQzConnected();
    
    let isActive = false;
    try {
      isActive = qz.websocket.isActive();
    } catch {
      isActive = false;
    }
    log(`[QZ] websocket.isActive() = ${isActive}`);

    if (!connected) {
      log(`[ERROR] QZ Tray not connected`);
      return {
        success: false,
        error: 'QZ Tray not detected on this POS laptop. Open QZ Tray and allow this site (unsigned requests in dev).',
        logs
      };
    }

    // For test kicks, print visible line first to confirm printer spool
    if (reason === 'test') {
      log(`[Test] Printing visible test line...`);
      try {
        await printVisibleTestLine(settings.printerName, log);
        log(`[Test] Visible line printed - check printer output`);
      } catch (err: any) {
        log(`[Test] Failed to print test line: ${err?.message || 'Unknown error'}`);
      }
    }

    // Build commands based on profile
    const escHex = buildEscPKickHex(settings.kickMode, settings.t1, settings.t2);
    log(`[Command] ESC/POS hex: ${escHex}`);
    log(`[Command] PULSE hex: ${PULSE_HEX}`);

    let cmds: string[];
    switch (settings.commandProfile) {
      case 'ESC_P':
        cmds = [escHex];
        log(`[Profile] Using ESC_P only`);
        break;
      case 'PULSE':
        cmds = [PULSE_HEX];
        log(`[Profile] Using PULSE only`);
        break;
      case 'AUTO':
      default:
        cmds = [escHex, PULSE_HEX];
        log(`[Profile] Using AUTO (both commands)`);
    }

    // Send the kick commands
    await printHexCommands(settings.printerName, cmds, log);
    log(`[SUCCESS] Drawer kick commands sent`);

    // Audit log (non-blocking)
    logDrawerOpen(reason, settings, meta).catch(err =>
      log(`[Audit] Warning: ${err?.message || 'Failed'}`)
    );

    return { success: true, logs };
  } catch (error: any) {
    log(`[ERROR] ${error?.message || 'Unknown error'}`);
    log(`[ERROR] Stack: ${error?.stack || 'No stack trace'}`);
    console.error('Cash drawer kick failed:', error);
    return { success: false, error: error?.message || 'Failed to open cash drawer', logs };
  }
}

async function logDrawerOpen(
  reason: string,
  settings: CashDrawerSettings,
  meta?: { orderId?: string; userId?: string }
): Promise<void> {
  try {
    // audit_log.actor is a FK to auth.users.id; use the current authed user to avoid FK conflicts
    const { data } = await supabase.auth.getUser();
    const actor = data.user?.id ?? null;

    await supabase.from('audit_log').insert({
      actor,
      action: 'cash_drawer.open',
      entity: 'cash_drawer',
      entity_id: meta?.orderId || null,
      diff: {
        reason,
        printerName: settings.printerName,
        commandProfile: settings.commandProfile,
        kickMode: settings.kickMode,
        t1: settings.t1,
        t2: settings.t2,
      },
    });
  } catch (error) {
    console.warn('Audit log insert failed:', error);
  }
}

// Check if QZ Tray is available (library is always loaded now via import)
export function isQzAvailable(): boolean {
  return qz && typeof qz.websocket !== 'undefined';
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
