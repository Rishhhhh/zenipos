import qz from "qz-tray";
import { initQzSecurity } from "@/lib/hardware/qzSecurity";

export type PrintReceiptOpts = {
  printerName: string;
  receiptText: string;          // plain text receipt (80mm)
  feedLines?: number;           // default 5
  cut?: boolean;                // default true
  openDrawer?: boolean;         // default false (set true for CASH)
};

// ESC/POS Commands - exact bytes matching QZ demo escpos_sample.bin
const ESC_INIT = "\x1B\x40";             // ESC @ - Initialize printer
const LF = "\x0A";                       // Line feed
const CUT_ESC_I = "\x1B\x69";            // ESC i - Cut paper (matches escpos_sample.bin)
const DRAWER_PULSE = "\x10\x14\x01\x00\x05"; // DLE DC4 pulse (matches escpos_sample.bin)

// Connection timeout (5 seconds)
const CONNECTION_TIMEOUT_MS = 5000;
const PRINT_TIMEOUT_MS = 10000;

// Normalize text for ESC/POS
function safeText(s: string): string {
  return (s ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

// Promise with timeout wrapper
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Ensure QZ Tray is connected with security initialized (cached connection)
async function ensureQzConnected(): Promise<void> {
  const startTime = performance.now();
  
  // Check if already connected first (fast path)
  if (qz.websocket.isActive()) {
    console.log(`[QZ] Already connected (${(performance.now() - startTime).toFixed(0)}ms)`);
    return;
  }
  
  // Initialize security only if not already done
  const secStart = performance.now();
  await initQzSecurity();
  console.log(`[QZ] Security init: ${(performance.now() - secStart).toFixed(0)}ms`);
  
  // Connect with timeout
  const connStart = performance.now();
  await withTimeout(
    qz.websocket.connect(),
    CONNECTION_TIMEOUT_MS,
    'QZ connection'
  );
  console.log(`[QZ] Connected: ${(performance.now() - connStart).toFixed(0)}ms (total: ${(performance.now() - startTime).toFixed(0)}ms)`);
}

/**
 * Print receipt via QZ Tray with ESC/POS commands for cut and drawer kick.
 * This matches the behavior of QZ demo escpos_sample.bin
 */
export async function qzPrintReceiptEscpos(opts: PrintReceiptOpts): Promise<void> {
  const totalStart = performance.now();
  
  const {
    printerName,
    receiptText,
    feedLines = 5,
    cut = true,
    openDrawer = false,
  } = opts;

  if (!printerName) throw new Error("No printerName provided");

  console.log('[QZ ESC/POS] Starting print job...', {
    printerName,
    textLength: receiptText.length,
    feedLines,
    cut,
    openDrawer,
  });

  // Connect (uses cached connection if available)
  await ensureQzConnected();

  const configStart = performance.now();
  const config = qz.configs.create(printerName);
  console.log(`[QZ] Config created: ${(performance.now() - configStart).toFixed(0)}ms`);

  const text = safeText(receiptText);
  const feed = LF.repeat(Math.max(0, feedLines));

  // Build raw data array - QZ accepts mixed raw strings containing control bytes
  // Order: Initialize → Text → Feed → Cut → Drawer
  const data: string[] = [
    ESC_INIT,                           // Initialize printer
    text + LF,                          // Receipt text with trailing LF
    feed,                               // Feed lines before cut
    cut ? CUT_ESC_I : "",               // Cut command (ESC i)
    openDrawer ? DRAWER_PULSE : "",     // Drawer kick (DLE DC4)
  ].filter(Boolean);

  // Print with timeout
  const printStart = performance.now();
  await withTimeout(
    qz.print(config, data),
    PRINT_TIMEOUT_MS,
    'QZ print'
  );
  
  const totalTime = performance.now() - totalStart;
  console.log(`[QZ ESC/POS] ✅ Print complete: ${(performance.now() - printStart).toFixed(0)}ms (total: ${totalTime.toFixed(0)}ms)`);
  
  // Warn if slow
  if (totalTime > 3000) {
    console.warn(`[QZ ESC/POS] ⚠️ Slow print operation: ${totalTime.toFixed(0)}ms`);
  }
}

/**
 * Get configured printer name from localStorage
 */
export function getConfiguredPrinterName(): string | null {
  try {
    const settings = localStorage.getItem('zenipos.cashDrawer.settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed?.printerName || null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}
