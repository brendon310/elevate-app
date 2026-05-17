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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      community_post_flames: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_flames_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          day_number: number
          flame_count: number
          id: string
          track_slug: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          day_number?: number
          flame_count?: number
          id?: string
          track_slug: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          day_number?: number
          flame_count?: number
          id?: string
          track_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
          week_start: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
          week_start: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      journey_days: {
        Row: {
          checkin_prompt: string
          completed_at: string | null
          created_at: string
          day_number: number
          description: string
          id: string
          journey_id: string
          reflection: string
          science: string
          task: string
          title: string
          user_id: string
          user_note: string | null
        }
        Insert: {
          checkin_prompt: string
          completed_at?: string | null
          created_at?: string
          day_number: number
          description: string
          id?: string
          journey_id: string
          reflection: string
          science: string
          task: string
          title: string
          user_id: string
          user_note?: string | null
        }
        Update: {
          checkin_prompt?: string
          completed_at?: string | null
          created_at?: string
          day_number?: number
          description?: string
          id?: string
          journey_id?: string
          reflection?: string
          science?: string
          task?: string
          title?: string
          user_id?: string
          user_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_days_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          created_at: string
          generated_through: number
          id: string
          motivation: string
          obstacle: string
          starting_point: string
          status: string
          total_days: number
          updated_at: string
          user_id: string
          user_track_id: string
        }
        Insert: {
          created_at?: string
          generated_through?: number
          id?: string
          motivation?: string
          obstacle?: string
          starting_point: string
          status?: string
          total_days: number
          updated_at?: string
          user_id: string
          user_track_id: string
        }
        Update: {
          created_at?: string
          generated_through?: number
          id?: string
          motivation?: string
          obstacle?: string
          starting_point?: string
          status?: string
          total_days?: number
          updated_at?: string
          user_id?: string
          user_track_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          peak_reached_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          peak_reached_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          peak_reached_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      track_logs: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          log_date: string
          mood: number | null
          note: string | null
          user_id: string
          user_track_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          log_date?: string
          mood?: number | null
          note?: string | null
          user_id: string
          user_track_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          log_date?: string
          mood?: number | null
          note?: string | null
          user_id?: string
          user_track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_logs_user_track_id_fkey"
            columns: ["user_track_id"]
            isOneToOne: false
            referencedRelation: "user_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
          user_track_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
          user_track_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          user_track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_messages_user_track_id_fkey"
            columns: ["user_track_id"]
            isOneToOne: false
            referencedRelation: "user_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks_catalog: {
        Row: {
          ai_system_prompt: string
          category: string
          color: string
          frameworks: string
          icon: string
          id: string
          name: string
          short_description: string
          slug: string
          sort_order: number
        }
        Insert: {
          ai_system_prompt: string
          category: string
          color: string
          frameworks: string
          icon: string
          id?: string
          name: string
          short_description: string
          slug: string
          sort_order?: number
        }
        Update: {
          ai_system_prompt?: string
          category?: string
          color?: string
          frameworks?: string
          icon?: string
          id?: string
          name?: string
          short_description?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      user_tracks: {
        Row: {
          current_streak: number
          freezes_remaining: number
          id: string
          intake: Json | null
          last_log_date: string | null
          longest_streak: number
          started_at: string
          status: string
          track_id: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          freezes_remaining?: number
          id?: string
          intake?: Json | null
          last_log_date?: string | null
          longest_streak?: number
          started_at?: string
          status?: string
          track_id: string
          user_id: string
        }
        Update: {
          current_streak?: number
          freezes_remaining?: number
          id?: string
          intake?: Json | null
          last_log_date?: string | null
          longest_streak?: number
          started_at?: string
          status?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      toggle_community_flame: {
        Args: { _post_id: string }
        Returns: {
          flame_count: number
          flamed: boolean
        }[]
      }
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
