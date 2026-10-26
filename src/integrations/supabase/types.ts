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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      check_ins: {
        Row: {
          check_in_at: string
          event_id: string
          id: string
          metadata: Json
          method: string
          scanned_by: string | null
          ticket_id: string | null
        }
        Insert: {
          check_in_at?: string
          event_id: string
          id?: string
          metadata?: Json
          method?: string
          scanned_by?: string | null
          ticket_id?: string | null
        }
        Update: {
          check_in_at?: string
          event_id?: string
          id?: string
          metadata?: Json
          method?: string
          scanned_by?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          category: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          event_type: string
          id: string
          location: string | null
          organizer_id: string
          organizer_role: string | null
          slug: string
          starts_at: string
          status: string
          title: string
        }
        Insert: {
          capacity?: number | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_type: string
          id?: string
          location?: string | null
          organizer_id: string
          organizer_role?: string | null
          slug: string
          starts_at: string
          status?: string
          title: string
        }
        Update: {
          capacity?: number | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          location?: string | null
          organizer_id?: string
          organizer_role?: string | null
          slug?: string
          starts_at?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          event_id: string | null
          id: string
          notes: string | null
          or_number: string | null
          paid_at: string | null
          payment_method: string
          received_by: string | null
          refunded_at: string | null
          status: string
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          or_number?: string | null
          paid_at?: string | null
          payment_method?: string
          received_by?: string | null
          refunded_at?: string | null
          status?: string
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          or_number?: string | null
          paid_at?: string | null
          payment_method?: string
          received_by?: string | null
          refunded_at?: string | null
          status?: string
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          email: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string
          email?: string | null
          id: string
          student_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          student_id?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          created_at: string
          currency: string
          event_id: string | null
          hmac_signature: string
          id: string
          line_items: Json
          payment_id: string | null
          receipt_number: string
          ticket_id: string | null
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          event_id?: string | null
          hmac_signature: string
          id?: string
          line_items?: Json
          payment_id?: string | null
          receipt_number: string
          ticket_id?: string | null
          total_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          event_id?: string | null
          hmac_signature?: string
          id?: string
          line_items?: Json
          payment_id?: string | null
          receipt_number?: string
          ticket_id?: string | null
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          event_id: string
          id: string
          max_per_user: number | null
          name: string
          price: number
          quota: number | null
          scopes_required: Json
          status: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          id?: string
          max_per_user?: number | null
          name: string
          price?: number
          quota?: number | null
          scopes_required?: Json
          status?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          max_per_user?: number | null
          name?: string
          price?: number
          quota?: number | null
          scopes_required?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          event_id: string
          holder_email: string
          holder_id: string
          holder_name: string
          holder_student_id: string | null
          id: string
          issued_at: string | null
          metadata: Json
          payment_status: string
          qr_payload: string
          qr_signature: string
          seat: string | null
          status: string
          ticket_code: string
          ticket_type_id: string | null
          used_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          holder_email: string
          holder_id: string
          holder_name: string
          holder_student_id?: string | null
          id?: string
          issued_at?: string | null
          metadata?: Json
          payment_status?: string
          qr_payload: string
          qr_signature: string
          seat?: string | null
          status?: string
          ticket_code: string
          ticket_type_id?: string | null
          used_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          holder_email?: string
          holder_id?: string
          holder_name?: string
          holder_student_id?: string | null
          id?: string
          issued_at?: string | null
          metadata?: Json
          payment_status?: string
          qr_payload?: string
          qr_signature?: string
          seat?: string | null
          status?: string
          ticket_code?: string
          ticket_type_id?: string | null
          used_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_event_by_slug: {
        Args: { _slug: string }
        Returns: {
          capacity: number
          category: string
          description: string
          ends_at: string
          event_type: string
          id: string
          location: string
          paid_count: number
          reserved_count: number
          slug: string
          starts_at: string
          tickets_left: number
          title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_published_events: {
        Args: never
        Returns: {
          capacity: number
          category: string
          description: string
          ends_at: string
          event_type: string
          id: string
          location: string
          paid_count: number
          reserved_count: number
          slug: string
          starts_at: string
          tickets_left: number
          title: string
        }[]
      }
      verify_receipt: {
        Args: { _receipt_number: string }
        Returns: {
          currency: string
          event_title: string
          issued_at: string
          payment_status: string
          receipt_number: string
          ticket_type_name: string
          total_amount: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "officer" | "student"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "officer", "student"],
    },
  },
} as const
