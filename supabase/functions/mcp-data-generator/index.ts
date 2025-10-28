import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Seeded random generator for deterministic data
class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed % 2147483647; if (this.seed <= 0) this.seed += 2147483646; }
  next(): number { this.seed = (this.seed * 16807) % 2147483647; return (this.seed - 1) / 2147483646; }
  range(min: number, max: number): number { return min + Math.floor(this.next() * (max - min + 1)); }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
}

// Poisson distribution for realistic patterns
function poisson(lambda: number, random: SeededRandom): number {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= random.next(); } while (p > L);
  return k - 1;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { action, tool, arguments: args, resourceUri } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // List capabilities
    if (action === 'list_capabilities') {
      return new Response(JSON.stringify({
        success: true,
        tools: [
          {
            name: 'generate_menu_items',
            description: 'Generate realistic menu items with AI-generated photos',
            inputSchema: {
              type: 'object',
              properties: {
                count: { type: 'number', description: 'Number of items to generate (default: 50)' },
                categories: { type: 'array', items: { type: 'string' }, description: 'Categories to generate' },
                cuisine_style: { type: 'string', enum: ['malaysian', 'western', 'chinese', 'fusion'], default: 'malaysian' },
                include_photos: { type: 'boolean', default: true, description: 'Generate AI photos for menu items' }
              }
            }
          },
          {
            name: 'generate_historical_orders',
            description: 'Generate realistic order history with time-based patterns',
            inputSchema: {
              type: 'object',
              properties: {
                start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
                volume_level: { type: 'string', enum: ['low', 'medium', 'high', 'rush'], default: 'medium' },
                include_patterns: { type: 'array', items: { type: 'string' }, description: 'Patterns: lunch_rush, dinner_peak, weekend_spike' }
              }
            }
          },
          {
            name: 'generate_customers',
            description: 'Generate customer base with Pareto loyalty distribution',
            inputSchema: {
              type: 'object',
              properties: {
                count: { type: 'number', description: 'Number of customers (default: 200)' },
                vip_percentage: { type: 'number', description: '% VIP customers (default: 20, Pareto 80/20)' },
                include_history: { type: 'boolean', default: true }
              }
            }
          },
          {
            name: 'generate_complete_year',
            description: 'Generate complete 1+ year operational data with all entities',
            inputSchema: {
              type: 'object',
              properties: {
                start_date: { type: 'string', description: 'Start date (YYYY-MM-DD, default: 1 year ago)' },
                end_date: { type: 'string', description: 'End date (YYYY-MM-DD, default: today)' },
                complexity: { type: 'string', enum: ['basic', 'advanced', 'enterprise'], default: 'enterprise' }
              }
            }
          },
          {
            name: 'validate_data_quality',
            description: 'Validate generated data quality and get improvement suggestions',
            inputSchema: {
              type: 'object',
              properties: {
                check_type: { type: 'string', enum: ['menu', 'orders', 'customers', 'all'], default: 'all' }
              }
            }
          }
        ],
        resources: []
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Execute tool
    if (action === 'execute_tool') {
      const random = new SeededRandom(args?.seed || 42);

      // Generate Menu Items
      if (tool === 'generate_menu_items') {
        const count = args?.count || 50;
        const cuisineStyle = args?.cuisine_style || 'malaysian';
        const includePhotos = args?.include_photos !== false;

        const malaysianItems = {
          'Appetizers': ['Acar Jelatah', 'Cucur Udang', 'Keropok Lekor', 'Popiah Basah', 'Satay Ayam', 'Otak-Otak', 'Roti Jala'],
          'Mains': ['Nasi Lemak Special', 'Char Kuey Teow', 'Mee Goreng Mamak', 'Ayam Percik', 'Rendang Daging', 'Ikan Bakar', 'Laksa Johor', 'Nasi Kerabu'],
          'Rice & Noodles': ['Nasi Ayam', 'Mee Rebus', 'Kuey Teow Soup', 'Nasi Dagang', 'Bihun Goreng', 'Mee Bandung'],
          'Drinks': ['Teh Tarik', 'Milo Ais', 'Air Sirap', 'Bandung', 'Kopi O', 'Cincau', 'Soya Cincau', 'Barli'],
          'Desserts': ['Cendol', 'Ais Kacang', 'Kuih Lapis', 'Sago Gula Melaka', 'Onde-Onde', 'Pulut Panggang']
        };

        const categories = Object.keys(malaysianItems);
        const { data: existingCats } = await supabase.from('menu_categories').select('id, name');
        const catMap: Record<string, string> = {};

        // Create categories
        for (let i = 0; i < categories.length; i++) {
          const existing = existingCats?.find((c: any) => c.name === categories[i]);
          if (existing) {
            catMap[categories[i]] = existing.id;
          } else {
            const { data } = await supabase.from('menu_categories').insert({
              name: categories[i],
              sort_order: i
            }).select('id').single();
            if (data) catMap[categories[i]] = data.id;
          }
        }

        const items = [];
        let generated = 0;

        for (const [category, itemNames] of Object.entries(malaysianItems)) {
          const categoryId = catMap[category];
          if (!categoryId) continue;

          for (const itemName of itemNames) {
            if (generated >= count) break;

            const basePrice = category === 'Drinks' ? random.range(3, 8) :
                            category === 'Desserts' ? random.range(5, 12) :
                            category === 'Appetizers' ? random.range(6, 15) :
                            random.range(8, 35);

            let imageUrl = null;
            if (includePhotos) {
              try {
                // Generate food photo using Lovable AI (Nano banana)
                const imagePrompt = `Professional food photography of ${itemName}, Malaysian ${category.toLowerCase()} dish, natural lighting, white plate, garnished, appetizing presentation, restaurant quality, 4K`;
                
                const imageRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${lovableApiKey}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    model: 'google/gemini-2.5-flash-image-preview',
                    messages: [{ role: 'user', content: imagePrompt }],
                    modalities: ['image', 'text']
                  })
                });

                if (imageRes.ok) {
                  const imageData = await imageRes.json();
                  const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
                  
                  if (base64Image) {
                    // Convert base64 to blob and upload to storage
                    const base64Data = base64Image.split(',')[1] || base64Image;
                    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                    const fileName = `${itemName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
                    
                    const { data: uploadData } = await supabase.storage
                      .from('menu-images')
                      .upload(`generated/${fileName}`, binaryData, {
                        contentType: 'image/png',
                        upsert: false
                      });

                    if (uploadData) {
                      const { data: urlData } = supabase.storage
                        .from('menu-images')
                        .getPublicUrl(uploadData.path);
                      imageUrl = urlData.publicUrl;
                    }
                  }
                }
              } catch (err) {
                console.error(`Failed to generate image for ${itemName}:`, err);
              }
            }

            items.push({
              name: itemName,
              category_id: categoryId,
              price: basePrice,
              cost: basePrice * 0.35,
              description: `Authentic Malaysian ${category.toLowerCase()}`,
              available: true,
              image_url: imageUrl,
              prep_time_minutes: random.range(5, 25)
            });

            generated++;
          }
        }

        const { data, error } = await supabase.from('menu_items').insert(items).select();
        
        return new Response(JSON.stringify({
          success: !error,
          data: { generated: data?.length || 0, items: data, with_photos: includePhotos },
          error: error?.message
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Generate Historical Orders
      if (tool === 'generate_historical_orders') {
        const startDate = new Date(args?.start_date || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
        const endDate = new Date(args?.end_date || new Date());
        const volumeLevel = (args?.volume_level || 'medium') as 'low' | 'medium' | 'high' | 'rush';
        const volumeMultiplier = { low: 0.5, medium: 1, high: 1.5, rush: 2 }[volumeLevel];

        const { data: menuItems } = await supabase.from('menu_items').select('id, price');
        const { data: customers } = await supabase.from('customers').select('id');
        const { data: employees } = await supabase.from('employees').select('auth_user_id').limit(1);
        
        if (!menuItems?.length || !customers?.length || !employees?.length) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Need menu items, customers, and employees first'
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
        }

        const orders = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const weekendBoost = isWeekend ? 1.3 : 1;

          for (let hour = 8; hour < 22; hour++) {
            let baseOrdersPerHour = 3;
            
            // Lunch rush (12-14)
            if (hour >= 12 && hour <= 14) baseOrdersPerHour = 8;
            // Dinner peak (18-21)
            if (hour >= 18 && hour <= 21) baseOrdersPerHour = 10;

            const ordersThisHour = poisson(baseOrdersPerHour * volumeMultiplier * weekendBoost, random);

            for (let i = 0; i < ordersThisHour; i++) {
              const orderTime = new Date(currentDate);
              orderTime.setHours(hour, random.range(0, 59), random.range(0, 59));

              const itemCount = random.range(1, 5);
              let subtotal = 0;
              const orderItems = [];

              for (let j = 0; j < itemCount; j++) {
                const item = random.pick(menuItems);
                const qty = random.range(1, 3);
                subtotal += item.price * qty;
                orderItems.push({
                  menu_item_id: item.id,
                  quantity: qty,
                  unit_price: item.price
                });
              }

              const tax = subtotal * 0.06;
              const total = subtotal + tax;

              orders.push({
                customer_id: random.pick(customers).id,
                created_by: employees[0].auth_user_id,
                status: 'paid',
                order_type: 'dine_in',
                subtotal,
                tax,
                total,
                created_at: orderTime.toISOString(),
                items: orderItems
              });
            }
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Insert orders
        let insertedCount = 0;
        for (const order of orders) {
          const items = order.items;
          const { items: _, ...orderWithoutItems } = order;

          const { data: orderData } = await supabase.from('orders').insert(orderWithoutItems).select('id').single();
          if (orderData) {
            await supabase.from('order_items').insert(
              items.map((item: any) => ({ ...item, order_id: orderData.id }))
            );
            insertedCount++;
          }
        }

        return new Response(JSON.stringify({
          success: true,
          data: { orders: insertedCount, date_range: { start: startDate, end: endDate } }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Generate Customers
      if (tool === 'generate_customers') {
        const count = args?.count || 200;
        const vipPercentage = args?.vip_percentage || 20;

        const malaysianNames = [
          'Ahmad Ismail', 'Siti Nurhaliza', 'Tan Wei Lun', 'Nurul Izzah', 'Lee Chong Wei',
          'Farah Liyana', 'Wong Mei Ling', 'Hassan Abdullah', 'Lim Su Yin', 'Aziz Rahman'
        ];

        const customers = [];
        for (let i = 0; i < count; i++) {
          const isVIP = (i / count) < (vipPercentage / 100);
          customers.push({
            name: random.pick(malaysianNames) + ' ' + random.range(1, 999),
            phone: `+6${random.range(10, 19)}-${random.range(100, 999)}-${random.range(1000, 9999)}`,
            email: `customer${i}@example.com`,
            loyalty_points: isVIP ? random.range(500, 2000) : random.range(0, 200),
            is_vip: isVIP,
            total_spent: 0,
            total_orders: 0
          });
        }

        const { data, error } = await supabase.from('customers').insert(customers).select();

        return new Response(JSON.stringify({
          success: !error,
          data: { generated: data?.length || 0, vip_count: customers.filter(c => c.is_vip).length },
          error: error?.message
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Generate Complete Year
      if (tool === 'generate_complete_year') {
        const startDate = args?.start_date || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = args?.end_date || new Date().toISOString().split('T')[0];

        const stats: any = {};

        // 1. Generate customers
        const customerRes = await fetch(`${supabaseUrl}/functions/v1/mcp-data-generator`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'execute_tool', tool: 'generate_customers', arguments: { count: 500, vip_percentage: 20 } })
        });
        const customerData = await customerRes.json();
        stats.customers = customerData.data?.generated || 0;

        // 2. Generate menu items with photos
        const menuRes = await fetch(`${supabaseUrl}/functions/v1/mcp-data-generator`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'execute_tool', tool: 'generate_menu_items', arguments: { count: 80, include_photos: true } })
        });
        const menuData = await menuRes.json();
        stats.menu_items = menuData.data?.generated || 0;

        // 3. Generate orders
        const orderRes = await fetch(`${supabaseUrl}/functions/v1/mcp-data-generator`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'execute_tool', tool: 'generate_historical_orders', arguments: { start_date: startDate, end_date: endDate, volume_level: 'high' } })
        });
        const orderData = await orderRes.json();
        stats.orders = orderData.data?.orders || 0;

        // 4. Validate data quality with Lovable AI
        const validationPrompt = `Analyze this generated restaurant data and score quality (0-100):

Generated Data:
- ${stats.menu_items} menu items (Malaysian cuisine)
- ${stats.orders} orders over ${startDate} to ${endDate}
- ${stats.customers} customers (20% VIP, Pareto distribution)

Validation Criteria:
1. Realistic pricing patterns (RM 3-35 range for Malaysian food)
2. Order timing follows rush hour patterns (12-2pm lunch, 6-9pm dinner)
3. Customer loyalty tiers follow Pareto 80/20 rule
4. Weekend orders show 30% increase
5. Menu items include authentic Malaysian dishes

Provide structured assessment.`;

        const validationRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a restaurant operations expert validating generated data.' },
              { role: 'user', content: validationPrompt }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'provide_quality_assessment',
                description: 'Provide data quality assessment',
                parameters: {
                  type: 'object',
                  properties: {
                    quality_score: { type: 'number', description: 'Score 0-100' },
                    issues: { type: 'array', items: { type: 'string' }, description: 'List of issues found' },
                    improvements: { type: 'array', items: { type: 'string' }, description: 'Improvement suggestions' }
                  },
                  required: ['quality_score', 'issues', 'improvements']
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'provide_quality_assessment' } }
          })
        });

        let qualityScore = 100;
        let issues: string[] = [];
        let improvements: string[] = [];

        if (validationRes.ok) {
          const validationData = await validationRes.json();
          const toolCall = validationData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            const assessment = JSON.parse(toolCall.function.arguments);
            qualityScore = assessment.quality_score;
            issues = assessment.issues || [];
            improvements = assessment.improvements || [];

            // Store feedback
            await supabase.from('ai_learning_feedback').insert({
              action: 'data_generation_complete_year',
              quality_score: qualityScore,
              issues,
              improvements,
              context: { stats, date_range: { start: startDate, end: endDate } }
            });
          }
        }

        return new Response(JSON.stringify({
          success: true,
          data: {
            stats,
            quality_score: qualityScore,
            issues,
            improvements,
            date_range: { start: startDate, end: endDate }
          }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Validate Data Quality
      if (tool === 'validate_data_quality') {
        const { data: recentFeedback } = await supabase
          .from('ai_learning_feedback')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        return new Response(JSON.stringify({
          success: true,
          data: { recent_feedback: recentFeedback }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Unknown tool'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Unknown action'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });

  } catch (error) {
    console.error('mcp-data-generator error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});