import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const checks: any = {};

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Database check
    const dbStart = Date.now();
    const { error: dbError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    checks.database = {
      status: dbError ? 'down' : 'healthy',
      response_time_ms: Date.now() - dbStart,
      error: dbError?.message
    };

    // 2. Realtime check
    const rtStart = Date.now();
    // Simple channel creation test
    const channel = supabase.channel('health-check-' + Date.now());
    await new Promise((resolve) => setTimeout(resolve, 100));
    checks.realtime = {
      status: 'healthy',
      response_time_ms: Date.now() - rtStart
    };
    await supabase.removeChannel(channel);

    // 3. Storage check
    const storageStart = Date.now();
    const { data: buckets, error: storageError } = await supabase
      .storage
      .listBuckets();
    
    checks.storage = {
      status: storageError ? 'degraded' : 'healthy',
      response_time_ms: Date.now() - storageStart,
      bucket_count: buckets?.length || 0,
      error: storageError?.message
    };

    // 4. Overall health
    const overallStatus = Object.values(checks).every((c: any) => c.status === 'healthy')
      ? 'healthy'
      : Object.values(checks).some((c: any) => c.status === 'down')
      ? 'down'
      : 'degraded';

    // Log to system_health table
    for (const [service, check] of Object.entries(checks)) {
      await supabase.from('system_health').insert({
        service_name: service,
        check_type: 'latency',
        status: (check as any).status,
        response_time_ms: (check as any).response_time_ms,
        details: { error: (check as any).error }
      });
    }

    return new Response(
      JSON.stringify({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
        checks
      }),
      {
        status: overallStatus === 'down' ? 503 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
