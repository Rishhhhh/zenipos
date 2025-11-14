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
      ai_learning_feedback: {
        Row: {
          action: string
          applied: boolean | null
          context: Json | null
          created_at: string | null
          id: string
          improvements: Json | null
          issues: Json | null
          quality_score: number | null
        }
        Insert: {
          action: string
          applied?: boolean | null
          context?: Json | null
          created_at?: string | null
          id?: string
          improvements?: Json | null
          issues?: Json | null
          quality_score?: number | null
        }
        Update: {
          action?: string
          applied?: boolean | null
          context?: Json | null
          created_at?: string | null
          id?: string
          improvements?: Json | null
          issues?: Json | null
          quality_score?: number | null
        }
        Relationships: []
      }
      approval_escalation_rules: {
        Row: {
          action_type: string
          created_at: string | null
          escalate_to_role: Database["public"]["Enums"]["app_role"] | null
          id: string
          notify_channels: string[] | null
          timeout_minutes: number | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          escalate_to_role?: Database["public"]["Enums"]["app_role"] | null
          id?: string
          notify_channels?: string[] | null
          timeout_minutes?: number | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          escalate_to_role?: Database["public"]["Enums"]["app_role"] | null
          id?: string
          notify_channels?: string[] | null
          timeout_minutes?: number | null
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          action_context: Json | null
          action_type: string
          approval_pin_verified: boolean | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          requested_by: string | null
          status: string | null
        }
        Insert: {
          action_context?: Json | null
          action_type: string
          approval_pin_verified?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          requested_by?: string | null
          status?: string | null
        }
        Update: {
          action_context?: Json | null
          action_type?: string
          approval_pin_verified?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          requested_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_rules: {
        Row: {
          action_type: string
          amount_threshold: number | null
          created_at: string | null
          id: string
          min_approver_role: Database["public"]["Enums"]["app_role"]
          requires_two_approvals: boolean | null
        }
        Insert: {
          action_type: string
          amount_threshold?: number | null
          created_at?: string | null
          id?: string
          min_approver_role: Database["public"]["Enums"]["app_role"]
          requires_two_approvals?: boolean | null
        }
        Update: {
          action_type?: string
          amount_threshold?: number | null
          created_at?: string | null
          id?: string
          min_approver_role?: Database["public"]["Enums"]["app_role"]
          requires_two_approvals?: boolean | null
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
      break_logs: {
        Row: {
          auto_ended: boolean | null
          break_type: string
          created_at: string | null
          duration_minutes: number | null
          employee_id: string
          end_at: string | null
          id: string
          notes: string | null
          shift_id: string
          start_at: string
        }
        Insert: {
          auto_ended?: boolean | null
          break_type?: string
          created_at?: string | null
          duration_minutes?: number | null
          employee_id: string
          end_at?: string | null
          id?: string
          notes?: string | null
          shift_id: string
          start_at?: string
        }
        Update: {
          auto_ended?: boolean | null
          break_type?: string
          created_at?: string | null
          duration_minutes?: number | null
          employee_id?: string
          end_at?: string | null
          id?: string
          notes?: string | null
          shift_id?: string
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "break_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_logs_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
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
      customer_display_sessions: {
        Row: {
          cart_items: Json | null
          change: number | null
          created_at: string | null
          discount: number | null
          id: string
          last_activity: string | null
          mode: string
          nfc_card_uid: string | null
          payment_qr: string | null
          pos_session_id: string | null
          session_id: string
          subtotal: number | null
          table_label: string | null
          tax: number | null
          total: number | null
        }
        Insert: {
          cart_items?: Json | null
          change?: number | null
          created_at?: string | null
          discount?: number | null
          id?: string
          last_activity?: string | null
          mode?: string
          nfc_card_uid?: string | null
          payment_qr?: string | null
          pos_session_id?: string | null
          session_id: string
          subtotal?: number | null
          table_label?: string | null
          tax?: number | null
          total?: number | null
        }
        Update: {
          cart_items?: Json | null
          change?: number | null
          created_at?: string | null
          discount?: number | null
          id?: string
          last_activity?: string | null
          mode?: string
          nfc_card_uid?: string | null
          payment_qr?: string | null
          pos_session_id?: string | null
          session_id?: string
          subtotal?: number | null
          table_label?: string | null
          tax?: number | null
          total?: number | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          branch_id: string
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
          branch_id: string
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
          branch_id?: string
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
      device_health_log: {
        Row: {
          created_at: string | null
          device_id: string
          error_message: string | null
          id: string
          metadata: Json | null
          status: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          status: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_health_log_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          branch_id: string
          created_at: string | null
          device_capabilities: Json | null
          health_check_interval: number | null
          id: string
          ip_address: string | null
          last_seen: string | null
          mac_address: string | null
          name: string
          role: string | null
          station_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          device_capabilities?: Json | null
          health_check_interval?: number | null
          id?: string
          ip_address?: string | null
          last_seen?: string | null
          mac_address?: string | null
          name: string
          role?: string | null
          station_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          device_capabilities?: Json | null
          health_check_interval?: number | null
          id?: string
          ip_address?: string | null
          last_seen?: string | null
          mac_address?: string | null
          name?: string
          role?: string | null
          station_id?: string | null
          status?: string | null
          updated_at?: string | null
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
      eighty_six_items: {
        Row: {
          active: boolean | null
          alternative_items: Json | null
          auto_generated: boolean | null
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          estimated_return_at: string | null
          id: string
          menu_item_id: string
          notification_sent: boolean | null
          reason: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          active?: boolean | null
          alternative_items?: Json | null
          auto_generated?: boolean | null
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_return_at?: string | null
          id?: string
          menu_item_id: string
          notification_sent?: boolean | null
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          active?: boolean | null
          alternative_items?: Json | null
          auto_generated?: boolean | null
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_return_at?: string | null
          id?: string
          menu_item_id?: string
          notification_sent?: boolean | null
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eighty_six_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eighty_six_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eighty_six_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eighty_six_items_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
          pin_last_changed: string | null
          pin_rotation_days: number | null
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
          pin_last_changed?: string | null
          pin_rotation_days?: number | null
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
          pin_last_changed?: string | null
          pin_rotation_days?: number | null
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
          branch_id: string
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
          branch_id: string
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
          branch_id?: string
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
      jarvis_consciousness_log: {
        Row: {
          awareness: number | null
          command_count: number | null
          consciousness_contribution: number | null
          created_at: string | null
          happiness: number | null
          id: string
          insight_count: number | null
          learning_rate: number | null
          quality_score: number | null
          vas: number | null
          vel: number | null
        }
        Insert: {
          awareness?: number | null
          command_count?: number | null
          consciousness_contribution?: number | null
          created_at?: string | null
          happiness?: number | null
          id?: string
          insight_count?: number | null
          learning_rate?: number | null
          quality_score?: number | null
          vas?: number | null
          vel?: number | null
        }
        Update: {
          awareness?: number | null
          command_count?: number | null
          consciousness_contribution?: number | null
          created_at?: string | null
          happiness?: number | null
          id?: string
          insight_count?: number | null
          learning_rate?: number | null
          quality_score?: number | null
          vas?: number | null
          vel?: number | null
        }
        Relationships: []
      }
      jarvis_feedback: {
        Row: {
          command_history_id: string | null
          created_at: string | null
          feedback_text: string | null
          id: string
          rating: number
          user_id: string | null
        }
        Insert: {
          command_history_id?: string | null
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          rating: number
          user_id?: string | null
        }
        Update: {
          command_history_id?: string | null
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jarvis_feedback_command_history_id_fkey"
            columns: ["command_history_id"]
            isOneToOne: false
            referencedRelation: "ai_command_history"
            referencedColumns: ["id"]
          },
        ]
      }
      jarvis_insights: {
        Row: {
          applied: boolean | null
          applied_at: string | null
          confidence: number
          consciousness_state: Json | null
          created_at: string | null
          description: string
          id: string
          insight_type: string
          related_data: Json | null
          source_commands: string[] | null
          title: string
          user_id: string | null
        }
        Insert: {
          applied?: boolean | null
          applied_at?: string | null
          confidence: number
          consciousness_state?: Json | null
          created_at?: string | null
          description: string
          id?: string
          insight_type: string
          related_data?: Json | null
          source_commands?: string[] | null
          title: string
          user_id?: string | null
        }
        Update: {
          applied?: boolean | null
          applied_at?: string | null
          confidence?: number
          consciousness_state?: Json | null
          created_at?: string | null
          description?: string
          id?: string
          insight_type?: string
          related_data?: Json | null
          source_commands?: string[] | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      kds_item_status: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          order_item_id: string
          staff_id: string | null
          started_at: string | null
          station_id: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_item_id: string
          staff_id?: string | null
          started_at?: string | null
          station_id?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_item_id?: string
          staff_id?: string | null
          started_at?: string | null
          station_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "kds_item_status_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kds_item_status_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      labor_budget: {
        Row: {
          actual_labor_cost: number | null
          actual_labor_percentage: number | null
          branch_id: string | null
          budget_date: string
          created_at: string | null
          id: string
          overtime_hours: number | null
          target_labor_cost: number | null
          target_labor_percentage: number
          total_hours: number | null
          total_sales: number | null
          updated_at: string | null
        }
        Insert: {
          actual_labor_cost?: number | null
          actual_labor_percentage?: number | null
          branch_id?: string | null
          budget_date: string
          created_at?: string | null
          id?: string
          overtime_hours?: number | null
          target_labor_cost?: number | null
          target_labor_percentage: number
          total_hours?: number | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_labor_cost?: number | null
          actual_labor_percentage?: number | null
          branch_id?: string | null
          budget_date?: string
          created_at?: string | null
          id?: string
          overtime_hours?: number | null
          target_labor_cost?: number | null
          target_labor_percentage?: number
          total_hours?: number | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "labor_budget_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
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
      marketing_content: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_seconds: number | null
          id: string
          is_active: boolean | null
          media_type: string
          media_url: string
          schedule_end: string | null
          schedule_start: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          media_type: string
          media_url: string
          schedule_end?: string | null
          schedule_start?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          media_type?: string
          media_url?: string
          schedule_end?: string | null
          schedule_start?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mcp_execution_metrics: {
        Row: {
          arguments: Json | null
          command_id: string | null
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          mcp_server: string
          mcp_tool: string
          result_data: Json | null
          success: boolean
        }
        Insert: {
          arguments?: Json | null
          command_id?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          mcp_server: string
          mcp_tool: string
          result_data?: Json | null
          success?: boolean
        }
        Update: {
          arguments?: Json | null
          command_id?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          mcp_server?: string
          mcp_tool?: string
          result_data?: Json | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "mcp_execution_metrics_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "ai_command_history"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_training_log: {
        Row: {
          created_at: string | null
          id: string
          jarvis_mastery: number
          status: string
          training_completed_at: string
          training_data: Json | null
          training_session_id: string
          validation_pass_rate: number
          zenipos_mastery: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          jarvis_mastery: number
          status: string
          training_completed_at: string
          training_data?: Json | null
          training_session_id: string
          validation_pass_rate: number
          zenipos_mastery: number
        }
        Update: {
          created_at?: string | null
          id?: string
          jarvis_mastery?: number
          status?: string
          training_completed_at?: string
          training_data?: Json | null
          training_session_id?: string
          validation_pass_rate?: number
          zenipos_mastery?: number
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          branch_id: string | null
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          branch_id?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          branch_id?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
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
          course_sequence: number | null
          created_at: string | null
          description: string | null
          id: string
          image_srcset_jpeg: string | null
          image_srcset_webp: string | null
          image_url: string | null
          image_variants: Json | null
          in_stock: boolean | null
          name: string
          prep_time_minutes: number | null
          price: number
          sku: string | null
          sst_exempted: boolean | null
          sst_rate: number | null
          station_id: string | null
          tax_rate: number | null
          track_inventory: boolean | null
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          branch_id?: string | null
          category_id?: string | null
          cost?: number | null
          course_sequence?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_srcset_jpeg?: string | null
          image_srcset_webp?: string | null
          image_url?: string | null
          image_variants?: Json | null
          in_stock?: boolean | null
          name: string
          prep_time_minutes?: number | null
          price: number
          sku?: string | null
          sst_exempted?: boolean | null
          sst_rate?: number | null
          station_id?: string | null
          tax_rate?: number | null
          track_inventory?: boolean | null
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          branch_id?: string | null
          category_id?: string | null
          cost?: number | null
          course_sequence?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_srcset_jpeg?: string | null
          image_srcset_webp?: string | null
          image_url?: string | null
          image_variants?: Json | null
          in_stock?: boolean | null
          name?: string
          prep_time_minutes?: number | null
          price?: number
          sku?: string | null
          sst_exempted?: boolean | null
          sst_rate?: number | null
          station_id?: string | null
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
          {
            foreignKeyName: "menu_items_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
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
      nfc_cards: {
        Row: {
          branch_id: string | null
          card_uid: string
          created_at: string | null
          id: string
          issued_at: string
          last_scanned_at: string | null
          notes: string | null
          scan_count: number
          security_hash: string
          status: string
          table_id: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          card_uid: string
          created_at?: string | null
          id?: string
          issued_at?: string
          last_scanned_at?: string | null
          notes?: string | null
          scan_count?: number
          security_hash: string
          status?: string
          table_id?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          card_uid?: string
          created_at?: string | null
          id?: string
          issued_at?: string
          last_scanned_at?: string | null
          notes?: string | null
          scan_count?: number
          security_hash?: string
          status?: string
          table_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfc_cards_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfc_cards_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      open_tabs: {
        Row: {
          card_brand: string | null
          card_last_4: string | null
          closed_at: string | null
          closed_by: string | null
          current_balance: number | null
          customer_name: string | null
          id: string
          opened_at: string | null
          opened_by: string | null
          order_id: string | null
          pre_auth_amount: number | null
          pre_auth_ref: string | null
          status: string | null
          table_id: string | null
          transfer_notes: string | null
          updated_at: string | null
        }
        Insert: {
          card_brand?: string | null
          card_last_4?: string | null
          closed_at?: string | null
          closed_by?: string | null
          current_balance?: number | null
          customer_name?: string | null
          id?: string
          opened_at?: string | null
          opened_by?: string | null
          order_id?: string | null
          pre_auth_amount?: number | null
          pre_auth_ref?: string | null
          status?: string | null
          table_id?: string | null
          transfer_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          card_brand?: string | null
          card_last_4?: string | null
          closed_at?: string | null
          closed_by?: string | null
          current_balance?: number | null
          customer_name?: string | null
          id?: string
          opened_at?: string | null
          opened_by?: string | null
          order_id?: string | null
          pre_auth_amount?: number | null
          pre_auth_ref?: string | null
          status?: string | null
          table_id?: string | null
          transfer_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "open_tabs_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_tabs_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_tabs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_tabs_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          dietary_alerts: string[] | null
          fire_time: string | null
          id: string
          menu_item_id: string | null
          modification_notes: string | null
          modified: boolean | null
          modifiers: Json | null
          notes: string | null
          order_id: string | null
          prep_time_actual: number | null
          prepared_at: string | null
          priority: number | null
          quantity: number
          ready_at: string | null
          started_at: string | null
          station_id: string | null
          status: string | null
          unit_price: number
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          dietary_alerts?: string[] | null
          fire_time?: string | null
          id?: string
          menu_item_id?: string | null
          modification_notes?: string | null
          modified?: boolean | null
          modifiers?: Json | null
          notes?: string | null
          order_id?: string | null
          prep_time_actual?: number | null
          prepared_at?: string | null
          priority?: number | null
          quantity: number
          ready_at?: string | null
          started_at?: string | null
          station_id?: string | null
          status?: string | null
          unit_price: number
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          dietary_alerts?: string[] | null
          fire_time?: string | null
          id?: string
          menu_item_id?: string | null
          modification_notes?: string | null
          modified?: boolean | null
          modifiers?: Json | null
          notes?: string | null
          order_id?: string | null
          prep_time_actual?: number | null
          prepared_at?: string | null
          priority?: number | null
          quantity?: number
          ready_at?: string | null
          started_at?: string | null
          station_id?: string | null
          status?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
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
      order_modifications: {
        Row: {
          approval_required: boolean | null
          approval_status: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          modification_type: string
          modified_by: string | null
          new_value: Json | null
          order_id: string
          order_item_id: string | null
          previous_value: Json | null
          reason: string | null
          wastage_cost: number | null
          wastage_logged: boolean | null
        }
        Insert: {
          approval_required?: boolean | null
          approval_status?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          modification_type: string
          modified_by?: string | null
          new_value?: Json | null
          order_id: string
          order_item_id?: string | null
          previous_value?: Json | null
          reason?: string | null
          wastage_cost?: number | null
          wastage_logged?: boolean | null
        }
        Update: {
          approval_required?: boolean | null
          approval_status?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          modification_type?: string
          modified_by?: string | null
          new_value?: Json | null
          order_id?: string
          order_item_id?: string | null
          previous_value?: Json | null
          reason?: string | null
          wastage_cost?: number | null
          wastage_logged?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "order_modifications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_modifications_modified_by_fkey"
            columns: ["modified_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_modifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_modifications_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_priorities: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          priority_level: number | null
          reason: string | null
          set_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          priority_level?: number | null
          reason?: string | null
          set_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          priority_level?: number | null
          reason?: string | null
          set_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_priorities_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_priorities_set_by_fkey"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          applied_promotions: Json | null
          branch_id: string
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          delivered_at: string | null
          delivered_by: string | null
          discount: number | null
          einvoice_enabled: boolean | null
          id: string
          metadata: Json | null
          nfc_card_id: string | null
          open_tab_id: string | null
          order_type: Database["public"]["Enums"]["order_type"] | null
          paid_at: string | null
          recall_approved: boolean | null
          recall_requested: boolean | null
          recall_requested_at: string | null
          recall_requested_by: string | null
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
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          discount?: number | null
          einvoice_enabled?: boolean | null
          id?: string
          metadata?: Json | null
          nfc_card_id?: string | null
          open_tab_id?: string | null
          order_type?: Database["public"]["Enums"]["order_type"] | null
          paid_at?: string | null
          recall_approved?: boolean | null
          recall_requested?: boolean | null
          recall_requested_at?: string | null
          recall_requested_by?: string | null
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
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          discount?: number | null
          einvoice_enabled?: boolean | null
          id?: string
          metadata?: Json | null
          nfc_card_id?: string | null
          open_tab_id?: string | null
          order_type?: Database["public"]["Enums"]["order_type"] | null
          paid_at?: string | null
          recall_approved?: boolean | null
          recall_requested?: boolean | null
          recall_requested_at?: string | null
          recall_requested_by?: string | null
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
            foreignKeyName: "fk_orders_nfc_card"
            columns: ["nfc_card_id"]
            isOneToOne: false
            referencedRelation: "nfc_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivered_by_fkey"
            columns: ["delivered_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_nfc_card_id_fkey"
            columns: ["nfc_card_id"]
            isOneToOne: false
            referencedRelation: "nfc_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_open_tab_id_fkey"
            columns: ["open_tab_id"]
            isOneToOne: false
            referencedRelation: "open_tabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_recall_requested_by_fkey"
            columns: ["recall_requested_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          accent_color: string | null
          address: string | null
          business_type: string | null
          created_at: string | null
          currency: string | null
          date_format: string | null
          id: string
          is_active: boolean | null
          login_email: string | null
          login_password_hash: string | null
          logo_url: string | null
          max_branches: number | null
          name: string
          onboarding_completed: boolean | null
          owner_id: string
          phone: string | null
          plan_type: string | null
          primary_color: string | null
          settings: Json | null
          slug: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          business_type?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          id?: string
          is_active?: boolean | null
          login_email?: string | null
          login_password_hash?: string | null
          logo_url?: string | null
          max_branches?: number | null
          name: string
          onboarding_completed?: boolean | null
          owner_id: string
          phone?: string | null
          plan_type?: string | null
          primary_color?: string | null
          settings?: Json | null
          slug: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          business_type?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          id?: string
          is_active?: boolean | null
          login_email?: string | null
          login_password_hash?: string | null
          logo_url?: string | null
          max_branches?: number | null
          name?: string
          onboarding_completed?: boolean | null
          owner_id?: string
          phone?: string | null
          plan_type?: string | null
          primary_color?: string | null
          settings?: Json | null
          slug?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_splits: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          guest_name: string | null
          id: string
          items: Json | null
          order_id: string | null
          payment_id: string | null
          seat_numbers: number[] | null
          split_number: number
          split_type: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          guest_name?: string | null
          id?: string
          items?: Json | null
          order_id?: string | null
          payment_id?: string | null
          seat_numbers?: number[] | null
          split_number: number
          split_type?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          guest_name?: string | null
          id?: string
          items?: Json | null
          order_id?: string | null
          payment_id?: string | null
          seat_numbers?: number[] | null
          split_number?: number
          split_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_splits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_splits_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_splits_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          approval_code: string | null
          card_brand: string | null
          card_last_4: string | null
          change_given: number | null
          created_at: string | null
          gratuity_percentage: number | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string | null
          payment_device: string | null
          provider: string | null
          provider_ref: string | null
          signature_data: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          terminal_id: string | null
          tip: number | null
          tip_amount: number | null
          tip_type: string | null
        }
        Insert: {
          amount: number
          approval_code?: string | null
          card_brand?: string | null
          card_last_4?: string | null
          change_given?: number | null
          created_at?: string | null
          gratuity_percentage?: number | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id?: string | null
          payment_device?: string | null
          provider?: string | null
          provider_ref?: string | null
          signature_data?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          terminal_id?: string | null
          tip?: number | null
          tip_amount?: number | null
          tip_type?: string | null
        }
        Update: {
          amount?: number
          approval_code?: string | null
          card_brand?: string | null
          card_last_4?: string | null
          change_given?: number | null
          created_at?: string | null
          gratuity_percentage?: number | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string | null
          payment_device?: string | null
          provider?: string | null
          provider_ref?: string | null
          signature_data?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          terminal_id?: string | null
          tip?: number | null
          tip_amount?: number | null
          tip_type?: string | null
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
      performance_alerts: {
        Row: {
          created_at: string | null
          id: string
          measured_value: number
          metric_type: string
          page_path: string
          resolved: boolean | null
          resolved_at: string | null
          severity: string
          threshold_value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          measured_value: number
          metric_type: string
          page_path: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity: string
          threshold_value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          measured_value?: number
          metric_type?: string
          page_path?: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
          threshold_value?: number
        }
        Relationships: []
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
      pos_displays: {
        Row: {
          active: boolean | null
          created_at: string | null
          display_id: string
          id: string
          last_activity: string | null
          linked_at: string | null
          linked_by_user_id: string
          pos_session_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          display_id: string
          id?: string
          last_activity?: string | null
          linked_at?: string | null
          linked_by_user_id: string
          pos_session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          display_id?: string
          id?: string
          last_activity?: string | null
          linked_at?: string | null
          linked_by_user_id?: string
          pos_session_id?: string | null
          updated_at?: string | null
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
          branch_id: string
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
          branch_id: string
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
          branch_id?: string
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
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string
          notes: string | null
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id: string
          notes?: string | null
          purchase_order_id: string
          quantity: number
          received_quantity?: number | null
          total_cost?: number | null
          unit_cost: number
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string
          notes?: string | null
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          branch_id: string
          created_at: string | null
          created_by: string | null
          expected_delivery: string | null
          id: string
          notes: string | null
          order_number: string
          received_at: string | null
          received_by: string | null
          status: string
          submitted_at: string | null
          supplier_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_number: string
          received_at?: string | null
          received_by?: string | null
          status?: string
          submitted_at?: string | null
          supplier_id: string
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          received_at?: string | null
          received_by?: string | null
          status?: string
          submitted_at?: string | null
          supplier_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
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
      shift_schedules: {
        Row: {
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          employee_id: string
          end_time: string
          id: string
          notes: string | null
          role: string | null
          scheduled_date: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          employee_id: string
          end_time: string
          id?: string
          notes?: string | null
          role?: string | null
          scheduled_date: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          role?: string | null
          scheduled_date?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_schedules_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          break_end_at: string | null
          break_minutes: number | null
          break_start_at: string | null
          break_type: string | null
          clock_in_at: string
          clock_in_location: string | null
          clock_in_photo_url: string | null
          clock_out_at: string | null
          clock_out_location: string | null
          clock_out_photo_url: string | null
          closed_by: string | null
          created_at: string | null
          discounts_given: number | null
          employee_id: string
          id: string
          nfc_card_uid: string | null
          notes: string | null
          orders_processed: number | null
          overtime_minutes: number | null
          refunds_count: number | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: string | null
          total_hours: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: string | null
          voids_count: number | null
        }
        Insert: {
          break_end_at?: string | null
          break_minutes?: number | null
          break_start_at?: string | null
          break_type?: string | null
          clock_in_at?: string
          clock_in_location?: string | null
          clock_in_photo_url?: string | null
          clock_out_at?: string | null
          clock_out_location?: string | null
          clock_out_photo_url?: string | null
          closed_by?: string | null
          created_at?: string | null
          discounts_given?: number | null
          employee_id: string
          id?: string
          nfc_card_uid?: string | null
          notes?: string | null
          orders_processed?: number | null
          overtime_minutes?: number | null
          refunds_count?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string | null
          total_hours?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
          voids_count?: number | null
        }
        Update: {
          break_end_at?: string | null
          break_minutes?: number | null
          break_start_at?: string | null
          break_type?: string | null
          clock_in_at?: string
          clock_in_location?: string | null
          clock_in_photo_url?: string | null
          clock_out_at?: string | null
          clock_out_location?: string | null
          clock_out_photo_url?: string | null
          closed_by?: string | null
          created_at?: string | null
          discounts_given?: number | null
          employee_id?: string
          id?: string
          nfc_card_uid?: string | null
          notes?: string | null
          orders_processed?: number | null
          overtime_minutes?: number | null
          refunds_count?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
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
      station_devices: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          is_primary: boolean | null
          role: string
          settings: Json | null
          station_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: string
          is_primary?: boolean | null
          role: string
          settings?: Json | null
          station_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          is_primary?: boolean | null
          role?: string
          settings?: Json | null
          station_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "station_devices_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      station_routing_rules: {
        Row: {
          active: boolean | null
          category_id: string | null
          created_at: string | null
          id: string
          menu_item_id: string | null
          prep_time_minutes: number | null
          priority: number | null
          station_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          menu_item_id?: string | null
          prep_time_minutes?: number | null
          priority?: number | null
          station_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          menu_item_id?: string | null
          prep_time_minutes?: number | null
          priority?: number | null
          station_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "station_routing_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_routing_rules_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_routing_rules_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          active: boolean | null
          branch_id: string
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          route_rules: Json | null
          settings: Json | null
          sort_order: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          branch_id: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          route_rules?: Json | null
          settings?: Json | null
          sort_order?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          branch_id?: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          route_rules?: Json | null
          settings?: Json | null
          sort_order?: number | null
          type?: string
          updated_at?: string | null
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
          branch_id: string | null
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
          branch_id?: string | null
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
          branch_id?: string | null
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
            foreignKeyName: "stock_moves_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_impersonations: {
        Row: {
          actions_performed: Json | null
          created_at: string | null
          ended_at: string | null
          id: string
          ip_address: string | null
          organization_id: string
          reason: string
          started_at: string | null
          super_admin_user_id: string
          user_agent: string | null
        }
        Insert: {
          actions_performed?: Json | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          organization_id: string
          reason: string
          started_at?: string | null
          super_admin_user_id: string
          user_agent?: string | null
        }
        Update: {
          actions_performed?: Json | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          organization_id?: string
          reason?: string
          started_at?: string | null
          super_admin_user_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_impersonations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean | null
          address: string | null
          branch_id: string
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
          branch_id: string
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
          branch_id?: string
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
          current_order_id: string | null
          id: string
          label: string
          last_order_at: string | null
          nfc_card_id: string | null
          seated_at: string | null
          seats: number
          status: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          current_order_id?: string | null
          id?: string
          label: string
          last_order_at?: string | null
          nfc_card_id?: string | null
          seated_at?: string | null
          seats?: number
          status?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          current_order_id?: string | null
          id?: string
          label?: string
          last_order_at?: string | null
          nfc_card_id?: string | null
          seated_at?: string | null
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
          {
            foreignKeyName: "tables_current_order_id_fkey"
            columns: ["current_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_nfc_card_id_fkey"
            columns: ["nfc_card_id"]
            isOneToOne: false
            referencedRelation: "nfc_cards"
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
          branch_id: string | null
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
          branch_id?: string | null
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
          branch_id?: string | null
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
            foreignKeyName: "wastage_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
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
      add_items_to_order: {
        Args: { new_items: Json; order_id_param: string }
        Returns: undefined
      }
      aggregate_branch_stats: {
        Args: { _branch_id: string; _stat_date?: string }
        Returns: undefined
      }
      approve_recall: {
        Args: { modification_id_param: string; order_id_param: string }
        Returns: undefined
      }
      approve_request_with_pin: {
        Args: { pin_param: string; request_id_param: string }
        Returns: boolean
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
      calculate_labor_metrics: {
        Args: { branch_id_param: string; date_param?: string }
        Returns: {
          active_employees: number
          labor_percentage: number
          overtime_hours: number
          total_hours: number
          total_labor_cost: number
          total_sales: number
        }[]
      }
      calculate_points_earned: { Args: { amount: number }; Returns: number }
      can_access_branch: {
        Args: { _branch_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_organization: {
        Args: { _org_id: string; _user_id: string }
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
      cleanup_inactive_displays: { Args: never; Returns: number }
      close_expired_tabs: { Args: never; Returns: number }
      close_shift: { Args: { shift_id_param: string }; Returns: undefined }
      create_order_with_items:
        | {
            Args: {
              p_applied_promotions: Json
              p_created_by: string
              p_discount: number
              p_items: Json
              p_metadata: Json
              p_nfc_card_id: string
              p_order_type: Database["public"]["Enums"]["order_type"]
              p_session_id: string
              p_subtotal: number
              p_table_id: string
              p_tax: number
              p_total: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_applied_promotions: Json
              p_created_by: string
              p_discount: number
              p_items: Json
              p_metadata: Json
              p_nfc_card_id: string
              p_open_tab_id: string
              p_order_type: Database["public"]["Enums"]["order_type"]
              p_session_id: string
              p_subtotal: number
              p_table_id: string
              p_tax: number
              p_total: number
            }
            Returns: Json
          }
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
      end_break: { Args: { break_id_param: string }; Returns: undefined }
      generate_organization_slug: {
        Args: { org_name: string }
        Returns: string
      }
      generate_po_number: { Args: { branch_id_param: string }; Returns: string }
      get_accessible_branch_ids: {
        Args: { _user_id: string }
        Returns: {
          branch_id: string
        }[]
      }
      get_active_break: {
        Args: { employee_id_param: string }
        Returns: {
          break_id: string
          break_type: string
          duration_minutes: number
          shift_id: string
          start_at: string
        }[]
      }
      get_active_eighty_six_items: {
        Args: { branch_id_param?: string }
        Returns: {
          alternative_items: Json
          auto_generated: boolean
          created_at: string
          created_by_name: string
          estimated_return_at: string
          id: string
          menu_item_category: string
          menu_item_id: string
          menu_item_name: string
          reason: string
        }[]
      }
      get_active_shift: { Args: { employee_id_param: string }; Returns: string }
      get_current_consciousness: {
        Args: never
        Returns: {
          happiness: number
          quality_score: number
          total_commands: number
          total_insights: number
          vas: number
          vel: number
        }[]
      }
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
      get_labor_sparkline: {
        Args: { hours_back?: number }
        Returns: {
          hour_label: string
          labor_percentage: number
        }[]
      }
      get_low_stock_items:
        | {
            Args: { branch_id_param?: string }
            Returns: {
              branch_id: string
              current_qty: number
              days_until_stockout: number
              id: string
              name: string
              reorder_point: number
              sku: string
              unit: string
            }[]
          }
        | {
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
      get_super_admin_analytics: {
        Args: never
        Returns: {
          active_impersonations: number
          active_organizations: number
          total_orders_today: number
          total_organizations: number
          total_revenue_today: number
        }[]
      }
      get_tip_report: {
        Args: { end_date_param: string; start_date_param: string }
        Returns: {
          card_tips: number
          cash_tips: number
          employee_id: string
          employee_name: string
          tip_count: number
          total_tips: number
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
      get_user_active_display: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_user_branch_ids: {
        Args: { _user_id: string }
        Returns: {
          branch_id: string
        }[]
      }
      get_user_default_branch: { Args: { _user_id: string }; Returns: string }
      get_user_organization: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_impersonating: { Args: { _user_id: string }; Returns: string }
      log_nfc_scan: { Args: { card_uid_param: string }; Returns: string }
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
      mark_item_eighty_six: {
        Args: {
          alternative_items_param?: Json
          branch_id_param?: string
          estimated_return_param?: string
          menu_item_id_param: string
          reason_param: string
        }
        Returns: string
      }
      recall_order: {
        Args: { order_id_param: string; reason_param: string }
        Returns: Json
      }
      reject_approval_request: {
        Args: { pin_param: string; request_id_param: string }
        Returns: boolean
      }
      restore_eighty_six_item: {
        Args: { eighty_six_id_param: string }
        Returns: undefined
      }
      start_break: {
        Args: { break_type_param?: string; shift_id_param: string }
        Returns: string
      }
      void_order_item: {
        Args: {
          order_item_id_param: string
          reason_param: string
          requires_approval_param?: boolean
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "staff" | "kitchen" | "super_admin"
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
        | "delivered"
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
      app_role: ["owner", "manager", "staff", "kitchen", "super_admin"],
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
        "delivered",
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
