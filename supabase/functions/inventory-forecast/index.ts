import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { inventory_item_ids } = await req.json();

    if (!inventory_item_ids || !Array.isArray(inventory_item_ids)) {
      throw new Error('Missing or invalid inventory_item_ids array');
    }

    const forecasts = [];

    for (const itemId of inventory_item_ids) {
      const { data: item, error: itemError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (itemError || !item) {
        console.error(`Item ${itemId} not found:`, itemError);
        continue;
      }

      const { data: stockMoves, error: movesError } = await supabase
        .from('stock_moves')
        .select('quantity, created_at, reason')
        .eq('inventory_item_id', itemId)
        .eq('type', 'order_consumption')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (movesError) {
        console.error(`Stock moves error for ${itemId}:`, movesError);
        continue;
      }

      const totalUsage = stockMoves?.reduce((sum, move) => sum + Math.abs(move.quantity), 0) || 0;
      const avgDailyUsage = totalUsage / 30;
      const currentStock = item.current_qty;
      const daysUntilStockout = avgDailyUsage > 0 ? currentStock / avgDailyUsage : 999;

      const { data: wastage, error: wastageError } = await supabase
        .from('wastage_logs')
        .select('quantity, reason')
        .eq('inventory_item_id', itemId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const totalWastage = wastage?.reduce((sum, w) => sum + w.quantity, 0) || 0;

      const prompt = `
You are an inventory forecasting AI for a restaurant POS system in Malaysia.

Analyze this ingredient data and provide a reorder recommendation:

**Item Details:**
- Name: ${item.name}
- Current Stock: ${currentStock} ${item.unit}
- Unit Cost: RM ${item.cost_per_unit}
- Reorder Point: ${item.reorder_point} ${item.unit}
- Category: ${item.category || 'N/A'}

**30-Day Usage Data:**
- Total Consumed: ${totalUsage.toFixed(2)} ${item.unit}
- Average Daily Usage: ${avgDailyUsage.toFixed(2)} ${item.unit}
- Days Until Stockout: ${daysUntilStockout.toFixed(0)} days
- Number of Orders: ${stockMoves?.length || 0}

**Wastage (30 days):**
- Total Wastage: ${totalWastage.toFixed(2)} ${item.unit}
- Wastage Rate: ${totalUsage > 0 ? ((totalWastage / totalUsage) * 100).toFixed(1) : 0}%

**Task:**
Based on this data, recommend:
1. Optimal reorder quantity (consider lead time, shelf life, storage capacity)
2. Urgency level (critical, high, medium, low)
3. Reasoning (2-3 sentences)
4. Any red flags (high wastage, unusual patterns, etc.)

Respond in JSON format:
{
  "reorder_qty": <number>,
  "urgency": "critical|high|medium|low",
  "reasoning": "<explanation>",
  "red_flags": ["<issue1>", "<issue2>"] or []
}
`;

      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a precise inventory forecasting AI. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('Lovable AI error:', errorText);
        throw new Error('AI forecasting failed');
      }

      const aiData = await aiResponse.json();
      const aiContent = aiData.choices[0].message.content;
      
      let forecast;
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        forecast = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiContent);
      } catch (parseError) {
        console.error('AI response parse error:', aiContent);
        forecast = {
          reorder_qty: item.reorder_qty || avgDailyUsage * 7,
          urgency: daysUntilStockout < 3 ? 'critical' : 'medium',
          reasoning: 'Fallback calculation: 7 days of average usage',
          red_flags: ['AI parsing failed'],
        };
      }

      forecasts.push({
        inventory_item_id: itemId,
        item_name: item.name,
        current_stock: currentStock,
        unit: item.unit,
        avg_daily_usage: avgDailyUsage,
        days_until_stockout: daysUntilStockout,
        ...forecast,
      });
    }

    return new Response(
      JSON.stringify({ forecasts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Inventory forecast error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
