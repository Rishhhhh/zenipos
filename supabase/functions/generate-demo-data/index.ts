import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Seeded random generator for deterministic data
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// Poisson distribution for realistic order patterns
function poisson(lambda: number, random: SeededRandom): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= random.next();
  } while (p > L);
  return k - 1;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { seed = 42 } = await req.json();
    const random = new SeededRandom(seed);

    console.log('🌱 Generating demo data with seed:', seed);

    // 1. Create employees (5)
    const employees = [];
    const roles = ['admin', 'manager', 'cashier', 'cashier', 'cashier'];
    for (let i = 0; i < 5; i++) {
      const { data: emp } = await supabase.from('employees').insert({
        name: ['Alex Chen', 'Maria Garcia', 'John Smith', 'Sarah Lee', 'Mike Johnson'][i],
        role: roles[i],
        pin: String(1234 + i).padStart(4, '0'),
        hourly_rate: 15 + (i * 2),
        active: true,
      }).select().single();
      if (emp) employees.push(emp);
    }

    // 2. Create menu categories and items
    const categories = [
      { name: 'Appetizers', sort_order: 1 },
      { name: 'Soups & Salads', sort_order: 2 },
      { name: 'Mains', sort_order: 3 },
      { name: 'Sides', sort_order: 4 },
      { name: 'Desserts', sort_order: 5 },
      { name: 'Beverages', sort_order: 6 },
      { name: 'Hot Drinks', sort_order: 7 },
      { name: 'Specials', sort_order: 8 },
    ];

    const { data: cats } = await supabase.from('menu_categories').insert(categories).select();

    const menuItems = [];
    const itemNames = [
      'Popiah', 'Curry Puff', 'Keropok Lekor', 'Cucur Udang', 'Samosa', 'Spring Roll', 'Satay Ayam', 'Otak-Otak',
      'Sup Tulang', 'Tom Yum', 'Soto Ayam', 'Salad Ulam', 'Kerabu',
      'Nasi Goreng Kampung', 'Nasi Lemak', 'Mee Goreng Mamak', 'Char Kuey Teow', 'Laksa Johor', 'Rendang Daging', 'Ayam Percik', 'Sambal Udang', 'Ikan Bakar', 'Nasi Kandar', 'Roti Canai', 'Murtabak', 'Nasi Kerabu',
      'Keledek Goreng', 'Nasi Putih', 'Acar Jelatah', 'Ulam Raja', 'Sayur Goreng',
      'Kuih Lapis', 'Cendol', 'Ais Kacang', 'Pulut Kuning', 'Dodol',
      'Air Sirap', 'Limau Ais', 'Bandung', 'Milo Ais', 'Teh Tarik', 'Kopi O', 'Sky Juice', 'Teh O Limau',
      'Kopi Tarik', 'Teh Halia', 'Nescafe', 'Milo Panas', 'Horlicks',
      'Nasi Dagang', 'Nasi Beriani', 'Gulai Kambing', 'Asam Pedas',
    ];

    const phi = 1.618; // Golden ratio
    for (let i = 0; i < 50 && i < itemNames.length; i++) {
      const category = cats![i % cats!.length];
      const basePrice = [8, 10, 18, 5, 7, 4, 3, 25][i % 8];
      const price = Math.round(basePrice * Math.pow(phi, (i % 10) / 10));

      const { data: item } = await supabase.from('menu_items').insert({
        name: itemNames[i],
        sku: `ITEM-${String(i).padStart(4, '0')}`,
        category_id: category.id,
        sst_rate: 0.06,
        price,
        cost: Math.round(price * 0.35),
        tax_rate: 0.08,
        description: `Delicious ${itemNames[i]}`,
        in_stock: true,
        track_inventory: random.next() > 0.3,
      }).select().single();
      if (item) menuItems.push(item);
    }

    // 3. Create customers (200 with 20% VIP - Pareto principle)
    const customers = [];
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Sarah'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

    for (let i = 0; i < 200; i++) {
      const firstName = firstNames[Math.floor(random.next() * firstNames.length)];
      const lastName = lastNames[Math.floor(random.next() * lastNames.length)];
      const isVIP = i < 40; // Top 20%
      const visitCount = isVIP ? 15 + Math.floor(random.next() * 20) : 2 + Math.floor(random.next() * 8);
      const avgSpend = isVIP ? 150 : 35;

      const { data: customer } = await supabase.from('customers').insert({
        name: `${firstName} ${lastName}`,
        phone: `+60${Math.floor(random.next() * 100000000)}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        loyalty_points: Math.floor(avgSpend * visitCount * 0.1),
        total_spent: avgSpend * visitCount,
        total_orders: visitCount,
        last_visit: new Date(Date.now() - Math.floor(random.next() * 30) * 24 * 60 * 60 * 1000),
      }).select().single();
      if (customer) customers.push(customer);
    }

    // 4. Generate historical orders (last 30 days)
    const orders = [];
    const now = Date.now();

    for (let d = 0; d < 30; d++) {
      const date = new Date(now - d * 24 * 60 * 60 * 1000);

      for (let h = 7; h < 23; h++) {
        const lambda = 
          (h >= 12 && h <= 14) ? 5 :
          (h >= 18 && h <= 21) ? 7 :
          1;

        const orderCount = poisson(lambda, random);

        for (let o = 0; o < orderCount; o++) {
          const orderDate = new Date(date);
          orderDate.setHours(h, Math.floor(random.next() * 60), 0);

          const customer = customers[Math.floor(random.next() * customers.length)];
          const itemCount = 1 + poisson(2, random);
          let subtotal = 0;

          const { data: order } = await supabase.from('orders').insert({
            session_id: crypto.randomUUID(),
            order_type: random.next() > 0.3 ? 'dine_in' : 'takeaway',
            status: 'done',
            customer_id: customer.id,
            created_by: employees[Math.floor(random.next() * employees.length)].user_id,
            created_at: orderDate.toISOString(),
            updated_at: orderDate.toISOString(),
          }).select().single();

          if (order) {
            const orderItems = [];
            for (let i = 0; i < itemCount; i++) {
              const item = menuItems[Math.floor(random.next() * menuItems.length)];
              const qty = 1 + Math.floor(random.next() * 2);
              subtotal += item.price * qty;

              orderItems.push({
                order_id: order.id,
                menu_item_id: item.id,
                quantity: qty,
                unit_price: item.price,
              });
            }

            await supabase.from('order_items').insert(orderItems);

            const tax = subtotal * 0.08;
            const total = subtotal + tax;

            await supabase.from('orders').update({
              subtotal,
              tax,
              total,
            }).eq('id', order.id);

            // Create payment record
            await supabase.from('payments').insert({
              order_id: order.id,
              method: random.next() > 0.5 ? 'cash' : 'qr',
              amount: total,
              status: 'completed',
              created_at: orderDate.toISOString(),
            });

            orders.push(order);
          }
        }
      }
    }

    // 5. Mark demo mode as enabled
    await supabase.from('system_config').update({
      value: { enabled: true, seed, generated_at: new Date().toISOString() },
    }).eq('key', 'demo_mode');

    console.log('✅ Demo data generated successfully');

    return new Response(JSON.stringify({
      success: true,
      stats: {
        employees: employees.length,
        menu_items: menuItems.length,
        customers: customers.length,
        orders: orders.length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating demo data:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
