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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      builder_followers: {
        Row: {
          created_at: string
          discord_handle: string
          email: string | null
          id: string
          visitor_key: string | null
        }
        Insert: {
          created_at?: string
          discord_handle: string
          email?: string | null
          id?: string
          visitor_key?: string | null
        }
        Update: {
          created_at?: string
          discord_handle?: string
          email?: string | null
          id?: string
          visitor_key?: string | null
        }
        Relationships: []
      }
      participants: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          discord_handle: string
          display_name: string
          id: string
          is_featured: boolean
          project_link: string | null
          project_title: string | null
          session_id: string
          sort_order: number | null
          twitter_handle: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          discord_handle: string
          display_name: string
          id?: string
          is_featured?: boolean
          project_link?: string | null
          project_title?: string | null
          session_id: string
          sort_order?: number | null
          twitter_handle?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          discord_handle?: string
          display_name?: string
          id?: string
          is_featured?: boolean
          project_link?: string | null
          project_title?: string | null
          session_id?: string
          sort_order?: number | null
          twitter_handle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "weekly_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          participant_id: string
          visitor_key: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          participant_id: string
          visitor_key: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          participant_id?: string
          visitor_key?: string
        }
        Relationships: []
      }
      session_applications: {
        Row: {
          admin_notes: string | null
          avatar_url: string | null
          created_at: string
          discord_handle: string
          display_name: string
          email: string | null
          id: string
          project_description: string | null
          project_link: string | null
          project_title: string | null
          status: string
          twitter_handle: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          avatar_url?: string | null
          created_at?: string
          discord_handle: string
          display_name: string
          email?: string | null
          id?: string
          project_description?: string | null
          project_link?: string | null
          project_title?: string | null
          status?: string
          twitter_handle?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          avatar_url?: string | null
          created_at?: string
          discord_handle?: string
          display_name?: string
          email?: string | null
          id?: string
          project_description?: string | null
          project_link?: string | null
          project_title?: string | null
          status?: string
          twitter_handle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shark_tank_applications: {
        Row: {
          admin_notes: string | null
          avatar_url: string | null
          created_at: string
          demo_link: string | null
          discord_handle: string
          display_name: string
          funding_ask: string | null
          funding_purpose: string | null
          id: string
          pitch_deck_link: string | null
          project_description: string | null
          project_name: string
          status: string
          twitter_handle: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          avatar_url?: string | null
          created_at?: string
          demo_link?: string | null
          discord_handle: string
          display_name: string
          funding_ask?: string | null
          funding_purpose?: string | null
          id?: string
          pitch_deck_link?: string | null
          project_description?: string | null
          project_name: string
          status?: string
          twitter_handle?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          avatar_url?: string | null
          created_at?: string
          demo_link?: string | null
          discord_handle?: string
          display_name?: string
          funding_ask?: string | null
          funding_purpose?: string | null
          id?: string
          pitch_deck_link?: string | null
          project_description?: string | null
          project_name?: string
          status?: string
          twitter_handle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shark_tank_feedback: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          is_accepted: boolean | null
          offer_amount: string | null
          offer_type: string | null
          pitch_id: string
          shark_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_accepted?: boolean | null
          offer_amount?: string | null
          offer_type?: string | null
          pitch_id: string
          shark_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_accepted?: boolean | null
          offer_amount?: string | null
          offer_type?: string | null
          pitch_id?: string
          shark_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shark_tank_feedback_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "shark_tank_pitches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shark_tank_feedback_shark_id_fkey"
            columns: ["shark_id"]
            isOneToOne: false
            referencedRelation: "shark_tank_sharks"
            referencedColumns: ["id"]
          },
        ]
      }
      shark_tank_pitches: {
        Row: {
          builder_avatar_url: string | null
          builder_discord: string | null
          builder_name: string
          builder_twitter: string | null
          created_at: string
          demo_link: string | null
          description: string | null
          funded_amount: string | null
          funding_ask: string | null
          id: string
          is_funded: boolean | null
          pitch_deck_link: string | null
          project_name: string
          session_id: string
          sort_order: number | null
          status: string
          updated_at: string
        }
        Insert: {
          builder_avatar_url?: string | null
          builder_discord?: string | null
          builder_name: string
          builder_twitter?: string | null
          created_at?: string
          demo_link?: string | null
          description?: string | null
          funded_amount?: string | null
          funding_ask?: string | null
          id?: string
          is_funded?: boolean | null
          pitch_deck_link?: string | null
          project_name: string
          session_id: string
          sort_order?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          builder_avatar_url?: string | null
          builder_discord?: string | null
          builder_name?: string
          builder_twitter?: string | null
          created_at?: string
          demo_link?: string | null
          description?: string | null
          funded_amount?: string | null
          funding_ask?: string | null
          id?: string
          is_funded?: boolean | null
          pitch_deck_link?: string | null
          project_name?: string
          session_id?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shark_tank_pitches_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "shark_tank_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shark_tank_sessions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_current: boolean | null
          replay_link: string | null
          session_date: string
          stream_link: string | null
          updated_at: string
          week_label: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_current?: boolean | null
          replay_link?: string | null
          session_date: string
          stream_link?: string | null
          updated_at?: string
          week_label: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_current?: boolean | null
          replay_link?: string | null
          session_date?: string
          stream_link?: string | null
          updated_at?: string
          week_label?: string
        }
        Relationships: []
      }
      shark_tank_sharks: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string | null
          twitter_handle: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string | null
          twitter_handle?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string | null
          twitter_handle?: string | null
        }
        Relationships: []
      }
      shark_tank_votes: {
        Row: {
          created_at: string
          emoji: string
          id: string
          pitch_id: string
          visitor_key: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          pitch_id: string
          visitor_key: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          pitch_id?: string
          visitor_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "shark_tank_votes_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "shark_tank_pitches"
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_sessions: {
        Row: {
          created_at: string
          id: string
          is_current: boolean | null
          session_date: string
          updated_at: string
          week_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_current?: boolean | null
          session_date: string
          updated_at?: string
          week_label: string
        }
        Update: {
          created_at?: string
          id?: string
          is_current?: boolean | null
          session_date?: string
          updated_at?: string
          week_label?: string
        }
        Relationships: []
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
