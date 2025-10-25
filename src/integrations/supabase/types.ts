export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_command_history: {
        Row: {
          command: string
          confidence: number | null
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          intent: string | null
          language: string | null
          result: Json | null
          status: string | null
          tools_used: string[] | null
          user_id: string | null
        }
        Insert: {
          command: string
          confidence?: number | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          intent?: string | null
          language?: string | null
          result?: Json | null
          status?: string | null
          tools_used?: string[] | null
          user_id?: string | null
        }
        Update: {
          command?: string
          confidence?: number | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          intent?: string | null
          language?: string | null
          result?: Json | null
          status?: string | null
          tools_used?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          ai_context: Json | null
          approved_by: string | null
          classification: string | null
          created_at: string | null
          diff: Json | null
          entity: string
          entity_id: string | null
          id: string
          requires_approval: boolean | null
        }
        Insert: {
          action: string
          actor?: string | null
          ai_context?: Json | null
          approved_by?: string | null
          classification?: string | null
          created_at?: string | null
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          requires_approval?: boolean | null
        }
        Update: {
          action?: string
          actor?: string | null
          ai_context?: Json | null
          approved_by?: string | null
          classification?: string | null
          created_at?: string | null
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          requires_approval?: boolean | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          email: string | null
          first_visit: string | null
          id: string
          last_visit: string | null
          loyalty_points: number | null
          name: string | null
          phone: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_visit?: string | null
          id?: string
          last_visit?: string | null
          loyalty_points?: number | null
          name?: string | null
          phone?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_visit?: string | null
          id?: string
          last_visit?: string | null
          loyalty_points?: number | null
          name?: string | null
          phone?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      devices: {
        Row: {
          created_at: string | null
          id: string
          last_seen: string | null
          name: string
          role: string | null
          station_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_seen?: string | null
          name: string
          role?: string | null
          station_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_seen?: string | null
          name?: string
          role?: string | null
          station_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string | null
          hire_date: string | null
          id: string
          name: string
          pay_rate: number | null
          phone: string | null
          pin: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          name: string
          pay_rate?: number | null
          phone?: string | null
          pin: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          name?: string
          pay_rate?: number | null
          phone?: string | null
          pin?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string | null
          cost_per_unit: number | null
          created_at: string | null
          current_qty: number | null
          expiry_alert_days: number | null
          id: string
          name: string
          reorder_point: number | null
          reorder_qty: number | null
          sku: string | null
          storage_location: string | null
          supplier_id: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          current_qty?: number | null
          expiry_alert_days?: number | null
          id?: string
          name: string
          reorder_point?: number | null
          reorder_qty?: number | null
          sku?: string | null
          storage_location?: string | null
          supplier_id?: string | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          current_qty?: number | null
          expiry_alert_days?: number | null
          id?: string
          name?: string
          reorder_point?: number | null
          reorder_qty?: number | null
          sku?: string | null
          storage_location?: string | null
          supplier_id?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_ledger: {
        Row: {
          balance_after: number
          created_at: string | null
          customer_id: string
          id: string
          order_id: string | null
          performed_by: string | null
          points_delta: number
          reason: string | null
          transaction_type: Database["public"]["Enums"]["loyalty_transaction_type"]
        }
        Insert: {
          balance_after: number
          created_at?: string | null
          customer_id: string
          id?: string
          order_id?: string | null
          performed_by?: string | null
          points_delta: number
          reason?: string | null
          transaction_type: Database["public"]["Enums"]["loyalty_transaction_type"]
        }
        Update: {
          balance_after?: number
          created_at?: string | null
          customer_id?: string
          id?: string
          order_id?: string | null
          performed_by?: string | null
          points_delta?: number
          reason?: string | null
          transaction_type?: Database["public"]["Enums"]["loyalty_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rules: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          rule_name: string
          rule_type: string
          rule_value: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          rule_name: string
          rule_type: string
          rule_value: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          rule_name?: string
          rule_type?: string
          rule_value?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          archived: boolean | null
          category_id: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          name: string
          price: number
          sku: string | null
          tax_rate: number | null
          track_inventory: boolean | null
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name: string
          price: number
          sku?: string | null
          tax_rate?: number | null
          track_inventory?: boolean | null
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name?: string
          price?: number
          sku?: string | null
          tax_rate?: number | null
          track_inventory?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          menu_item_id: string | null
          modifiers: Json | null
          notes: string | null
          order_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_item_id?: string | null
          modifiers?: Json | null
          notes?: string | null
          order_id?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_item_id?: string | null
          modifiers?: Json | null
          notes?: string | null
          order_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          applied_promotions: Json | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          discount: number | null
          id: string
          order_type: Database["public"]["Enums"]["order_type"] | null
          session_id: string
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number | null
          table_id: string | null
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          applied_promotions?: Json | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          discount?: number | null
          id?: string
          order_type?: Database["public"]["Enums"]["order_type"] | null
          session_id: string
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          table_id?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          applied_promotions?: Json | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          discount?: number | null
          id?: string
          order_type?: Database["public"]["Enums"]["order_type"] | null
          session_id?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          table_id?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          change_given: number | null
          created_at: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string | null
          provider: string | null
          provider_ref: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          tip: number | null
        }
        Insert: {
          amount: number
          change_given?: number | null
          created_at?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id?: string | null
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          tip?: number | null
        }
        Update: {
          amount?: number
          change_given?: number | null
          created_at?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string | null
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          tip?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_usage: {
        Row: {
          applied_at: string | null
          discount_amount: number
          id: string
          order_id: string | null
          promotion_id: string | null
        }
        Insert: {
          applied_at?: string | null
          discount_amount: number
          id?: string
          order_id?: string | null
          promotion_id?: string | null
        }
        Update: {
          applied_at?: string | null
          discount_amount?: number
          id?: string
          order_id?: string | null
          promotion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_usage_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          priority: number | null
          rules: Json
          stackable: boolean | null
          start_date: string | null
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          priority?: number | null
          rules: Json
          stackable?: boolean | null
          start_date?: string | null
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          priority?: number | null
          rules?: Json
          stackable?: boolean | null
          start_date?: string | null
          type?: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      receipt_templates: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          template: string
          type: string
          updated_at: string | null
          width_mm: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          template: string
          type: string
          updated_at?: string | null
          width_mm: number
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          template?: string
          type?: string
          updated_at?: string | null
          width_mm?: number
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string
          menu_item_id: string
          notes: string | null
          quantity_per_serving: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id: string
          menu_item_id: string
          notes?: string | null
          quantity_per_serving: number
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string
          menu_item_id?: string
          notes?: string | null
          quantity_per_serving?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          authorized_by: string | null
          completed_at: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          order_id: string
          payment_id: string
          provider_ref: string | null
          reason: string | null
          status: string | null
        }
        Insert: {
          amount: number
          authorized_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          order_id: string
          payment_id: string
          provider_ref?: string | null
          reason?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          authorized_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          order_id?: string
          payment_id?: string
          provider_ref?: string | null
          reason?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          break_minutes: number | null
          clock_in_at: string
          clock_out_at: string | null
          closed_by: string | null
          created_at: string | null
          discounts_given: number | null
          employee_id: string
          id: string
          notes: string | null
          orders_processed: number | null
          refunds_count: number | null
          status: string | null
          total_hours: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: string | null
          voids_count: number | null
        }
        Insert: {
          break_minutes?: number | null
          clock_in_at?: string
          clock_out_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          discounts_given?: number | null
          employee_id: string
          id?: string
          notes?: string | null
          orders_processed?: number | null
          refunds_count?: number | null
          status?: string | null
          total_hours?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
          voids_count?: number | null
        }
        Update: {
          break_minutes?: number | null
          clock_in_at?: string
          clock_out_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          discounts_given?: number | null
          employee_id?: string
          id?: string
          notes?: string | null
          orders_processed?: number | null
          refunds_count?: number | null
          status?: string | null
          total_hours?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
          voids_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          route_rules: Json | null
          type: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          route_rules?: Json | null
          type?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          route_rules?: Json | null
          type?: string | null
        }
        Relationships: []
      }
      stock_moves: {
        Row: {
          cost_impact: number | null
          created_at: string | null
          id: string
          inventory_item_id: string
          performed_by: string | null
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["stock_move_type"]
        }
        Insert: {
          cost_impact?: number | null
          created_at?: string | null
          id?: string
          inventory_item_id: string
          performed_by?: string | null
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["stock_move_type"]
        }
        Update: {
          cost_impact?: number | null
          created_at?: string | null
          id?: string
          inventory_item_id?: string
          performed_by?: string | null
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["stock_move_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_moves_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean | null
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      wastage_logs: {
        Row: {
          cost_impact: number | null
          created_at: string | null
          id: string
          inventory_item_id: string
          logged_by: string | null
          notes: string | null
          quantity: number
          reason: string
        }
        Insert: {
          cost_impact?: number | null
          created_at?: string | null
          id?: string
          inventory_item_id: string
          logged_by?: string | null
          notes?: string | null
          quantity: number
          reason: string
        }
        Update: {
          cost_impact?: number | null
          created_at?: string | null
          id?: string
          inventory_item_id?: string
          logged_by?: string | null
          notes?: string | null
          quantity?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "wastage_logs_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_discount_from_points: {
        Args: { points: number }
        Returns: number
      }
      calculate_points_earned: { Args: { amount: number }; Returns: number }
      close_shift: { Args: { shift_id_param: string }; Returns: undefined }
      credit_loyalty_points: {
        Args: {
          customer_id_param: string
          order_id_param: string
          points_param: number
        }
        Returns: undefined
      }
      decrement_inventory_on_order: {
        Args: { order_id_param: string }
        Returns: undefined
      }
      get_active_shift: { Args: { employee_id_param: string }; Returns: string }
      get_customer_loyalty_stats: {
        Args: { customer_id_param: string }
        Returns: {
          avg_order_value: number
          current_balance: number
          days_since_last_visit: number
          total_orders: number
          total_points_earned: number
          total_points_redeemed: number
          total_spent: number
        }[]
      }
      get_low_stock_items: {
        Args: never
        Returns: {
          current_qty: number
          days_until_stockout: number
          id: string
          name: string
          reorder_point: number
          sku: string
          unit: string
        }[]
      }
      get_shift_summary: {
        Args: { shift_id_param: string }
        Returns: {
          clock_in: string
          clock_out: string
          discounts: number
          employee_name: string
          hours_worked: number
          orders: number
          refunds: number
          sales: number
          voids: number
        }[]
      }
      get_top_loyal_customers: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          loyalty_points: number
          name: string
          phone: string
          redemption_rate: number
          total_orders: number
          total_spent: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "cashier" | "kitchen"
      loyalty_transaction_type:
        | "earned"
        | "redeemed"
        | "bonus"
        | "expired"
        | "adjusted"
      order_status: "pending" | "preparing" | "done" | "cancelled"
      order_type: "dine_in" | "takeaway" | "delivery"
      payment_method: "cash" | "card" | "qr" | "other"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      promotion_type:
        | "BUY_X_GET_Y"
        | "PERCENT_OFF"
        | "TIME_RANGE_DISCOUNT"
        | "HAPPY_HOUR"
      stock_move_type:
        | "order_consumption"
        | "purchase"
        | "adjustment"
        | "wastage"
        | "transfer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "cashier", "kitchen"],
      loyalty_transaction_type: [
        "earned",
        "redeemed",
        "bonus",
        "expired",
        "adjusted",
      ],
      order_status: ["pending", "preparing", "done", "cancelled"],
      order_type: ["dine_in", "takeaway", "delivery"],
      payment_method: ["cash", "card", "qr", "other"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      promotion_type: [
        "BUY_X_GET_Y",
        "PERCENT_OFF",
        "TIME_RANGE_DISCOUNT",
        "HAPPY_HOUR",
      ],
      stock_move_type: [
        "order_consumption",
        "purchase",
        "adjustment",
        "wastage",
        "transfer",
      ],
    },
  },
} as const
