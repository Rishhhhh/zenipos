import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

/**
 * Centralized query helper for completed orders with consistent filtering
 * Uses paid_at for accurate revenue tracking (orders paid today, regardless of creation date)
 */
export async function getCompletedOrdersQuery(
  startDate: Date,
  endDate: Date,
  branchId?: string
) {
  let query = supabase
    .from("orders")
    .select("*")
    .in("status", ["completed", "done"])
    .not("paid_at", "is", null)
    .gte("paid_at", startOfDay(startDate).toISOString())
    .lte("paid_at", endOfDay(endDate).toISOString());

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query.order("paid_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get pending orders (delivered but not paid)
 */
export async function getPendingOrdersQuery(
  startDate: Date,
  endDate: Date,
  branchId?: string
) {
  let query = supabase
    .from("orders")
    .select("*")
    .eq("status", "delivered")
    .gte("created_at", startOfDay(startDate).toISOString())
    .lte("created_at", endOfDay(endDate).toISOString());

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get completed payments with consistent filtering
 */
export async function getCompletedPaymentsQuery(
  startDate: Date,
  endDate: Date,
  branchId?: string
) {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      order:orders!inner(
        id,
        created_by, 
        branch_id,
        status,
        paid_at,
        employees(name)
      )
    `)
    .eq("status", "completed")
    .gte("created_at", startOfDay(startDate).toISOString())
    .lte("created_at", endOfDay(endDate).toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  // Client-side filter for branch and paid_at (PostgREST foreign table filtering is unreliable)
  const filtered = (data || []).filter(p => {
    const matchesBranch = !branchId || p.order?.branch_id === branchId;
    const hasPaidAt = p.order?.paid_at !== null;
    return matchesBranch && hasPaidAt;
  });
  
  return filtered;
}
