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
  const rateLimit = await checkRateLimit(req, 'employee-anomaly-detection');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all employees and their shift data from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select(`
        *,
        employees (
          id,
          name
        )
      `)
      .gte('clock_in_at', thirtyDaysAgo)
      .eq('status', 'closed');

    if (shiftsError) throw shiftsError;

    // Calculate team averages
    const teamStats = {
      avgVoids: 0,
      avgRefunds: 0,
      avgShiftHours: 0,
      totalShifts: shifts?.length || 0,
    };

    if (shifts && shifts.length > 0) {
      teamStats.avgVoids = shifts.reduce((sum, s) => sum + (s.voids_count || 0), 0) / shifts.length;
      teamStats.avgRefunds = shifts.reduce((sum, s) => sum + (s.refunds_count || 0), 0) / shifts.length;
      teamStats.avgShiftHours = shifts.reduce((sum, s) => sum + (s.total_hours || 0), 0) / shifts.length;
    }

    // Group by employee
    const employeeMap = new Map<string, any>();
    
    shifts?.forEach(shift => {
      const empId = shift.employee_id;
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          id: empId,
          name: shift.employees?.name || 'Unknown',
          shifts: [],
          totalVoids: 0,
          totalRefunds: 0,
          totalHours: 0,
          shortShifts: 0,
        });
      }
      
      const emp = employeeMap.get(empId);
      emp.shifts.push(shift);
      emp.totalVoids += shift.voids_count || 0;
      emp.totalRefunds += shift.refunds_count || 0;
      emp.totalHours += shift.total_hours || 0;
      
      if (shift.total_hours && shift.total_hours < 2) {
        emp.shortShifts++;
      }
    });

    // Detect anomalies
    const anomalies: any[] = [];
    
    employeeMap.forEach((emp) => {
      const avgVoids = emp.totalVoids / emp.shifts.length;
      const avgRefunds = emp.totalRefunds / emp.shifts.length;
      const avgHours = emp.totalHours / emp.shifts.length;
      
      // Excessive voids (>3x team average)
      if (avgVoids > teamStats.avgVoids * 3 && avgVoids > 2) {
        anomalies.push({
          employee_id: emp.id,
          employee_name: emp.name,
          type: 'excessive_voids',
          count: emp.totalVoids,
          average: teamStats.avgVoids.toFixed(1),
          severity: avgVoids > teamStats.avgVoids * 5 ? 'high' : 'medium',
          recommendation: `Review void logs with ${emp.name}. Pattern shows ${emp.totalVoids} voids in ${emp.shifts.length} shifts.`,
        });
      }
      
      // Short shifts pattern (>50% of shifts < 2 hours)
      if (emp.shortShifts / emp.shifts.length > 0.5 && emp.shifts.length > 3) {
        anomalies.push({
          employee_id: emp.id,
          employee_name: emp.name,
          type: 'short_shifts',
          count: emp.shortShifts,
          average: teamStats.avgShiftHours.toFixed(1),
          severity: 'low',
          recommendation: `Investigate short shift pattern for ${emp.name}. ${emp.shortShifts} out of ${emp.shifts.length} shifts were under 2 hours.`,
        });
      }
      
      // High refunds (>3x team average)
      if (avgRefunds > teamStats.avgRefunds * 3 && avgRefunds > 1) {
        anomalies.push({
          employee_id: emp.id,
          employee_name: emp.name,
          type: 'excessive_refunds',
          count: emp.totalRefunds,
          average: teamStats.avgRefunds.toFixed(1),
          severity: 'medium',
          recommendation: `Review refund logs with ${emp.name}. ${emp.totalRefunds} refunds processed in ${emp.shifts.length} shifts.`,
        });
      }
    });

    // Use AI only if anomalies detected
    let aiInsights = null;
    if (anomalies.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY) {
        const prompt = `
You are an HR and operations analyst for a restaurant POS system.

Analyze these employee behavior anomalies:

${anomalies.map(a => `- ${a.employee_name}: ${a.type} (${a.count} occurrences, team avg: ${a.average})`).join('\n')}

Team stats over 30 days:
- Total shifts: ${teamStats.totalShifts}
- Avg voids per shift: ${teamStats.avgVoids.toFixed(1)}
- Avg refunds per shift: ${teamStats.avgRefunds.toFixed(1)}
- Avg shift length: ${teamStats.avgShiftHours.toFixed(1)} hours

Provide brief insights on:
1. Are these patterns concerning or explainable?
2. What specific actions should the manager take?
3. Any systemic issues (training, process, etc.)?

Respond in JSON:
{
  "insights": ["<insight 1>", "<insight 2>"],
  "actions": ["<action 1>", "<action 2>"]
}
`;

        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: 'You are a precise HR analyst. Always respond with valid JSON only.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const aiContent = aiData.choices[0].message.content;
            const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
            aiInsights = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
          }
        } catch (aiError) {
          console.error('AI analysis failed:', aiError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        anomalies,
        teamStats,
        aiInsights,
        analyzed_shifts: teamStats.totalShifts,
        analyzed_employees: employeeMap.size,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Anomaly detection error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
