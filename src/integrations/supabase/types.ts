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
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string | null
          diff: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string | null
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string | null
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
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
          id: string
          name: string
          pin: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          pin: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          pin?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      order_status: "pending" | "preparing" | "done" | "cancelled"
      order_type: "dine_in" | "takeaway" | "delivery"
      payment_method: "cash" | "card" | "qr" | "other"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      promotion_type:
        | "BUY_X_GET_Y"
        | "PERCENT_OFF"
        | "TIME_RANGE_DISCOUNT"
        | "HAPPY_HOUR"
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
    },
  },
} as const
