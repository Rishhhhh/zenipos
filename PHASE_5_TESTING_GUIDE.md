# Phase 5: Comprehensive Testing Guide

## Pre-Test Setup

**Before running tests:**

1. Clear browser console
2. Open Network tab
3. Have Lovable Cloud backend open for logs
4. Prepare test accounts:
   - Admin account (restoranalmufahtasik@gmail.com)
   - Station account (if separate)

---

## Test 1: Global KDS (/kds)

**Steps:**
1. Navigate to `/kds`
2. **Expected:** Page loads without errors

**Verification Checklist:**
- [ ] No red error banner appears
- [ ] Console shows: `✅ KDS loaded orders: X`
- [ ] If orders exist, they display in cards
- [ ] If no orders, shows "No orders in queue" message
- [ ] Debug panel at bottom shows raw RPC data (collapsed)
- [ ] Timer on each order card ticks every second

**Error Test:**
1. Temporarily break the RPC (rename function in SQL)
2. Reload `/kds`
3. **Expected:** Red error banner with full error details
4. **Expected:** Debug panel shows error object
5. Restore RPC function

---

## Test 2: Station KDS (/kds/:stationId)

**Get a valid station ID first:**
```sql
SELECT id, name, type FROM stations LIMIT 5;
```

**Steps:**
1. Navigate to `/kds/[station-id]`
2. **Expected:** Page loads showing station name

**Verification Checklist:**
- [ ] Station name appears in header
- [ ] Console shows: `[StationKDS] Loaded X items for station [id]`
- [ ] Items filtered to this station only
- [ ] Each item shows:
  - [ ] Menu item name
  - [ ] Order type/table
  - [ ] Elapsed time
  - [ ] "Start" button (if kitchen_queue/pending)
  - [ ] "Ready" button (if preparing)

**Item Actions Test:**
1. Click "Start" on an item
2. **Expected:** Item status changes to "preparing"
3. **Expected:** Button changes to "Ready"
4. Click "Ready"
5. **Expected:** Item disappears from this station's queue
6. **Expected:** Toast notification appears

**Error Test:**
1. Use invalid station ID: `/kds/00000000-0000-0000-0000-000000000000`
2. **Expected:** Red error banner appears
3. **Expected:** Retry button present

---

## Test 3: New Order Flow (End-to-End)

**Steps:**
1. Go to `/pos`
2. Create a new order:
   - Select table or order type
   - Add 2-3 menu items from different categories
   - Add notes to one item
   - Submit order

**Verification Points:**

**Immediate (< 1 second):**
- [ ] Order confirmation appears
- [ ] Console: Order created with ID
- [ ] **Check DB immediately:**
  ```sql
  SELECT id, status, created_at 
  FROM orders 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  SELECT id, menu_item_id, status, station_id, prep_time_actual
  FROM order_items 
  WHERE order_id = '[order-id-from-above]';
  ```
- [ ] Order status: `kitchen_queue` or `preparing`
- [ ] **ALL items have `station_id` populated (NOT NULL)**
- [ ] **ALL items have `prep_time_actual` populated**
- [ ] Items status matches order status

**Within 3 seconds:**
- [ ] Navigate to `/kds`
- [ ] New order appears in the grid
- [ ] All items visible

**Station KDS Check:**
- [ ] Navigate to `/kds/[station-id-from-item]`
- [ ] Item appears in this station's queue
- [ ] Correct menu item name displayed

---

## Test 4: Real-Time Updates

**Setup:** Open two browser windows/tabs side-by-side:
- Window A: `/kds` (Global KDS)
- Window B: `/pos` (POS)

**Steps:**
1. In Window B (POS), create a new order
2. Watch Window A (KDS)
3. **Expected:** New order appears automatically within 1-2 seconds (NO manual refresh needed)

**Verification:**
- [ ] Order appears without refresh
- [ ] Console in Window A shows: `📥 Order change detected`
- [ ] Order count updates

**Station Real-Time Test:**
- Window A: `/kds/[station-id]`
- Window B: Create order with items for that station
- **Expected:** Items appear in Window A automatically

---

## Test 5: KDS Debug Panel (/admin/kds-debug)

**Steps:**
1. Navigate to `/admin/kds-debug`
2. **Expected:** Dashboard loads with 4 sections

**Verification Checklist:**

**Trigger Status Section:**
- [ ] Shows green checkmark: "auto_route_order_items trigger is ACTIVE"
- [ ] If red, trigger is missing (critical failure)

**Items by Station Section:**
- [ ] Shows cards for each station with item counts
- [ ] If any card shows "NO STATION (NULL)" with count > 0:
  - **This is a FAILURE** - items not being routed
- [ ] All stations should have names (not NULL)

**Items by Status Section:**
- [ ] Shows cards for each status
- [ ] Common statuses: `kitchen_queue`, `preparing`, `ready`, `delivered`
- [ ] No cards should show "NO STATUS" (unless historical data)

**Recent Items Table:**
- [ ] Shows last 20 items
- [ ] "Station (Item)" column: all should be GREEN (station name), not red "NULL"
- [ ] "Station (Menu)" column: all should show "✓"
- [ ] "Routing" column: all should show "✓ Routed" badge, not "✗ Failed"

**Real-Time Test:**
1. Keep debug panel open
2. Create new order from POS
3. **Expected:** Counts update automatically
4. **Expected:** New item appears in Recent Items table
5. **Expected:** "Last update" timestamp refreshes

---

## Test 6: Admin Live Flow

**Steps:**
1. Navigate to `/admin` (main admin dashboard)
2. Find "Live Restaurant Flow" widget/section
3. Create a test order from POS

**Verification:**
- [ ] Order appears in correct stage (New Orders / Kitchen)
- [ ] No errors in console about missing relationships
- [ ] Status updates when you bump orders in KDS
- [ ] Real-time updates work

---

## Test 7: Performance Verification

**Metrics to Track (use console.log timestamps):**

**Order Creation:**
1. Note time when "Submit Order" clicked
2. Note time when order confirmation appears
3. **Target:** < 200ms
4. **Check:**
   ```javascript
   // In browser console during POS order
   performance.mark('order-start');
   // ... submit order ...
   performance.mark('order-end');
   performance.measure('order-creation', 'order-start', 'order-end');
   console.log(performance.getEntriesByName('order-creation')[0].duration);
   ```

**KDS Update Latency:**
1. Create order (note timestamp)
2. Check KDS (when does it appear?)
3. **Target:** < 1 second
4. **Check console:** Look for `[kds_update]` performance track

**Console Errors:**
- [ ] Zero errors during normal operation
- [ ] No "401 Unauthorized" errors
- [ ] No "null reference" errors
- [ ] No "Cannot read property of undefined" errors

---

## Expected Outcomes

After completing all tests:

✅ **Phase 1-3 (COMPLETED):**
- KDS errors are visible, not silent
- Station routing trigger restored
- Status consistency fixed

✅ **Phase 4 (COMPLETED):**
- Station KDS errors display prominently
- Admin debug panel shows real-time item distribution
- Trigger verification visible
- Routing failures immediately apparent

✅ **Phase 5 (THIS PHASE - TESTING):**
- Global KDS works without errors
- Station KDS filters correctly
- Real-time updates function
- New orders route properly with station_id and prep_time
- Performance targets met (<200ms order creation, <1s KDS updates)
- Debug panel provides visibility into KDS health
- Zero console errors during normal operation

---

## Troubleshooting

**If items are missing station_id:**
1. Check debug panel - Trigger Status section
2. If trigger is missing/disabled, run Phase 2 migration again
3. Verify `menu_items` have `station_id` set
4. Backfill existing items manually if needed

**If KDS shows errors:**
1. Check debug panel error details
2. Verify RLS policies allow access
3. Check user's role and organization membership
4. Run RLS diagnostics (Phase 6 - future)

**If real-time updates don't work:**
1. Check browser console for websocket errors
2. Verify Supabase realtime is enabled
3. Check if `ALTER PUBLICATION supabase_realtime` includes tables
4. Test with manual refresh - if data appears, it's a realtime issue

---

## Success Criteria Summary

**ALL tests must pass before moving to production:**

- [ ] Global KDS loads and displays orders
- [ ] Station KDS filters by station correctly
- [ ] Error states display helpful information
- [ ] New orders have station_id and prep_time populated
- [ ] Real-time updates work across all views
- [ ] Debug panel shows healthy routing (green trigger, no NULL stations)
- [ ] Performance targets met
- [ ] Zero console errors
- [ ] Admin Live Flow displays correctly
