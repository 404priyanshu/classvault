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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      note_assets: {
        Row: {
          byte_size: number
          created_at: string
          detected_mime_type: string
          id: string
          note_id: string
          object_key: string
          original_filename: string
          page_count: number | null
          preview_object_key: string | null
          processing_status: string
          sha256: string
          storage_backend: string
          updated_at: string
        }
        Insert: {
          byte_size: number
          created_at?: string
          detected_mime_type: string
          id?: string
          note_id: string
          object_key: string
          original_filename: string
          page_count?: number | null
          preview_object_key?: string | null
          processing_status?: string
          sha256: string
          storage_backend: string
          updated_at?: string
        }
        Update: {
          byte_size?: number
          created_at?: string
          detected_mime_type?: string
          id?: string
          note_id?: string
          object_key?: string
          original_filename?: string
          page_count?: number | null
          preview_object_key?: string | null
          processing_status?: string
          sha256?: string
          storage_backend?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_assets_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_moderation_actions: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: number
          note_id: string
          reason_code: string
          safe_owner_message: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: never
          note_id: string
          reason_code: string
          safe_owner_message?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: never
          note_id?: string
          reason_code?: string
          safe_owner_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_moderation_actions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_moderation_actions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_rating_summaries: {
        Row: {
          average_rating: number | null
          effective_rating_count: number
          last_rated_at: string | null
          note_id: string
          rating_count: number
          updated_at: string
          weighted_score: number | null
        }
        Insert: {
          average_rating?: number | null
          effective_rating_count?: number
          last_rated_at?: string | null
          note_id: string
          rating_count?: number
          updated_at?: string
          weighted_score?: number | null
        }
        Update: {
          average_rating?: number | null
          effective_rating_count?: number
          last_rated_at?: string | null
          note_id?: string
          rating_count?: number
          updated_at?: string
          weighted_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "note_rating_summaries_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_ratings: {
        Row: {
          created_at: string
          note_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          note_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          note_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_ratings_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      note_reports: {
        Row: {
          category: string
          created_at: string
          details: string | null
          id: string
          note_id: string
          reporter_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          category: string
          created_at?: string
          details?: string | null
          id?: string
          note_id: string
          reporter_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          category?: string
          created_at?: string
          details?: string | null
          id?: string
          note_id?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_reports_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      note_search_documents: {
        Row: {
          created_at: string
          extracted_text: string | null
          extraction_status: string
          extractor_version: string | null
          note_id: string
          search_document: unknown
          updated_at: string
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          extraction_status?: string
          extractor_version?: string | null
          note_id: string
          search_document?: unknown
          updated_at?: string
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          extraction_status?: string
          extractor_version?: string | null
          note_id?: string
          search_document?: unknown
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_search_documents_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          moderation_status: string
          note_type: string
          owner_id: string
          publication_status: string
          published_at: string | null
          purge_claimed_at: string | null
          purge_after: string | null
          retention_hold: boolean
          subject_id: number | null
          superseded_by_note_id: string | null
          tags: string[]
          title: string
          university_id: number | null
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          moderation_status?: string
          note_type?: string
          owner_id: string
          publication_status?: string
          published_at?: string | null
          purge_claimed_at?: string | null
          purge_after?: string | null
          retention_hold?: boolean
          subject_id?: number | null
          superseded_by_note_id?: string | null
          tags?: string[]
          title: string
          university_id?: number | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          moderation_status?: string
          note_type?: string
          owner_id?: string
          publication_status?: string
          published_at?: string | null
          purge_claimed_at?: string | null
          purge_after?: string | null
          retention_hold?: boolean
          subject_id?: number | null
          superseded_by_note_id?: string | null
          tags?: string[]
          title?: string
          university_id?: number | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_superseded_by_note_id_fkey"
            columns: ["superseded_by_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          course: string | null
          created_at: string
          display_name: string | null
          graduation_year: number | null
          id: string
          onboarding_completed_at: string | null
          primary_goal: string | null
          study_preference: string | null
          university_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          course?: string | null
          created_at?: string
          display_name?: string | null
          graduation_year?: number | null
          id: string
          onboarding_completed_at?: string | null
          primary_goal?: string | null
          study_preference?: string | null
          university_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          course?: string | null
          created_at?: string
          display_name?: string | null
          graduation_year?: number | null
          id?: string
          onboarding_completed_at?: string | null
          primary_goal?: string | null
          study_preference?: string | null
          university_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string | null
          course: string | null
          created_at: string
          id: number
          is_active: boolean
          name: string
          slug: string
          university_id: number | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          course?: string | null
          created_at?: string
          id?: never
          is_active?: boolean
          name: string
          slug: string
          university_id?: number | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          course?: string | null
          created_at?: string
          id?: never
          is_active?: boolean
          name?: string
          slug?: string
          university_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          city: string | null
          country: string
          created_at: string
          id: number
          is_active: boolean
          name: string
          short_name: string | null
          slug: string
          state: string | null
        }
        Insert: {
          city?: string | null
          country?: string
          created_at?: string
          id?: never
          is_active?: boolean
          name: string
          short_name?: string | null
          slug: string
          state?: string | null
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string
          id?: never
          is_active?: boolean
          name?: string
          short_name?: string | null
          slug?: string
          state?: string | null
        }
        Relationships: []
      }
      university_email_domains: {
        Row: {
          created_at: string
          domain: string
          id: number
          university_id: number
        }
        Insert: {
          created_at?: string
          domain: string
          id?: never
          university_id: number
        }
        Update: {
          created_at?: string
          domain?: string
          id?: never
          university_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "university_email_domains_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      university_memberships: {
        Row: {
          academic_email: string | null
          joined_at: string
          role: string
          status: string
          university_id: number
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          academic_email?: string | null
          joined_at?: string
          role?: string
          status?: string
          university_id: number
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          academic_email?: string | null
          joined_at?: string
          role?: string
          status?: string
          university_id?: number
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "university_memberships_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_note_tags_valid: {
        Args: { candidate_tags: string[] }
        Returns: boolean
      }
      begin_note_upload_discard: {
        Args: { p_note_id: string; p_object_key: string }
        Returns: boolean
      }
      can_consume_note: { Args: { target_note_id: string }; Returns: boolean }
      can_delete_cancelled_note_object: {
        Args: { target_object_key: string }
        Returns: boolean
      }
      can_download_note_object: {
        Args: { target_object_key: string }
        Returns: boolean
      }
      can_moderate_note: { Args: { target_note_id: string }; Returns: boolean }
      can_upload_note_object: {
        Args: { target_object_key: string }
        Returns: boolean
      }
      can_view_note_metadata: {
        Args: { target_note_id: string }
        Returns: boolean
      }
      claim_expired_note_purges: {
        Args: { p_limit?: number }
        Returns: {
          note_id: string
          object_key: string | null
          preview_object_key: string | null
        }[]
      }
      complete_note_upload: {
        Args: {
          p_note_id: string
          p_publish: boolean
          p_verified_byte_size: number
          p_verified_mime_type: string
          p_verified_sha256: string
        }
        Returns: {
          note_id: string
          publication_status: string
          published_at: string
        }[]
      }
      complete_student_onboarding: {
        Args: {
          p_course: string
          p_display_name: string
          p_graduation_year: number
          p_primary_goal: string
          p_study_preference: string
          p_university_id: number
        }
        Returns: {
          membership_status: string
          selected_university_name: string
        }[]
      }
      create_note_upload_draft: {
        Args: {
          p_byte_size: number
          p_description: string
          p_detected_mime_type: string
          p_note_type: string
          p_original_filename: string
          p_sha256: string
          p_subject_id: number
          p_tags: string[]
          p_title: string
          p_visibility: string
        }
        Returns: {
          asset_id: string
          note_id: string
          object_key: string
        }[]
      }
      discard_note_upload_draft: {
        Args: { p_note_id: string }
        Returns: boolean
      }
      delete_note: {
        Args: { p_note_id: string }
        Returns: {
          deleted_at: string
          note_id: string
          purge_after: string
        }[]
      }
      finalize_note_purge: {
        Args: { p_note_id: string }
        Returns: boolean
      }
      get_accessible_note_contributors: {
        Args: { p_note_ids: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          note_id: string
          owner_id: string
        }[]
      }
      get_accessible_note_file: {
        Args: { p_note_id: string }
        Returns: {
          byte_size: number
          detected_mime_type: string
          note_id: string
          object_key: string
          original_filename: string
          page_count: number
        }[]
      }
      get_note_upload_status: {
        Args: { p_note_id: string }
        Returns: {
          note_id: string
          processing_status: string
          publication_status: string
        }[]
      }
      has_platform_notes_role: {
        Args: { accepted_roles: string[] }
        Returns: boolean
      }
      has_verified_university_membership: {
        Args: { target_university_id: number }
        Returns: boolean
      }
      is_notes_eligible: { Args: never; Returns: boolean }
      list_owned_notes: {
        Args: { p_include_deleted?: boolean }
        Returns: {
          average_rating: number | null
          byte_size: number | null
          created_at: string
          deleted_at: string | null
          description: string | null
          detected_mime_type: string | null
          moderation_status: string
          note_id: string
          note_type: string
          original_filename: string | null
          processing_status: string | null
          publication_status: string
          published_at: string | null
          purge_after: string | null
          rating_count: number
          retention_hold: boolean
          subject_code: string | null
          subject_name: string | null
          title: string
          updated_at: string
          visibility: string
        }[]
      }
      list_notes_for_library: {
        Args: {
          p_access: string
          p_limit: number
          p_note_type: string
          p_offset: number
          p_query: string
          p_sort: string
          p_subject_id: number
        }
        Returns: {
          average_rating: number
          description: string
          id: string
          note_type: string
          owner_id: string
          published_at: string
          rating_count: number
          subject_code: string
          subject_name: string
          tags: string[]
          title: string
          total_count: number
          visibility: string
        }[]
      }
      rate_note: {
        Args: { p_note_id: string; p_rating: number }
        Returns: {
          average_rating: number
          effective_rating_count: number
          error_code: string
          rating_count: number
          success: boolean
          weighted_score: number
        }[]
      }
      refresh_note_rating_summary: {
        Args: { p_note_id: string }
        Returns: undefined
      }
      restore_note: {
        Args: { p_note_id: string }
        Returns: {
          error_code: string | null
          note_id: string | null
          publication_status: string | null
          success: boolean
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
