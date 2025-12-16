/**
 * Plain-text receipt generator for 80mm ESC/POS thermal printers
 * Outputs simple text that can be sent via QZ Tray raw printing
 */

const WIDTH = 48; // Typical 80mm ESC/POS Font A character width

function padRight(s: string, n: number): string {
  s = s ?? "";
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

function padLeft(s: string, n: number): string {
  s = s ?? "";
  return s.length >= n ? s.slice(0, n) : " ".repeat(n - s.length) + s;
}

function center(s: string, n: number): string {
  s = s ?? "";
  if (s.length >= n) return s.slice(0, n);
  const pad = Math.floor((n - s.length) / 2);
  return " ".repeat(pad) + s + " ".repeat(n - s.length - pad);
}

function money(n: number): string {
  return (Number(n || 0)).toFixed(2);
}

function line(ch = "-"): string {
  return ch.repeat(WIDTH);
}

export interface ReceiptOrderItem {
  name?: string;
  quantity?: number;
  price?: number;
  total?: number;
  total_price?: number;
  menu_items?: { name?: string };
}

export interface ReceiptOrder {
  id?: string;
  order_number?: string;
  paid_at?: string;
  created_at?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  tables?: { label?: string };
  order_items?: ReceiptOrderItem[];
}

export interface ReceiptParams {
  orgName?: string;
  branchName?: string;
  branchAddress?: string;
  order: ReceiptOrder;
  paymentMethod?: string;
  cashReceived?: number;
  changeGiven?: number;
}

/**
 * Build a plain-text 80mm receipt from order data.
 * Compatible with ESC/POS raw printing via QZ Tray.
 */
export function buildReceiptText80mm(params: ReceiptParams): string {
  const { 
    orgName, 
    branchName, 
    branchAddress,
    order, 
    paymentMethod,
    cashReceived,
    changeGiven,
  } = params;

  const items = Array.isArray(order?.order_items) ? order.order_items : [];
  const tableLabel = order?.tables?.label ?? "-";
  const orderNo = (order?.order_number || order?.id || "").toString().slice(-6).toUpperCase();
  const dt = order?.paid_at || order?.created_at || new Date().toISOString();
  
  // Format datetime
  const dateObj = new Date(dt);
  const dateStr = dateObj.toLocaleDateString('en-MY', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  const timeStr = dateObj.toLocaleTimeString('en-MY', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Calculate totals
  let subtotal = order?.subtotal ?? 0;
  if (!subtotal) {
    for (const it of items) {
      subtotal += Number(it?.total_price || it?.total || 0);
    }
  }
  const tax = order?.tax ?? 0;
  const total = order?.total ?? subtotal + tax;

  const lines: string[] = [];

  // Header
  lines.push(center(orgName || "ZeniPOS", WIDTH));
  if (branchName) lines.push(center(branchName, WIDTH));
  if (branchAddress) lines.push(center(branchAddress, WIDTH));
  lines.push("");
  lines.push(line("="));
  lines.push("");
  
  // Order info
  lines.push(`ORDER #${orderNo}`);
  lines.push(`TABLE: ${tableLabel}`);
  lines.push(`DATE: ${dateStr}  TIME: ${timeStr}`);
  lines.push("");
  lines.push(line("-"));
  lines.push("");

  // Column headers
  const qtyWidth = 4;
  const priceWidth = 10;
  const nameWidth = WIDTH - qtyWidth - priceWidth;
  lines.push(
    padRight("QTY", qtyWidth) + 
    padRight("ITEM", nameWidth) + 
    padLeft("AMOUNT", priceWidth)
  );
  lines.push(line("-"));

  // Item lines
  for (const it of items) {
    const qty = Number(it?.quantity || 1);
    const name = (it?.menu_items?.name ?? it?.name ?? "Item").toString().toUpperCase();
    const amt = money(it?.total_price || it?.total || 0);

    // Truncate name if too long
    const truncatedName = name.length > nameWidth - 1 ? name.slice(0, nameWidth - 1) : name;
    
    lines.push(
      padRight(qty.toString(), qtyWidth) +
      padRight(truncatedName, nameWidth) +
      padLeft(amt, priceWidth)
    );
  }

  lines.push("");
  lines.push(line("-"));

  // Totals section
  const labelWidth = WIDTH - 12;
  lines.push(padRight("SUBTOTAL", labelWidth) + padLeft(`RM ${money(subtotal)}`, 12));
  if (tax > 0) {
    lines.push(padRight("TAX (6%)", labelWidth) + padLeft(`RM ${money(tax)}`, 12));
  }
  lines.push(line("-"));
  lines.push(padRight("TOTAL", labelWidth) + padLeft(`RM ${money(total)}`, 12));
  lines.push(line("="));

  // Payment info
  if (paymentMethod) {
    lines.push("");
    lines.push(padRight("PAYMENT:", labelWidth) + padLeft(paymentMethod.toUpperCase(), 12));
    
    if (paymentMethod.toLowerCase() === 'cash' && cashReceived !== undefined) {
      lines.push(padRight("CASH RECEIVED:", labelWidth) + padLeft(`RM ${money(cashReceived)}`, 12));
      if (changeGiven !== undefined && changeGiven > 0) {
        lines.push(padRight("CHANGE:", labelWidth) + padLeft(`RM ${money(changeGiven)}`, 12));
      }
    }
  }

  // Footer
  lines.push("");
  lines.push(line("="));
  lines.push("");
  lines.push(center("THANK YOU!", WIDTH));
  lines.push(center("PLEASE COME AGAIN", WIDTH));
  lines.push("");

  return lines.join("\n");
}
