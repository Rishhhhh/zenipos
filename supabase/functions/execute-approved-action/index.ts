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

  try {
    const { action, data, manager_pin, command_history_id } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    // Validate manager PIN
    const { data: managerValidation, error: pinError } = await supabase.functions.invoke(
      'validate-manager-pin',
      { body: { pin: manager_pin } }
    );

    if (pinError || !managerValidation?.valid) {
      throw new Error('Invalid manager PIN');
    }

    // Execute approved action
    let result: any;

    switch (action) {
      case 'create_menu_item': {
        const { data: newItem, error } = await supabase
          .from('menu_items')
          .insert({
            name: data.name,
            price: data.price,
            category_id: data.category_id,
            description: data.description,
            in_stock: true
          })
          .select()
          .single();

        if (error) throw error;
        result = newItem;

        // Log to audit
        await supabase.from('audit_log').insert({
          actor: user.id,
          action: 'ai_create_menu_item_approved',
          entity: 'menu_items',
          entity_id: newItem.id,
          classification: 'critical',
          approved_by: managerValidation.user_id,
          ai_context: { data }
        });

        break;
      }

      case 'update_menu_price': {
        const { data: updatedItem, error } = await supabase
          .from('menu_items')
          .update({ price: data.new_price })
          .eq('id', data.item_id)
          .select()
          .single();

        if (error) throw error;
        result = updatedItem;

        await supabase.from('audit_log').insert({
          actor: user.id,
          action: 'ai_update_menu_price_approved',
          entity: 'menu_items',
          entity_id: data.item_id,
          classification: 'critical',
          approved_by: managerValidation.user_id,
          ai_context: { old_price: updatedItem.price, new_price: data.new_price, reason: data.reason }
        });

        break;
      }

      case 'adjust_inventory': {
        const { data: item } = await supabase
          .from('inventory_items')
          .select('current_qty')
          .eq('id', data.item_id)
          .single();

        if (!item) throw new Error('Inventory item not found');

        const newQty = item.current_qty + data.adjustment;

        const { data: updatedItem, error } = await supabase
          .from('inventory_items')
          .update({ current_qty: newQty })
          .eq('id', data.item_id)
          .select()
          .single();

        if (error) throw error;

        // Log stock move
        await supabase.from('stock_moves').insert({
          inventory_item_id: data.item_id,
          type: data.adjustment > 0 ? 'in' : 'out',
          quantity: Math.abs(data.adjustment),
          reason: data.reason,
          performed_by: user.id,
          reference_type: 'ai_adjustment'
        });

        result = updatedItem;

        await supabase.from('audit_log').insert({
          actor: user.id,
          action: 'ai_adjust_inventory_approved',
          entity: 'inventory_items',
          entity_id: data.item_id,
          classification: 'critical',
          approved_by: managerValidation.user_id,
          ai_context: { adjustment: data.adjustment, reason: data.reason }
        });

        break;
      }

      case 'toggle_item_availability': {
        const { data: updatedItem, error } = await supabase
          .from('menu_items')
          .update({ in_stock: data.in_stock })
          .eq('id', data.item_id)
          .select()
          .single();

        if (error) throw error;
        result = updatedItem;

        await supabase.from('audit_log').insert({
          actor: user.id,
          action: 'ai_toggle_availability_approved',
          entity: 'menu_items',
          entity_id: data.item_id,
          classification: 'critical',
          approved_by: managerValidation.user_id,
          ai_context: { in_stock: data.in_stock }
        });

        break;
      }

      default:
        throw new Error('Unknown action');
    }

    // Update command history
    if (command_history_id) {
      await supabase
        .from('ai_command_history')
        .update({ status: 'success' })
        .eq('id', command_history_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        approved_by: managerValidation.user_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Execute approved action error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
