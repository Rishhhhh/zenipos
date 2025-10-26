import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

interface RateLimitConfig {
  limit: number;
  windowMinutes: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  'employee-login': { limit: 5, windowMinutes: 1 },
  'ai-orchestrator': { limit: 20, windowMinutes: 1 },
  'voice-to-text': { limit: 10, windowMinutes: 1 },
  'send-push-notification': { limit: 100, windowMinutes: 1 },
  'validate-manager-pin': { limit: 30, windowMinutes: 1 },
  'execute-approved-action': { limit: 10, windowMinutes: 1 },
  'inventory-forecast': { limit: 30, windowMinutes: 1 },
  'loyalty-insights': { limit: 20, windowMinutes: 1 },
  'employee-anomaly-detection': { limit: 20, windowMinutes: 1 },
  'report-insights': { limit: 20, windowMinutes: 1 },
};

export async function checkRateLimit(
  req: Request,
  functionName: string
): Promise<RateLimitResult> {
  try {
    // Bypass for internal cron jobs
    if (req.headers.get('x-internal-cron') === 'true') {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: new Date(Date.now() + 60000),
      };
    }

    const config = DEFAULT_LIMITS[functionName] || { limit: 60, windowMinutes: 1 };
    
    // Get identifier (user ID from JWT or IP address)
    let identifier: string;
    let identifierType: 'user' | 'ip';
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        // Extract user ID from JWT
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        identifier = payload.sub || payload.user_id;
        identifierType = 'user';
      } catch {
        // If JWT parsing fails, fall back to IP
        identifier = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
        identifierType = 'ip';
      }
    } else {
      identifier = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
      identifierType = 'ip';
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call check_rate_limit function
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_identifier_type: identifierType,
      p_endpoint: functionName,
      p_method: req.method,
      p_limit: config.limit,
      p_window_minutes: config.windowMinutes,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limit check fails
      return {
        allowed: true,
        remaining: config.limit,
        resetAt: new Date(Date.now() + config.windowMinutes * 60000),
      };
    }

    const allowed = data as boolean;
    const resetAt = new Date(Date.now() + config.windowMinutes * 60000);
    
    // Calculate remaining requests (rough estimate)
    const remaining = allowed ? Math.max(0, config.limit - 1) : 0;

    return {
      allowed,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error('Rate limiter error:', error);
    // Fail open - allow request on error
    return {
      allowed: true,
      remaining: 60,
      resetAt: new Date(Date.now() + 60000),
    };
  }
}

export function rateLimitResponse(resetAt: Date): Response {
  const retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      retry_after: retryAfter,
      message: 'Too many requests. Please try again later.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': resetAt.toISOString(),
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
