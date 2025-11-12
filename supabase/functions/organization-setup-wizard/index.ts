import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetupWizardRequest {
  organizationId: string;
  step: number;
  data: any;
}

// Generate random 5-digit PIN
function generateRandomPin(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Verify JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const body: SetupWizardRequest = await req.json();
    const { organizationId, step, data } = body;

    // Validate required fields
    if (!organizationId || !step || !data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: organizationId, step, data' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user owns this organization
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, owner_id')
      .eq('id', organizationId)
      .single();

    if (orgError || !orgData || orgData.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: You do not own this organization' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log(`Processing step ${step} for organization ${organizationId}`);

    // Process each step
    switch (step) {
      case 1: {
        // Step 1: Restaurant Details
        const { address, cuisine, businessHours, timezone } = data;

        if (!address || !cuisine) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing required fields: address, cuisine' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const { error: updateError } = await supabaseAdmin
          .from('organizations')
          .update({
            address,
            settings: {
              cuisine,
              timezone: timezone || 'Asia/Kuala_Lumpur'
            }
          })
          .eq('id', organizationId);

        if (updateError) {
          throw new Error(`Failed to update restaurant details: ${updateError.message}`);
        }

        // Update default branch with business hours
        const { error: branchError } = await supabaseAdmin
          .from('branches')
          .update({
            business_hours: businessHours || {
              monday: { open: '09:00', close: '22:00' },
              tuesday: { open: '09:00', close: '22:00' },
              wednesday: { open: '09:00', close: '22:00' },
              thursday: { open: '09:00', close: '22:00' },
              friday: { open: '09:00', close: '22:00' },
              saturday: { open: '09:00', close: '22:00' },
              sunday: { open: '09:00', close: '22:00' }
            },
            timezone: timezone || 'Asia/Kuala_Lumpur'
          })
          .eq('organization_id', organizationId);

        if (branchError) {
          console.warn('Failed to update branch hours:', branchError);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            step: 1, 
            completed: true,
            message: 'Restaurant details saved' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 2: {
        // Step 2: Branch Setup
        const { branches } = data;

        if (!Array.isArray(branches) || branches.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'At least one branch is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Create additional branches
        const branchInserts = branches.map((branch: any) => ({
          organization_id: organizationId,
          name: branch.name,
          code: branch.code || branch.name.substring(0, 4).toUpperCase(),
          address: branch.address,
          phone: branch.phone,
          active: true,
          timezone: branch.timezone || 'Asia/Kuala_Lumpur'
        }));

        const { data: createdBranches, error: branchError } = await supabaseAdmin
          .from('branches')
          .insert(branchInserts)
          .select('id, name');

        if (branchError) {
          throw new Error(`Failed to create branches: ${branchError.message}`);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            step: 2, 
            completed: true,
            data: { branches: createdBranches },
            message: `${createdBranches?.length || 0} branch(es) created` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 3: {
        // Step 3: Employee Creation
        const { employees } = data;

        if (!Array.isArray(employees) || employees.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'At least one employee is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const createdEmployees = [];

        for (const emp of employees) {
          const { name, email, phone, role, branchId } = emp;

          if (!name || !role || !branchId) {
            continue; // Skip invalid entries
          }

          // Generate random PIN
          const pin = generateRandomPin();
          const salt = await bcrypt.genSalt(10);
          const hashedPin = await bcrypt.hash(pin, salt);

          const { data: empData, error: empError } = await supabaseAdmin
            .from('employees')
            .insert({
              name,
              email,
              phone,
              role,
              pin: hashedPin,
              branch_id: branchId,
              active: true
            })
            .select('id, name, email')
            .single();

          if (!empError && empData) {
            createdEmployees.push({
              ...empData,
              pin // Return PIN (should be sent via email/SMS in production)
            });
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            step: 3, 
            completed: true,
            data: { employees: createdEmployees },
            message: `${createdEmployees.length} employee(s) created` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 4: {
        // Step 4: Menu Import
        const { menuItems, csvData } = data;

        let items = menuItems;

        // If CSV data provided, parse it
        if (csvData && typeof csvData === 'string') {
          // Simple CSV parsing (name, price, category)
          const lines = csvData.split('\n').filter(line => line.trim());
          items = lines.slice(1).map(line => {
            const [name, price, category] = line.split(',').map(s => s.trim());
            return {
              name,
              price: parseFloat(price) || 0,
              category: category || 'Uncategorized'
            };
          });
        }

        if (!Array.isArray(items) || items.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'No menu items provided' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Get first branch for this organization
        const { data: branchData } = await supabaseAdmin
          .from('branches')
          .select('id')
          .eq('organization_id', organizationId)
          .limit(1)
          .single();

        if (!branchData) {
          throw new Error('No branch found for organization');
        }

        // Create menu categories if needed
        const categories = [...new Set(items.map((item: any) => item.category))];
        const categoryMap: Record<string, string> = {};

        for (const catName of categories) {
          const { data: catData, error: catError } = await supabaseAdmin
            .from('menu_categories')
            .insert({
              name: catName,
              sort: 0
            })
            .select('id, name')
            .single();

          if (!catError && catData) {
            categoryMap[catName] = catData.id;
          }
        }

        // Create menu items
        const menuInserts = items.map((item: any) => ({
          name: item.name,
          price: item.price,
          category_id: categoryMap[item.category] || null,
          in_stock: true,
          track_inventory: false
        }));

        const { data: createdItems, error: menuError } = await supabaseAdmin
          .from('menu_items')
          .insert(menuInserts)
          .select('id, name, price');

        if (menuError) {
          throw new Error(`Failed to create menu items: ${menuError.message}`);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            step: 4, 
            completed: true,
            data: { menuItems: createdItems },
            message: `${createdItems?.length || 0} menu item(s) created` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 5: {
        // Step 5: Inventory Setup (Optional) & Complete Onboarding
        const { inventoryItems } = data;

        if (Array.isArray(inventoryItems) && inventoryItems.length > 0) {
          // Get first branch
          const { data: branchData } = await supabaseAdmin
            .from('branches')
            .select('id')
            .eq('organization_id', organizationId)
            .limit(1)
            .single();

          if (branchData) {
            const inventoryInserts = inventoryItems.map((item: any) => ({
              name: item.name,
              unit: item.unit || 'kg',
              current_qty: item.quantity || 0,
              reorder_point: item.reorderPoint || 0,
              cost_per_unit: item.cost || 0,
              branch_id: branchData.id
            }));

            await supabaseAdmin
              .from('inventory_items')
              .insert(inventoryInserts);
          }
        }

        // Mark onboarding as completed
        const { error: completeError } = await supabaseAdmin
          .from('organizations')
          .update({ onboarding_completed: true })
          .eq('id', organizationId);

        if (completeError) {
          throw new Error(`Failed to complete onboarding: ${completeError.message}`);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            step: 5, 
            completed: true,
            message: 'Onboarding completed successfully!' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid step number (must be 1-5)' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Setup wizard error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
