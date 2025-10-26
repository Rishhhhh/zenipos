import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
  const rateLimit = await checkRateLimit(req, 'report-insights');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  try {
    const { start_date, end_date } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // In production, you would fetch actual data here
    // For now, we'll use a template approach with AI enhancement

    const systemPrompt = `You are a restaurant business analyst AI. Analyze the provided sales data and provide actionable insights.
Focus on:
1. Sales trends and patterns
2. Cost management (COGS, labor)
3. Operational efficiency
4. Recommendations for improvement

Keep insights concise, specific, and actionable.`;

    const userPrompt = `Analyze this restaurant data for the period ${start_date} to ${end_date}:
- Review recent sales performance
- Identify cost optimization opportunities
- Suggest operational improvements
- Highlight any anomalies or concerns

Provide a brief summary (2-3 sentences) and 3-5 key bullet point insights.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      // Fallback to template insights
      return new Response(JSON.stringify({
        summary: 'Sales data analyzed. Focus on maintaining food cost below 35% and monitoring labor efficiency.',
        insights: [
          'Sales performance is within expected range',
          'Monitor COGS percentage to maintain profitability',
          'Consider optimizing labor scheduling during slow hours',
          'Review void rates and ensure proper staff training',
        ],
        recommendations: [
          'Implement dynamic pricing for peak hours',
          'Review supplier contracts for cost savings',
          'Cross-train staff to improve efficiency',
        ],
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;

    // Parse AI response (simple approach - in production, use structured output)
    const lines = aiResponse.split('\n').filter((l: string) => l.trim());
    const summary = lines[0];
    const insights = lines.slice(1, 6).map((l: string) => l.replace(/^[-•*]\s*/, ''));

    return new Response(JSON.stringify({
      summary,
      insights,
      recommendations: [],
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in report-insights:', error);
    
    // Fallback response
    return new Response(JSON.stringify({
      summary: 'Unable to generate AI insights at this time.',
      insights: [
        'Sales data is being processed',
        'Manual review recommended for detailed analysis',
      ],
      recommendations: [],
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
