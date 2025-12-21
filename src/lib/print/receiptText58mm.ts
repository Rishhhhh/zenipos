/**
 * Plain-text receipt generator for 58mm ESC/POS thermal printers
 * Compact format for narrow thermal paper rolls
 */

const WIDTH = 32; // 58mm printer character width

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
 * Build a plain-text 58mm receipt from order data.
 * Compact format for narrow thermal paper.
 */
export function buildReceiptText58mm(params: ReceiptParams): string {
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
  
  // Format datetime (compact)
  const dateObj = new Date(dt);
  const dateStr = dateObj.toLocaleDateString('en-MY', { 
    day: '2-digit', 
    month: '2-digit', 
    year: '2-digit' 
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

  // Header (compact)
  const displayName = (orgName || "ZeniPOS").substring(0, WIDTH);
  lines.push(center(displayName, WIDTH));
  if (branchName) {
    lines.push(center(branchName.substring(0, WIDTH), WIDTH));
  }
  lines.push(line("="));
  
  // Order info (compact single line)
  lines.push(`#${orderNo} T:${tableLabel}`);
  lines.push(`${dateStr} ${timeStr}`);
  lines.push(line("-"));

  // Item lines (compact: qty + name + price)
  for (const it of items) {
    const qty = Number(it?.quantity || 1);
    const name = (it?.menu_items?.name ?? it?.name ?? "Item").toString().toUpperCase();
    const amt = money(it?.total_price || it?.total || 0);
    
    // Format: "2x ITEM NAME    12.00"
    const priceWidth = 7;
    const nameWidth = WIDTH - 3 - priceWidth; // 3 for "Nx "
    const truncatedName = name.length > nameWidth ? name.slice(0, nameWidth) : name;
    
    lines.push(
      `${qty}x ` +
      padRight(truncatedName, nameWidth) +
      padLeft(amt, priceWidth)
    );
  }

  lines.push(line("-"));

  // Totals (compact)
  const labelWidth = WIDTH - 9;
  lines.push(padRight("SUBTOTAL", labelWidth) + padLeft(`RM${money(subtotal)}`, 9));
  if (tax > 0) {
    lines.push(padRight("TAX", labelWidth) + padLeft(`RM${money(tax)}`, 9));
  }
  lines.push(line("-"));
  lines.push(padRight("TOTAL", labelWidth) + padLeft(`RM${money(total)}`, 9));
  
  // Payment info - prominent section
  if (paymentMethod) {
    lines.push(line("="));
    lines.push(padRight(paymentMethod.toUpperCase(), labelWidth) + padLeft(`RM${money(cashReceived ?? total)}`, 9));
    
    if (paymentMethod.toLowerCase() === 'cash' && changeGiven !== undefined) {
      lines.push(padRight("CHANGE", labelWidth) + padLeft(`RM${money(changeGiven)}`, 9));
    }
  }
  
  lines.push(line("="));

  // Footer (compact)
  lines.push("");
  lines.push(center("THANK YOU!", WIDTH));
  lines.push("");

  return lines.join("\n");
}
