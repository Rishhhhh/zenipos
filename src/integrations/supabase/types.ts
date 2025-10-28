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
      b2c_consolidation_buckets: {
        Row: {
          branch_id: string | null
          created_at: string | null
          id: string
          month: string
          outlet_name: string
          qr_url: string | null
          status: string | null
          submitted_at: string | null
          total_amount: number | null
          total_orders: number | null
          total_tax: number | null
          updated_at: string | null
          uuid: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          month: string
          outlet_name: string
          qr_url?: string | null
          status?: string | null
          submitted_at?: string | null
          total_amount?: number | null
          total_orders?: number | null
          total_tax?: number | null
          updated_at?: string | null
          uuid?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          month?: string
          outlet_name?: string
          qr_url?: string | null
          status?: string | null
          submitted_at?: string | null
          total_amount?: number | null
          total_orders?: number | null
          total_tax?: number | null
          updated_at?: string | null
          uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2c_consolidation_buckets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_stats: {
        Row: {
          avg_ticket: number | null
          branch_id: string
          created_at: string | null
          discounts_given: number | null
          id: string
          refunds_count: number | null
          shifts_worked: number | null
          stat_date: string
          total_items_sold: number | null
          total_labor_hours: number | null
          total_orders: number | null
          total_revenue: number | null
          updated_at: string | null
          voids_count: number | null
        }
        Insert: {
          avg_ticket?: number | null
          branch_id: string
          created_at?: string | null
          discounts_given?: number | null
          id?: string
          refunds_count?: number | null
          shifts_worked?: number | null
          stat_date: string
          total_items_sold?: number | null
          total_labor_hours?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          voids_count?: number | null
        }
        Update: {
          avg_ticket?: number | null
          branch_id?: string
          created_at?: string | null
          discounts_given?: number | null
          id?: string
          refunds_count?: number | null
          shifts_worked?: number | null
          stat_date?: string
          total_items_sold?: number | null
          total_labor_hours?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          voids_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_stats_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          active: boolean | null
          address: string | null
          business_hours: Json | null
          code: string | null
          created_at: string | null
          email: string | null
          id: string
          manager_id: string | null
          name: string
          organization_id: string
          phone: string | null
          settings: Json | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          business_hours?: Json | null
          code?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          manager_id?: string | null
          name: string
          organization_id: string
          phone?: string | null
          settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          business_hours?: Json | null
          code?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          organization_id?: string
          phone?: string | null
          settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_float_events: {
        Row: {
          created_at: string | null
          denomination: number | null
          event_type: string
          hopper_id: string | null
          id: string
          metadata: Json | null
          quantity: number | null
          running_balance: number | null
          till_session_id: string | null
        }
        Insert: {
          created_at?: string | null
          denomination?: number | null
          event_type: string
          hopper_id?: string | null
          id?: string
          metadata?: Json | null
          quantity?: number | null
          running_balance?: number | null
          till_session_id?: string | null
        }
        Update: {
          created_at?: string | null
          denomination?: number | null
          event_type?: string
          hopper_id?: string | null
          id?: string
          metadata?: Json | null
          quantity?: number | null
          running_balance?: number | null
          till_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_float_events_hopper_id_fkey"
            columns: ["hopper_id"]
            isOneToOne: false
            referencedRelation: "hardware_hoppers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_float_events_till_session_id_fkey"
            columns: ["till_session_id"]
            isOneToOne: false
            referencedRelation: "till_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          branch_id: string | null
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
          branch_id?: string | null
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
          branch_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_data_metadata: {
        Row: {
          generated_at: string | null
          id: string
          record_id: string
          seed: number | null
          table_name: string
        }
        Insert: {
          generated_at?: string | null
          id?: string
          record_id: string
          seed?: number | null
          table_name: string
        }
        Update: {
          generated_at?: string | null
          id?: string
          record_id?: string
          seed?: number | null
          table_name?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          branch_id: string | null
          created_at: string | null
          id: string
          last_seen: string | null
          name: string
          role: string | null
          station_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          last_seen?: string | null
          name: string
          role?: string | null
          station_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          last_seen?: string | null
          name?: string
          role?: string | null
          station_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_attachments: {
        Row: {
          file_size: number | null
          file_type: string | null
          file_url: string
          filename: string
          id: string
          page_id: string | null
          uploaded_at: string | null
        }
        Insert: {
          file_size?: number | null
          file_type?: string | null
          file_url: string
          filename: string
          id?: string
          page_id?: string | null
          uploaded_at?: string | null
        }
        Update: {
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          filename?: string
          id?: string
          page_id?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentation_attachments_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "documentation_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_pages: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_published: boolean | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
          version: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          version?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          version?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      einvoice_docs: {
        Row: {
          buyer_tin: string | null
          created_at: string | null
          error_json: Json | null
          id: string
          invoice_number: string
          long_id: string | null
          mode: string
          order_id: string | null
          payload: Json
          qr_url: string | null
          status: string
          submitted_at: string | null
          type: string
          uin: string | null
          updated_at: string | null
          uuid: string | null
          validated_at: string | null
        }
        Insert: {
          buyer_tin?: string | null
          created_at?: string | null
          error_json?: Json | null
          id?: string
          invoice_number: string
          long_id?: string | null
          mode?: string
          order_id?: string | null
          payload: Json
          qr_url?: string | null
          status?: string
          submitted_at?: string | null
          type: string
          uin?: string | null
          updated_at?: string | null
          uuid?: string | null
          validated_at?: string | null
        }
        Update: {
          buyer_tin?: string | null
          created_at?: string | null
          error_json?: Json | null
          id?: string
          invoice_number?: string
          long_id?: string | null
          mode?: string
          order_id?: string | null
          payload?: Json
          qr_url?: string | null
          status?: string
          submitted_at?: string | null
          type?: string
          uin?: string | null
          updated_at?: string | null
          uuid?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "einvoice_docs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active: boolean | null
          auth_user_id: string | null
          branch_id: string | null
          created_at: string | null
          email: string | null
          hire_date: string | null
          id: string
          name: string
          pay_rate: number | null
          phone: string | null
          pin: string
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          auth_user_id?: string | null
          branch_id?: string | null
          created_at?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          name: string
          pay_rate?: number | null
          phone?: string | null
          pin: string
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          auth_user_id?: string | null
          branch_id?: string | null
          created_at?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          name?: string
          pay_rate?: number | null
          phone?: string | null
          pin?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_reports: {
        Row: {
          created_at: string
          data: Json
          date_range: Json
          download_url: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          date_range: Json
          download_url?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          date_range?: Json
          download_url?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      hardware_devices: {
        Row: {
          branch_id: string | null
          config: Json | null
          created_at: string | null
          device_address: number | null
          device_type: string
          id: string
          last_seen: string | null
          protocol: string
          serial_port: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          config?: Json | null
          created_at?: string | null
          device_address?: number | null
          device_type: string
          id?: string
          last_seen?: string | null
          protocol: string
          serial_port?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          config?: Json | null
          created_at?: string | null
          device_address?: number | null
          device_type?: string
          id?: string
          last_seen?: string | null
          protocol?: string
          serial_port?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hardware_devices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_hoppers: {
        Row: {
          capacity: number
          created_at: string | null
          current_level: number | null
          denomination: number
          device_id: string | null
          id: string
          low_threshold: number | null
          updated_at: string | null
        }
        Insert: {
          capacity: number
          created_at?: string | null
          current_level?: number | null
          denomination: number
          device_id?: string | null
          id?: string
          low_threshold?: number | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          current_level?: number | null
          denomination?: number
          device_id?: string | null
          id?: string
          low_threshold?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hardware_hoppers_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "hardware_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          branch_id: string | null
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
          branch_id?: string | null
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
          branch_id?: string | null
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
            foreignKeyName: "inventory_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      jarvis_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          id: string
          jarvis_analysis: string | null
          message: string
          severity: string
          status: string
          type: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          id?: string
          jarvis_analysis?: string | null
          message: string
          severity: string
          status?: string
          type: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          id?: string
          jarvis_analysis?: string | null
          message?: string
          severity?: string
          status?: string
          type?: string
        }
        Relationships: []
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
          branch_id: string | null
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_modifiers: {
        Row: {
          created_at: string | null
          id: string
          menu_item_id: string
          modifier_group_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_item_id: string
          modifier_group_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_item_id?: string
          modifier_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_modifiers_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_modifiers_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          archived: boolean | null
          branch_id: string | null
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
          sst_exempted: boolean | null
          sst_rate: number | null
          tax_rate: number | null
          track_inventory: boolean | null
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          branch_id?: string | null
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
          sst_exempted?: boolean | null
          sst_rate?: number | null
          tax_rate?: number | null
          track_inventory?: boolean | null
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          branch_id?: string | null
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
          sst_exempted?: boolean | null
          sst_rate?: number | null
          tax_rate?: number | null
          track_inventory?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_groups: {
        Row: {
          created_at: string | null
          id: string
          max_selections: number
          min_selections: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_selections?: number
          min_selections?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          max_selections?: number
          min_selections?: number
          name?: string
        }
        Relationships: []
      }
      modifiers: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          name: string
          price: number
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          name: string
          price?: number
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "modifiers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
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
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          discount: number | null
          id: string
          metadata: Json | null
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
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          discount?: number | null
          id?: string
          metadata?: Json | null
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
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          discount?: number | null
          id?: string
          metadata?: Json | null
          order_type?: Database["public"]["Enums"]["order_type"] | null
          session_id?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          table_id?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          currency: string | null
          date_format: string | null
          id: string
          max_branches: number | null
          name: string
          owner_id: string
          plan_type: string | null
          settings: Json | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          id?: string
          max_branches?: number | null
          name: string
          owner_id: string
          plan_type?: string | null
          settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          id?: string
          max_branches?: number | null
          name?: string
          owner_id?: string
          plan_type?: string | null
          settings?: Json | null
          timezone?: string | null
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
      performance_metrics: {
        Row: {
          browser: string | null
          cls: number | null
          connection_type: string | null
          created_at: string | null
          device_type: string | null
          duration_ms: number | null
          exceeded_budget: boolean | null
          fcp: number | null
          fid: number | null
          id: string
          lcp: number | null
          metric_type: string
          page_path: string | null
          tti: number | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          cls?: number | null
          connection_type?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_ms?: number | null
          exceeded_budget?: boolean | null
          fcp?: number | null
          fid?: number | null
          id?: string
          lcp?: number | null
          metric_type: string
          page_path?: string | null
          tti?: number | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          cls?: number | null
          connection_type?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_ms?: number | null
          exceeded_budget?: boolean | null
          fcp?: number | null
          fid?: number | null
          id?: string
          lcp?: number | null
          metric_type?: string
          page_path?: string | null
          tti?: number | null
          user_id?: string | null
        }
        Relationships: []
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
          branch_id: string | null
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
          branch_id?: string | null
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
          branch_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "promotions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          device_type: string | null
          enabled: boolean | null
          endpoint: string
          id: string
          last_used_at: string | null
          notification_types: Json | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          device_type?: string | null
          enabled?: boolean | null
          endpoint: string
          id?: string
          last_used_at?: string | null
          notification_types?: Json | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          device_type?: string | null
          enabled?: boolean | null
          endpoint?: string
          id?: string
          last_used_at?: string | null
          notification_types?: Json | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_log: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          identifier_type: string
          limit_exceeded: boolean
          limit_window: string
          method: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          identifier_type: string
          limit_exceeded?: boolean
          limit_window: string
          method?: string
          request_count?: number
          window_start: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          identifier_type?: string
          limit_exceeded?: boolean
          limit_window?: string
          method?: string
          request_count?: number
          window_start?: string
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
          branch_id: string | null
          created_at: string | null
          id: string
          name: string
          route_rules: Json | null
          type: string | null
        }
        Insert: {
          active?: boolean | null
          branch_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          route_rules?: Json | null
          type?: string | null
        }
        Update: {
          active?: boolean | null
          branch_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          route_rules?: Json | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
      system_changelog: {
        Row: {
          author_id: string | null
          changes: Json | null
          created_at: string | null
          description: string | null
          id: string
          module: string | null
          released_at: string | null
          title: string
          type: string
          version: string
        }
        Insert: {
          author_id?: string | null
          changes?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          module?: string | null
          released_at?: string | null
          title: string
          type: string
          version: string
        }
        Update: {
          author_id?: string | null
          changes?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          module?: string | null
          released_at?: string | null
          title?: string
          type?: string
          version?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          created_at: string | null
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      system_health: {
        Row: {
          check_type: string
          checked_at: string | null
          details: Json | null
          error_count: number | null
          id: string
          response_time_ms: number | null
          service_name: string
          status: string
          success_rate: number | null
        }
        Insert: {
          check_type: string
          checked_at?: string | null
          details?: Json | null
          error_count?: number | null
          id?: string
          response_time_ms?: number | null
          service_name: string
          status: string
          success_rate?: number | null
        }
        Update: {
          check_type?: string
          checked_at?: string | null
          details?: Json | null
          error_count?: number | null
          id?: string
          response_time_ms?: number | null
          service_name?: string
          status?: string
          success_rate?: number | null
        }
        Relationships: []
      }
      tables: {
        Row: {
          branch_id: string | null
          created_at: string | null
          id: string
          label: string
          seats: number
          status: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          label: string
          seats?: number
          status?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          label?: string
          seats?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      till_ledger: {
        Row: {
          amount: number
          created_at: string | null
          denomination_breakdown: Json | null
          id: string
          notes: string | null
          order_id: string | null
          payment_id: string | null
          till_session_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          denomination_breakdown?: Json | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_id?: string | null
          till_session_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          denomination_breakdown?: Json | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_id?: string | null
          till_session_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "till_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "till_ledger_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "till_ledger_till_session_id_fkey"
            columns: ["till_session_id"]
            isOneToOne: false
            referencedRelation: "till_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      till_sessions: {
        Row: {
          actual_cash: number | null
          blind_close_photo: string | null
          branch_id: string | null
          closed_at: string | null
          closing_float: number | null
          created_at: string | null
          employee_id: string | null
          expected_cash: number | null
          id: string
          opened_at: string | null
          opening_float: number
          reconciled_at: string | null
          shift_id: string | null
          status: string | null
          updated_at: string | null
          variance: number | null
          variance_reason: string | null
        }
        Insert: {
          actual_cash?: number | null
          blind_close_photo?: string | null
          branch_id?: string | null
          closed_at?: string | null
          closing_float?: number | null
          created_at?: string | null
          employee_id?: string | null
          expected_cash?: number | null
          id?: string
          opened_at?: string | null
          opening_float?: number
          reconciled_at?: string | null
          shift_id?: string | null
          status?: string | null
          updated_at?: string | null
          variance?: number | null
          variance_reason?: string | null
        }
        Update: {
          actual_cash?: number | null
          blind_close_photo?: string | null
          branch_id?: string | null
          closed_at?: string | null
          closing_float?: number | null
          created_at?: string | null
          employee_id?: string | null
          expected_cash?: number | null
          id?: string
          opened_at?: string | null
          opening_float?: number
          reconciled_at?: string | null
          shift_id?: string | null
          status?: string | null
          updated_at?: string | null
          variance?: number | null
          variance_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "till_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "till_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "till_sessions_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_branches: {
        Row: {
          branch_id: string
          can_view_analytics: boolean | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          branch_id: string
          can_view_analytics?: boolean | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          branch_id?: string
          can_view_analytics?: boolean | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
      aggregate_branch_stats: {
        Args: { _branch_id: string; _stat_date?: string }
        Returns: undefined
      }
      calculate_cogs: {
        Args: { end_date: string; start_date: string }
        Returns: {
          cogs_percentage: number
          food_cost_percentage: number
          total_cogs: number
          total_revenue: number
        }[]
      }
      calculate_discount_from_points: {
        Args: { points: number }
        Returns: number
      }
      calculate_points_earned: { Args: { amount: number }; Returns: number }
      can_access_branch: {
        Args: { _branch_id: string; _user_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_identifier_type: string
          p_limit: number
          p_method: string
          p_window_minutes: number
        }
        Returns: boolean
      }
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
      get_sales_by_category: {
        Args: { end_date: string; start_date: string }
        Returns: {
          category_id: string
          category_name: string
          item_count: number
          percentage_of_total: number
          total_sales: number
        }[]
      }
      get_sales_by_day_of_week: {
        Args: { end_date: string; start_date: string }
        Returns: {
          avg_ticket: number
          day_of_week: number
          order_count: number
          total_sales: number
        }[]
      }
      get_sales_by_employee: {
        Args: { end_date: string; start_date: string }
        Returns: {
          employee_id: string
          employee_name: string
          hours_worked: number
          order_count: number
          total_sales: number
        }[]
      }
      get_sales_by_hour: {
        Args: { end_date: string; start_date: string }
        Returns: {
          hour: number
          order_count: number
          total_sales: number
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
      get_top_selling_items: {
        Args: { end_date: string; limit_count?: number; start_date: string }
        Returns: {
          item_id: string
          item_name: string
          quantity_sold: number
          times_ordered: number
          total_revenue: number
        }[]
      }
      get_user_branch_ids: {
        Args: { _user_id: string }
        Returns: {
          branch_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_performance_metric: {
        Args: {
          _budget_ms: number
          _device_type?: string
          _duration_ms: number
          _metric_type: string
          _page_path: string
        }
        Returns: undefined
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
      order_status:
        | "pending"
        | "preparing"
        | "done"
        | "cancelled"
        | "completed"
        | "paid"
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
      order_status: [
        "pending",
        "preparing",
        "done",
        "cancelled",
        "completed",
        "paid",
      ],
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
