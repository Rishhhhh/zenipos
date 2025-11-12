import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

// Organization Signup Edge Function - Multi-tenant registration handler
// Last updated: 2025-11-12 - Trigger deployment

// Hash password using Web Crypto API (compatible with Deno edge runtime)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignupRequest {
  email: string;
  password: string;
  restaurantName: string;
  ownerName: string;
  phone?: string;
  businessType?: string;
}

// Generate random 5-digit PIN
function generateRandomPin(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

serve(async (req) => {
  console.log('[Organization Signup] Received request:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Organization Signup] Initializing Supabase client...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[Organization Signup] Parsing request body...');
    const body: SignupRequest = await req.json();
    const { email, password, restaurantName, ownerName, phone, businessType } = body;
    
    console.log('[Organization Signup] Received data:', {
      restaurantName,
      ownerName,
      email,
      phone,
      businessType,
      hasPassword: !!password
    });

    // Validate required fields
    console.log('[Organization Signup] Validating required fields...');
    if (!email || !password || !restaurantName || !ownerName) {
      console.error('[Organization Signup] Missing required fields');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: email, password, restaurantName, ownerName' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    console.log('[Organization Signup] ✅ All required fields present');

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Password must be at least 8 characters long' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if email already exists in organizations
    console.log('[Organization Signup] Checking email uniqueness in database...');
    const { data: existingOrg, error: checkError } = await supabase
      .from('organizations')
      .select('id')
      .eq('login_email', email)
      .single();

    if (existingOrg) {
      console.log('[Organization Signup] ❌ Email already registered');
      return new Response(
        JSON.stringify({ success: false, error: 'Email already registered' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      );
    }
    console.log('[Organization Signup] ✅ Email is unique');

    // Hash password with SHA-256
    console.log('[Organization Signup] Hashing password...');
    const passwordHash = await hashPassword(password);
    console.log('[Organization Signup] ✅ Password hashed');

    // Create Supabase auth user for owner
    console.log('[Organization Signup] Creating Supabase auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: ownerName,
        role: 'owner'
      }
    });

    if (authError || !authData.user) {
      console.error('[Organization Signup] ❌ Auth user creation failed:', authError);
      
      // Check if it's a duplicate email error from Supabase Auth
      const isDuplicateEmail = authError?.message?.toLowerCase().includes('already') || 
                               authError?.message?.toLowerCase().includes('registered') ||
                               authError?.code === 'email_exists';
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: isDuplicateEmail 
            ? 'Email already registered' 
            : `Failed to create user: ${authError?.message}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: isDuplicateEmail ? 422 : 500 
        }
      );
    }

    const userId = authData.user.id;
    console.log('[Organization Signup] ✅ Auth user created:', userId);
    let organizationId: string | null = null;
    let branchId: string | null = null;
    let employeeId: string | null = null;

    try {
      // Create organization record (slug auto-generated by trigger)
      console.log('Creating organization...');
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: restaurantName,
          owner_id: userId,
          login_email: email,
          login_password_hash: passwordHash,
          phone,
          business_type: businessType || 'restaurant',
          is_active: true,
          onboarding_completed: false,
          primary_color: '#8B5CF6',
          accent_color: '#10B981'
        })
        .select('id, slug')
        .single();

      if (orgError || !orgData) {
        throw new Error(`Organization creation failed: ${orgError?.message}`);
      }

      organizationId = orgData.id;
      const slug = orgData.slug;
      console.log(`Organization created: ${organizationId}, slug: ${slug}`);

      // Create default "Main Branch"
      console.log('Creating default branch...');
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .insert({
          organization_id: organizationId,
          name: 'Main Branch',
          code: 'MAIN',
          active: true,
          timezone: 'Asia/Kuala_Lumpur'
        })
        .select('id')
        .single();

      if (branchError || !branchData) {
        throw new Error(`Branch creation failed: ${branchError?.message}`);
      }

      branchId = branchData.id;
      console.log(`Branch created: ${branchId}`);

      // Generate random 5-digit PIN for owner
      const defaultPin = generateRandomPin();
      const hashedPin = await hashPassword(defaultPin);

      // Create owner employee record
      console.log('Creating owner employee record...');
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .insert({
          name: ownerName,
          email,
          phone,
          role: 'owner',
          pin: hashedPin,
          branch_id: branchId,
          auth_user_id: userId,
          active: true
        })
        .select('id')
        .single();

      if (empError || !empData) {
        throw new Error(`Employee creation failed: ${empError?.message}`);
      }

      employeeId = empData.id;
      console.log(`Employee created: ${employeeId}`);

      // Create user_roles entry
      console.log('Creating user role...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'owner',
          employee_id: employeeId
        });

      if (roleError) {
        throw new Error(`User role creation failed: ${roleError.message}`);
      }

      // Generate setup token (JWT) for wizard
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify`
        }
      });

      if (sessionError) {
        console.warn('Setup token generation failed:', sessionError);
      }

      console.log('[Organization Signup] ✅ Organization signup completed successfully');
      console.log('[Organization Signup] Summary:', {
        organizationId,
        branchId,
        employeeId,
        slug,
        defaultPin
      });

      // Email sending disabled - PIN will be returned in response
      console.log('[Organization Signup] Email sending skipped. PIN included in response.');
      console.log('[Organization Signup] PIN for owner:', defaultPin);

      return new Response(
        JSON.stringify({
          success: true,
          organizationId,
          slug,
          setupToken: sessionData?.properties?.action_link || null,
          message: 'Organization created successfully',
          defaultPin // Return PIN for owner (should be sent via email in production)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
      );

    } catch (rollbackError: any) {
      // Rollback: Delete created records
      console.error('Signup failed, rolling back...', rollbackError.message);

      if (employeeId) {
        await supabase.from('employees').delete().eq('id', employeeId);
      }
      if (branchId) {
        await supabase.from('branches').delete().eq('id', branchId);
      }
      if (organizationId) {
        await supabase.from('organizations').delete().eq('id', organizationId);
      }
      
      // Delete auth user
      await supabase.auth.admin.deleteUser(userId);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Signup failed: ${rollbackError.message}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[Organization Signup] ❌ Fatal error:', error);
    console.error('[Organization Signup] Error stack:', error.stack);
    console.error('[Organization Signup] Error details:', JSON.stringify(error, null, 2));
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
