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
      company_follows: {
        Row: {
          company_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      giveaway_entries: {
        Row: {
          created_at: string
          giveaway_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          giveaway_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          giveaway_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_entries_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_images: {
        Row: {
          created_at: string
          display_order: number
          giveaway_id: string
          id: string
          image_url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          giveaway_id: string
          id?: string
          image_url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          giveaway_id?: string
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_images_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_likes: {
        Row: {
          created_at: string
          giveaway_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          giveaway_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          giveaway_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_likes_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_requirements: {
        Row: {
          created_at: string
          giveaway_id: string
          id: string
          require_company_follow: boolean
          require_email_verified: boolean
          require_instagram: boolean
          require_tiktok: boolean
          require_twitter: boolean
          require_youtube: boolean
        }
        Insert: {
          created_at?: string
          giveaway_id: string
          id?: string
          require_company_follow?: boolean
          require_email_verified?: boolean
          require_instagram?: boolean
          require_tiktok?: boolean
          require_twitter?: boolean
          require_youtube?: boolean
        }
        Update: {
          created_at?: string
          giveaway_id?: string
          id?: string
          require_company_follow?: boolean
          require_email_verified?: boolean
          require_instagram?: boolean
          require_tiktok?: boolean
          require_twitter?: boolean
          require_youtube?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_requirements_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: true
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaways: {
        Row: {
          company_id: string
          created_at: string
          description: string
          end_date: string
          id: string
          image_url: string | null
          max_entries: number | null
          prize_value: number | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          end_date: string
          id?: string
          image_url?: string | null
          max_entries?: number | null
          prize_value?: number | null
          start_date?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          end_date?: string
          id?: string
          image_url?: string | null
          max_entries?: number | null
          prize_value?: number | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          instagram_url?: string | null
          logo_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      promotion_products: {
        Row: {
          created_at: string
          id: string
          product_id: string
          promotion_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          promotion_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_products_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          discount_percentage: number
          end_date: string
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          discount_percentage: number
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          discount_percentage?: number
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_task_completions: {
        Row: {
          completed_at: string
          giveaway_id: string
          id: string
          task_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          giveaway_id: string
          id?: string
          task_type: string
          user_id: string
        }
        Update: {
          completed_at?: string
          giveaway_id?: string
          id?: string
          task_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_task_completions_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      winners: {
        Row: {
          giveaway_id: string
          id: string
          notified: boolean
          selected_at: string
          user_id: string
        }
        Insert: {
          giveaway_id: string
          id?: string
          notified?: boolean
          selected_at?: string
          user_id: string
        }
        Update: {
          giveaway_id?: string
          id?: string
          notified?: boolean
          selected_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "winners_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_company_follower_count: {
        Args: { company_uuid: string }
        Returns: number
      }
      get_giveaway_like_count: {
        Args: { giveaway_uuid: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_follows_company: { Args: { company_uuid: string }; Returns: boolean }
      user_has_liked_giveaway: {
        Args: { giveaway_uuid: string }
        Returns: boolean
      }
      validate_giveaway_entry: {
        Args: {
          p_giveaway_id: string
          p_user_email_verified: boolean
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "user" | "company" | "admin"
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
      app_role: ["user", "company", "admin"],
    },
  },
} as const
