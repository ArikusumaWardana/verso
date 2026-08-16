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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      document_images: {
        Row: {
          created_at: string
          document_id: string
          format: string
          height: number | null
          id: string
          original_url: string | null
          position: number
          size_bytes: number | null
          storage_path: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          document_id: string
          format?: string
          height?: number | null
          id?: string
          original_url?: string | null
          position?: number
          size_bytes?: number | null
          storage_path: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          document_id?: string
          format?: string
          height?: number | null
          id?: string
          original_url?: string | null
          position?: number
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_images_document_owner_fkey"
            columns: ["document_id", "user_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      document_tags: {
        Row: {
          created_at: string
          document_id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          tag_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_tags_document_owner_fkey"
            columns: ["document_id", "user_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "document_tags_tag_owner_fkey"
            columns: ["tag_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      documents: {
        Row: {
          archived_at: string | null
          author: string | null
          canonical_pdf_url: string | null
          content_html: string | null
          content_text: string
          cover_image_path: string | null
          created_at: string
          excerpt: string | null
          fts: unknown
          id: string
          page_count: number | null
          raw_file_path: string | null
          raw_file_size_bytes: number | null
          read_at: string | null
          reading_time_minutes: number
          site_name: string | null
          source: Database["public"]["Enums"]["ingestion_source"]
          source_url: string | null
          starred_at: string | null
          status: Database["public"]["Enums"]["document_status"]
          title: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          author?: string | null
          canonical_pdf_url?: string | null
          content_html?: string | null
          content_text?: string
          cover_image_path?: string | null
          created_at?: string
          excerpt?: string | null
          fts?: unknown
          id?: string
          page_count?: number | null
          raw_file_path?: string | null
          raw_file_size_bytes?: number | null
          read_at?: string | null
          reading_time_minutes?: number
          site_name?: string | null
          source?: Database["public"]["Enums"]["ingestion_source"]
          source_url?: string | null
          starred_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          author?: string | null
          canonical_pdf_url?: string | null
          content_html?: string | null
          content_text?: string
          cover_image_path?: string | null
          created_at?: string
          excerpt?: string | null
          fts?: unknown
          id?: string
          page_count?: number | null
          raw_file_path?: string | null
          raw_file_size_bytes?: number | null
          read_at?: string | null
          reading_time_minutes?: number
          site_name?: string | null
          source?: Database["public"]["Enums"]["ingestion_source"]
          source_url?: string | null
          starred_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ingestion_jobs: {
        Row: {
          created_at: string
          document_id: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          input_url: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          input_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          input_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_jobs_document_owner_fkey"
            columns: ["document_id", "user_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_documents: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          author: string
          created_at: string
          excerpt: string
          id: string
          rank: number
          reading_time_minutes: number
          site_name: string
          status: Database["public"]["Enums"]["document_status"]
          title: string
          type: Database["public"]["Enums"]["document_type"]
        }[]
      }
    }
    Enums: {
      document_status: "unread" | "read" | "starred" | "archived"
      document_type: "article" | "pdf"
      ingestion_source: "extension" | "manual_url" | "file_upload"
      job_status: "pending" | "processing" | "succeeded" | "failed"
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
      document_status: ["unread", "read", "starred", "archived"],
      document_type: ["article", "pdf"],
      ingestion_source: ["extension", "manual_url", "file_upload"],
      job_status: ["pending", "processing", "succeeded", "failed"],
    },
  },
} as const

