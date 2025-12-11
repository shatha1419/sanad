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
      agent_usage: {
        Row: {
          agent_id: string
          created_at: string
          execution_time_ms: number | null
          id: string
          inputs: Json | null
          outputs: Json | null
          status: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          execution_time_ms?: number | null
          id?: string
          inputs?: Json | null
          outputs?: Json | null
          status?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          execution_time_ms?: number | null
          id?: string
          inputs?: Json | null
          outputs?: Json | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          service_type: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          service_type?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          service_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      driving_licenses: {
        Row: {
          created_at: string
          expiry_date: string
          id: string
          issue_date: string
          license_number: string
          license_type: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expiry_date: string
          id?: string
          issue_date: string
          license_number: string
          license_type: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expiry_date?: string
          id?: string
          issue_date?: string
          license_number?: string
          license_type?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          birth_date: string | null
          created_at: string
          id: string
          is_inside_kingdom: boolean | null
          name: string
          national_id: string | null
          relationship: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          id?: string
          is_inside_kingdom?: boolean | null
          name: string
          national_id?: string | null
          relationship: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          id?: string
          is_inside_kingdom?: boolean | null
          name?: string
          national_id?: string | null
          relationship?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          keywords: string[] | null
          title: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          keywords?: string[] | null
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          keywords?: string[] | null
          title?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string | null
          role: string
          tool_calls: Json | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string | null
          role: string
          tool_calls?: Json | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string | null
          role?: string
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date_gregorian: string | null
          birth_date_hijri: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          last_travel_date: string | null
          last_travel_destination: string | null
          marital_status: string | null
          national_id: string | null
          national_id_expiry: string | null
          nationality: string | null
          occupation: string | null
          phone: string | null
          travel_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date_gregorian?: string | null
          birth_date_hijri?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_travel_date?: string | null
          last_travel_destination?: string | null
          marital_status?: string | null
          national_id?: string | null
          national_id_expiry?: string | null
          nationality?: string | null
          occupation?: string | null
          phone?: string | null
          travel_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date_gregorian?: string | null
          birth_date_hijri?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_travel_date?: string | null
          last_travel_destination?: string | null
          marital_status?: string | null
          national_id?: string | null
          national_id_expiry?: string | null
          nationality?: string | null
          occupation?: string | null
          phone?: string | null
          travel_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          request_data: Json | null
          result_data: Json | null
          service_category: string
          service_type: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          request_data?: Json | null
          result_data?: Json | null
          service_category: string
          service_type: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          request_data?: Json | null
          result_data?: Json | null
          service_category?: string
          service_type?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      traffic_violations: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_paid: boolean | null
          location: string | null
          paid_at: string | null
          user_id: string
          violation_date: string
          violation_number: string
          violation_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          is_paid?: boolean | null
          location?: string | null
          paid_at?: string | null
          user_id: string
          violation_date: string
          violation_number: string
          violation_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_paid?: boolean | null
          location?: string | null
          paid_at?: string | null
          user_id?: string
          violation_date?: string
          violation_number?: string
          violation_type?: string
        }
        Relationships: []
      }
      travel_history: {
        Row: {
          created_at: string
          departure_date: string
          destination: string
          id: string
          port_name: string | null
          return_date: string | null
          travel_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          departure_date: string
          destination: string
          id?: string
          port_name?: string | null
          return_date?: string | null
          travel_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          departure_date?: string
          destination?: string
          id?: string
          port_name?: string | null
          return_date?: string | null
          travel_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string | null
          color: string | null
          created_at: string
          id: string
          model: string | null
          plate_number: string
          registration_expiry: string
          status: string | null
          user_id: string
          vehicle_type: string
          year: number | null
        }
        Insert: {
          brand?: string | null
          color?: string | null
          created_at?: string
          id?: string
          model?: string | null
          plate_number: string
          registration_expiry: string
          status?: string | null
          user_id: string
          vehicle_type: string
          year?: number | null
        }
        Update: {
          brand?: string | null
          color?: string | null
          created_at?: string
          id?: string
          model?: string | null
          plate_number?: string
          registration_expiry?: string
          status?: string | null
          user_id?: string
          vehicle_type?: string
          year?: number | null
        }
        Relationships: []
      }
      visas: {
        Row: {
          beneficiary_name: string
          created_at: string
          expiry_date: string | null
          id: string
          issue_date: string
          nationality: string | null
          status: string | null
          user_id: string
          visa_number: string
          visa_type: string
        }
        Insert: {
          beneficiary_name: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date: string
          nationality?: string | null
          status?: string | null
          user_id: string
          visa_number: string
          visa_type: string
        }
        Update: {
          beneficiary_name?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string
          nationality?: string | null
          status?: string | null
          user_id?: string
          visa_number?: string
          visa_type?: string
        }
        Relationships: []
      }
      workers: {
        Row: {
          created_at: string
          id: string
          is_inside_kingdom: boolean | null
          name: string
          nationality: string | null
          occupation: string | null
          user_id: string
          visa_expiry: string | null
          visa_number: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_inside_kingdom?: boolean | null
          name: string
          nationality?: string | null
          occupation?: string | null
          user_id: string
          visa_expiry?: string | null
          visa_number?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_inside_kingdom?: boolean | null
          name?: string
          nationality?: string | null
          occupation?: string | null
          user_id?: string
          visa_expiry?: string | null
          visa_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
