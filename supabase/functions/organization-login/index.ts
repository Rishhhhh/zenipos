import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginRequest {
  email: string;
  password: string;
}

// Generate secure random session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: LoginRequest = await req.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: email, password' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Find organization by login_email
    console.log('Looking up organization by email...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, login_password_hash, is_active, onboarding_completed, logo_url, primary_color, accent_color, owner_id')
      .eq('login_email', email)
      .single();

    if (orgError || !orgData) {
      console.log('Organization not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email or password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check if organization is active
    if (!orgData.is_active) {
      console.log('Organization is inactive');
      return new Response(
        JSON.stringify({ success: false, error: 'Organization is inactive. Contact support.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Verify password with bcrypt
    console.log('Verifying password...');
    const passwordMatch = await bcrypt.compare(password, orgData.login_password_hash);

    if (!passwordMatch) {
      console.log('Password mismatch');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email or password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Create Supabase auth session
    console.log('Creating auth session...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Auth session creation failed:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Generate session token
    const sessionToken = generateSessionToken();

    // Get client info for audit
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Create organization_session record (30-day expiry)
    console.log('Creating organization session...');
    const { error: sessionError } = await supabase
      .from('organization_sessions')
      .insert({
        organization_id: orgData.id,
        user_id: orgData.owner_id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (sessionError) {
      console.error('Organization session creation failed:', sessionError);
    }

    // Fetch active branches
    console.log('Fetching branches...');
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, name, code, address')
      .eq('organization_id', orgData.id)
      .eq('active', true)
      .order('created_at', { ascending: true });

    if (branchError) {
      console.warn('Failed to fetch branches:', branchError);
    }

    // Check if organization has employees
    console.log('Checking for employees...');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('branch_id', branches?.[0]?.id || null)
      .eq('active', true)
      .limit(1);

    const hasEmployees = employees && employees.length > 0;

    console.log('Organization login successful');

    return new Response(
      JSON.stringify({
        success: true,
        organizationId: orgData.id,
        slug: orgData.slug,
        sessionToken,
        branches: branches || [],
        hasEmployees,
        onboardingCompleted: orgData.onboarding_completed,
        branding: {
          name: orgData.name,
          logoUrl: orgData.logo_url,
          primaryColor: orgData.primary_color,
          accentColor: orgData.accent_color
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Organization login error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
