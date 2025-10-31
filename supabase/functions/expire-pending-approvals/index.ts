import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all pending approval requests that have expired
    const now = new Date();
    const { data: expiredRequests, error: fetchError } = await supabase
      .from('approval_requests')
      .select('*, approval_escalation_rules!inner(*)')
      .eq('status', 'pending')
      .lt('expires_at', now.toISOString());

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${expiredRequests?.length || 0} expired approval requests`);

    if (!expiredRequests || expiredRequests.length === 0) {
      return new Response(JSON.stringify({ message: 'No expired requests found' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Process each expired request
    const results = [];
    for (const request of expiredRequests) {
      // Get escalation rule for this action type
      const { data: escalationRules } = await supabase
        .from('approval_escalation_rules')
        .select('*')
        .eq('action_type', request.action_type)
        .single();

      if (escalationRules && escalationRules.escalate_to_role) {
        // Escalate to higher role
        const newExpiresAt = new Date(now.getTime() + escalationRules.timeout_minutes * 60 * 1000);
        
        const { error: updateError } = await supabase
          .from('approval_requests')
          .update({
            status: 'escalated',
            escalated_to_role: escalationRules.escalate_to_role,
            expires_at: newExpiresAt.toISOString(),
          })
          .eq('id', request.id);

        if (updateError) {
          console.error(`Failed to escalate request ${request.id}:`, updateError);
          continue;
        }

        // Send notification to escalated role
        if (escalationRules.notify_channels?.includes('push')) {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              role: escalationRules.escalate_to_role,
              title: 'Approval Request Escalated',
              message: `${request.action_type} approval request has been escalated to you`,
              data: { approval_request_id: request.id },
            },
          });
        }

        results.push({
          id: request.id,
          action: 'escalated',
          to_role: escalationRules.escalate_to_role,
        });
      } else {
        // No escalation rule, mark as expired
        const { error: updateError } = await supabase
          .from('approval_requests')
          .update({
            status: 'expired',
          })
          .eq('id', request.id);

        if (updateError) {
          console.error(`Failed to expire request ${request.id}:`, updateError);
          continue;
        }

        results.push({
          id: request.id,
          action: 'expired',
        });
      }
    }

    return new Response(JSON.stringify({ 
      message: `Processed ${results.length} expired requests`,
      results,
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error expiring approvals:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
