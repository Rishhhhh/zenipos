import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60000);

    console.log('Checking for reservations between:', now.toISOString(), 'and', fifteenMinutesLater.toISOString());

    // Get upcoming reservations (within 15 minutes)
    const { data: reservations, error } = await supabase
      .from('tables')
      .select('*')
      .not('reservation_time', 'is', null)
      .gte('reservation_time', now.toISOString())
      .lte('reservation_time', fifteenMinutesLater.toISOString());

    if (error) throw error;

    console.log(`Found ${reservations?.length || 0} upcoming reservations`);

    // Send notifications for upcoming reservations
    for (const table of reservations || []) {
      const reservationTime = new Date(table.reservation_time);
      const minutesUntil = Math.round((reservationTime.getTime() - now.getTime()) / 60000);

      console.log(`Sending notification for ${table.label}: ${table.reservation_name} arriving in ${minutesUntil} min`);

      // In a real implementation, this would call a notification service
      // For now, we'll just log and optionally call send-push-notification
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            title: `Reservation Alert`,
            body: `${table.reservation_name} arriving in ${minutesUntil} min at ${table.label}`,
            data: { 
              table_id: table.id, 
              type: 'reservation',
              reservation_name: table.reservation_name,
              reservation_time: table.reservation_time,
            }
          }
        });
      } catch (notifError) {
        console.error('Failed to send push notification:', notifError);
        // Continue even if notification fails
      }
    }

    return new Response(
      JSON.stringify({ 
        checked: reservations?.length || 0,
        reservations: reservations?.map(r => ({
          table: r.label,
          guest: r.reservation_name,
          time: r.reservation_time,
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error checking reservations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
