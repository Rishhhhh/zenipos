import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushMessage {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_ids, notification_type, message }: {
      user_ids?: string[];
      notification_type: string;
      message: PushMessage;
    } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get subscriptions to notify
    let query = supabase
      .from('push_subscriptions')
      .select('*')
      .eq('enabled', true);

    if (user_ids) {
      query = query.in('user_id', user_ids);
    }

    const { data: subscriptions, error } = await query;

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter by notification type preference
    const filteredSubs = subscriptions.filter(sub => {
      const types = sub.notification_types as string[];
      return types.includes(notification_type);
    });

    // Send push notifications
    const results = await Promise.allSettled(
      filteredSubs.map(async (sub) => {
        const payload = JSON.stringify(message);

        const vapidHeaders = {
          'Content-Type': 'application/json',
          'TTL': '86400',
        };

        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: vapidHeaders,
          body: payload,
        });

        if (!response.ok) {
          console.error(`Push failed for ${sub.endpoint}: ${response.status}`);
          
          if (response.status === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
        }

        return response.ok;
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;

    return new Response(
      JSON.stringify({
        total: filteredSubs.length,
        successful,
        failed: filteredSubs.length - successful,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Push notification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
