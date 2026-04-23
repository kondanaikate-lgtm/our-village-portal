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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          end_at: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          order_index: number
          start_at: string | null
          title: string | null
          type: Database["public"]["Enums"]["banner_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          order_index?: number
          start_at?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["banner_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          order_index?: number
          start_at?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["banner_type"]
          updated_at?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          admin_note: string | null
          attachment_url: string | null
          category: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string
          id: string
          location: string | null
          reporter_name: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          attachment_url?: string | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description: string
          id?: string
          location?: string | null
          reporter_name: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          attachment_url?: string | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          reporter_name?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          download_count: number
          file_size: number | null
          file_url: string
          fiscal_year: number | null
          id: string
          is_published: boolean
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          download_count?: number
          file_size?: number | null
          file_url: string
          fiscal_year?: number | null
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          download_count?: number
          file_size?: number | null
          file_url?: string
          fiscal_year?: number | null
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          all_day: boolean
          category: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string | null
          id: string
          is_published: boolean
          location: string | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_published: boolean
          order_index: number
          question: string
          updated_at: string
          view_count: number
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          order_index?: number
          question: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          order_index?: number
          question?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      gallery_albums: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string | null
          id: string
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          album_id: string
          caption: string | null
          created_at: string
          id: string
          image_url: string
          order_index: number
        }
        Insert: {
          album_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          order_index?: number
        }
        Update: {
          album_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "gallery_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          expired_at: string | null
          id: string
          is_pinned: boolean
          is_published: boolean
          published_at: string | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          expired_at?: string | null
          id?: string
          is_pinned?: boolean
          is_published?: boolean
          published_at?: string | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          expired_at?: string | null
          id?: string
          is_pinned?: boolean
          is_published?: boolean
          published_at?: string | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "news_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "news_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      news_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index?: number
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          slug?: string
        }
        Relationships: []
      }
      otop_products: {
        Row: {
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          order_index: number
          price: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          order_index?: number
          price?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          order_index?: number
          price?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      personnel: {
        Row: {
          bio: string | null
          created_at: string
          department: string | null
          email: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          order_index: number
          phone: string | null
          position: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          order_index?: number
          phone?: string | null
          position: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          order_index?: number
          phone?: string | null
          position?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          hero_display_mode: string
          hero_layout: string
          key: string
          logo_url: string | null
          site_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          hero_display_mode?: string
          hero_layout?: string
          key?: string
          logo_url?: string | null
          site_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          hero_display_mode?: string
          hero_layout?: string
          key?: string
          logo_url?: string | null
          site_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_visitors: {
        Row: {
          created_at: string
          id: string
          page_views: Json
          unique_visitors: number
          updated_at: string
          visit_count: number
          visit_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_views?: Json
          unique_visitors?: number
          updated_at?: string
          visit_count?: number
          visit_date?: string
        }
        Update: {
          created_at?: string
          id?: string
          page_views?: Json
          unique_visitors?: number
          updated_at?: string
          visit_count?: number
          visit_date?: string
        }
        Relationships: []
      }
      social_links: {
        Row: {
          icon_name: string | null
          id: string
          is_active: boolean
          label: string
          order_index: number
          platform: string
          updated_at: string
          url: string
        }
        Insert: {
          icon_name?: string | null
          id?: string
          is_active?: boolean
          label: string
          order_index?: number
          platform: string
          updated_at?: string
          url: string
        }
        Update: {
          icon_name?: string | null
          id?: string
          is_active?: boolean
          label?: string
          order_index?: number
          platform?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          source: string | null
          subscribed_at: string
          unsubscribe_token: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
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
      village_info: {
        Row: {
          content: string | null
          id: string
          section_key: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string | null
          id?: string
          section_key: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string | null
          id?: string
          section_key?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
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
      increment_document_download: {
        Args: { _doc_id: string }
        Returns: undefined
      }
      increment_visitor: { Args: { _page_path?: string }; Returns: undefined }
      unsubscribe_by_token: { Args: { _token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor"
      banner_type: "banner" | "popup"
      complaint_status: "pending" | "in_progress" | "resolved" | "rejected"
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
      app_role: ["admin", "editor"],
      banner_type: ["banner", "popup"],
      complaint_status: ["pending", "in_progress", "resolved", "rejected"],
    },
  },
} as const
