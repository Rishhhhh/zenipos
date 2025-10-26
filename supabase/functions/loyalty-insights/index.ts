import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { checkRateLimit, rateLimitResponse } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(req, 'loyalty-insights');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get customer analytics
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .order('total_spent', { ascending: false })
      .limit(100);

    // Get order patterns (hourly distribution)
    const { data: orderPatterns } = await supabase
      .from('orders')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Analyze hourly patterns
    const hourlyOrders = new Array(24).fill(0);
    orderPatterns?.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      hourlyOrders[hour]++;
    });

    // Find quiet hours (below average)
    const avgOrders = hourlyOrders.reduce((a, b) => a + b, 0) / 24;
    const quietHours = hourlyOrders
      .map((count, hour) => ({ hour, count, percentOfAvg: (count / avgOrders) * 100 }))
      .filter(h => h.percentOfAvg < 60)
      .sort((a, b) => a.count - b.count);

    // Identify repeat customers
    const repeatCustomers = customers?.filter(c => c.total_orders >= 5) || [];
    const lapsedCustomers = customers?.filter(c => {
      const daysSinceLastVisit = Math.floor(
        (Date.now() - new Date(c.last_visit).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceLastVisit > 30 && c.total_orders >= 3;
    }) || [];

    // Get redemption rate
    const { data: ledger } = await supabase
      .from('loyalty_ledger')
      .select('transaction_type, points_delta');

    const totalEarned = ledger?.filter(l => l.transaction_type === 'earned')
      .reduce((sum, l) => sum + l.points_delta, 0) || 0;
    const totalRedeemed = Math.abs(ledger?.filter(l => l.transaction_type === 'redeemed')
      .reduce((sum, l) => sum + l.points_delta, 0) || 0);
    const redemptionRate = totalEarned > 0 ? (totalRedeemed / totalEarned) * 100 : 0;

    // Build AI prompt
    const prompt = `
You are a CRM and marketing AI for a Malaysian restaurant POS system.

Analyze this customer behavior data and suggest 3-5 targeted loyalty campaigns:

**Customer Base:**
- Total Customers: ${customers?.length || 0}
- Repeat Customers (5+ orders): ${repeatCustomers.length}
- Lapsed Customers (30+ days inactive): ${lapsedCustomers.length}
- Top Spender: RM ${customers?.[0]?.total_spent || 0}

**Order Patterns:**
- Total Orders (30 days): ${orderPatterns?.length || 0}
- Quietest Hours: ${quietHours.slice(0, 3).map(h => `${h.hour}:00 (${h.count} orders)`).join(', ')}
- Peak Hours: ${hourlyOrders.map((count, hour) => ({ hour, count })).sort((a, b) => b.count - a.count).slice(0, 3).map(h => `${h.hour}:00 (${h.count} orders)`).join(', ')}

**Loyalty Metrics:**
- Redemption Rate: ${redemptionRate.toFixed(1)}%
- Avg Points Balance: ${(customers?.reduce((sum, c) => sum + c.loyalty_points, 0) || 0) / (customers?.length || 1)}

**Task:**
Based ONLY on this data (no predictions), suggest campaigns to:
1. Increase traffic during quiet hours
2. Re-engage lapsed customers
3. Reward repeat customers
4. Improve point redemption (if low)

Respond in JSON format:
{
  "campaigns": [
    {
      "title": "<short title>",
      "target": "quiet_hours|lapsed|repeat|low_redemption",
      "description": "<2-3 sentences explaining the campaign>",
      "action": "<specific action like 'Offer 500 bonus points for orders 3-5 PM'>",
      "expected_impact": "<expected outcome based on data patterns>"
    }
  ],
  "insights": [
    "<key insight 1>",
    "<key insight 2>"
  ]
}
`;

    // Call Lovable AI
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
          { role: 'system', content: 'You are a precise CRM analyst. Always respond with valid JSON only. Base suggestions only on provided data, no predictions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', errorText);
      throw new Error('AI insights failed');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    // Parse AI response
    let insights;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      insights = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiContent);
    } catch (parseError) {
      console.error('AI response parse error:', aiContent);
      insights = {
        campaigns: [
          {
            title: "Quiet Hour Bonus",
            target: "quiet_hours",
            description: "Offer bonus points during slowest hours to drive traffic",
            action: `Offer 200 bonus points for orders between ${quietHours[0]?.hour || 15}:00-${(quietHours[0]?.hour || 15) + 2}:00`,
            expected_impact: "Could increase orders by 20-30% during quiet periods"
          }
        ],
        insights: ["Fallback analysis: Focus on quiet hours optimization"]
      };
    }

    return new Response(
      JSON.stringify({
        ...insights,
        rawData: {
          totalCustomers: customers?.length || 0,
          repeatCustomers: repeatCustomers.length,
          lapsedCustomers: lapsedCustomers.length,
          redemptionRate: redemptionRate.toFixed(1),
          quietHours: quietHours.slice(0, 5),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Loyalty insights error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
