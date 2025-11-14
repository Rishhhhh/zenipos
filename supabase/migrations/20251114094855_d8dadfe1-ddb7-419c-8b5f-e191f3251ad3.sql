-- Update create_order_with_items to track promotion usage
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_session_id uuid, 
  p_table_id uuid, 
  p_order_type order_type, 
  p_nfc_card_id uuid, 
  p_open_tab_id uuid, 
  p_subtotal numeric, 
  p_tax numeric, 
  p_discount numeric, 
  p_total numeric, 
  p_applied_promotions jsonb, 
  p_created_by uuid, 
  p_metadata jsonb, 
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_promotion jsonb;
BEGIN
  INSERT INTO orders (
    session_id, table_id, order_type, nfc_card_id, open_tab_id,
    status, subtotal, tax, discount, total,
    applied_promotions, created_by, metadata
  ) VALUES (
    p_session_id, p_table_id, p_order_type, p_nfc_card_id, p_open_tab_id,
    'pending'::order_status,
    p_subtotal, p_tax, p_discount, p_total,
    p_applied_promotions, p_created_by, p_metadata
  ) RETURNING id INTO v_order_id;
  
  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes, modifiers)
    VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric,
      v_item->>'notes',
      COALESCE(v_item->'modifiers', '[]'::jsonb)
    );
  END LOOP;
  
  -- Track promotion usage
  IF p_applied_promotions IS NOT NULL AND jsonb_array_length(p_applied_promotions) > 0 THEN
    FOR v_promotion IN SELECT * FROM jsonb_array_elements(p_applied_promotions)
    LOOP
      INSERT INTO promotion_usage (
        promotion_id,
        order_id,
        discount_amount,
        created_at
      ) VALUES (
        (v_promotion->'promotion'->>'id')::uuid,
        v_order_id,
        (v_promotion->>'discountAmount')::numeric,
        NOW()
      );
    END LOOP;
  END IF;
  
  -- Audit log
  INSERT INTO audit_log (actor, action, entity, entity_id, diff)
  VALUES (p_created_by, 'create_order', 'orders', v_order_id, jsonb_build_object('items', jsonb_array_length(p_items), 'total', p_total));
  
  RETURN jsonb_build_object('order_id', v_order_id, 'status', 'pending');
END;
$function$;