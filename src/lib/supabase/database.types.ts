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
      account_suspension_actions: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: number
          reason: string
          user_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: never
          reason: string
          user_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: never
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_suspension_actions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_suspension_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_verification_requests: {
        Row: {
          decision_reason: string | null
          enrolment_id: string
          evidence_method: string | null
          id: string
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          student_context: string
          submitted_at: string
          university_id: number
          user_id: string
        }
        Insert: {
          decision_reason?: string | null
          enrolment_id: string
          evidence_method?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          student_context?: string
          submitted_at?: string
          university_id: number
          user_id: string
        }
        Update: {
          decision_reason?: string | null
          enrolment_id?: string
          evidence_method?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          student_context?: string
          submitted_at?: string
          university_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_verification_requests_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "university_memberships"
            referencedColumns: ["user_id"]
          },
        ]
      }
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
          owner_id: string | null
          publication_status: string
          published_at: string | null
          purge_after: string | null
          purge_claimed_at: string | null
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
          owner_id?: string | null
          publication_status?: string
          published_at?: string | null
          purge_after?: string | null
          purge_claimed_at?: string | null
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
          owner_id?: string | null
          publication_status?: string
          published_at?: string | null
          purge_after?: string | null
          purge_claimed_at?: string | null
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
          suspended_at: string | null
          suspension_reason: string | null
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
          suspended_at?: string | null
          suspension_reason?: string | null
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
          suspended_at?: string | null
          suspension_reason?: string | null
          university_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      roadmap_section_sources: {
        Row: {
          section_id: number
          source_id: number
        }
        Insert: {
          section_id: number
          source_id: number
        }
        Update: {
          section_id?: number
          source_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_section_sources_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "roadmap_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_section_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "roadmap_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_sections: {
        Row: {
          created_at: string
          id: number
          position: number
          roadmap_id: string
          summary: string
          timeframe_label: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: never
          position: number
          roadmap_id: string
          summary: string
          timeframe_label: string
          title: string
        }
        Update: {
          created_at?: string
          id?: never
          position?: number
          roadmap_id?: string
          summary?: string
          timeframe_label?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_sections_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "study_roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_share_links: {
        Row: {
          enabled_at: string
          revoked_at: string | null
          roadmap_id: string
          share_token: string
        }
        Insert: {
          enabled_at?: string
          revoked_at?: string | null
          roadmap_id: string
          share_token?: string
        }
        Update: {
          enabled_at?: string
          revoked_at?: string | null
          roadmap_id?: string
          share_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_share_links_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: true
            referencedRelation: "study_roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_sources: {
        Row: {
          created_at: string
          id: number
          note_id: string | null
          roadmap_id: string
          source_scope: string
          source_university_id: number | null
          title_snapshot: string
          visibility_snapshot: string
        }
        Insert: {
          created_at?: string
          id?: never
          note_id?: string | null
          roadmap_id: string
          source_scope: string
          source_university_id?: number | null
          title_snapshot: string
          visibility_snapshot: string
        }
        Update: {
          created_at?: string
          id?: never
          note_id?: string | null
          roadmap_id?: string
          source_scope?: string
          source_university_id?: number | null
          title_snapshot?: string
          visibility_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_sources_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_sources_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "study_roadmaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_sources_source_university_id_fkey"
            columns: ["source_university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_task_progress: {
        Row: {
          completed_at: string
          owner_id: string
          task_id: number
        }
        Insert: {
          completed_at?: string
          owner_id: string
          task_id: number
        }
        Update: {
          completed_at?: string
          owner_id?: string
          task_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_task_progress_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_task_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "roadmap_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_tasks: {
        Row: {
          created_at: string
          id: number
          position: number
          section_id: number
          task_text: string
        }
        Insert: {
          created_at?: string
          id?: never
          position: number
          section_id: number
          task_text: string
        }
        Update: {
          created_at?: string
          id?: never
          position?: number
          section_id?: number
          task_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_tasks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "roadmap_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      study_roadmaps: {
        Row: {
          created_at: string
          failure_code: string | null
          generated_at: string | null
          generation_attempts: number
          generation_plan: string
          generator_key: string | null
          id: string
          owner_id: string
          status: string
          study_mode: string
          title: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          failure_code?: string | null
          generated_at?: string | null
          generation_attempts?: number
          generation_plan?: string
          generator_key?: string | null
          id?: string
          owner_id: string
          status?: string
          study_mode: string
          title: string
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          failure_code?: string | null
          generated_at?: string | null
          generation_attempts?: number
          generation_plan?: string
          generator_key?: string | null
          id?: string
          owner_id?: string
          status?: string
          study_mode?: string
          title?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_roadmaps_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_creation_log: {
        Row: {
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_creation_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_members: {
        Row: {
          avatar_url_snapshot: string | null
          display_name_snapshot: string
          joined_at: string
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          avatar_url_snapshot?: string | null
          display_name_snapshot: string
          joined_at?: string
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          avatar_url_snapshot?: string | null
          display_name_snapshot?: string
          joined_at?: string
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_messages: {
        Row: {
          author_display_name: string
          author_id: string | null
          body: string
          created_at: string
          id: number
          room_id: string
        }
        Insert: {
          author_display_name: string
          author_id?: string | null
          body: string
          created_at?: string
          id?: never
          room_id: string
        }
        Update: {
          author_display_name?: string
          author_id?: string | null
          body?: string
          created_at?: string
          id?: never
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_moderation_actions: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: number
          reason: string
          room_id: string
          target_user_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: never
          reason: string
          room_id: string
          target_user_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: never
          reason?: string
          room_id?: string
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_moderation_actions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_plan_limits: {
        Row: {
          chat_messages_per_window: number
          chat_window_seconds: number
          duration_minutes: number
          maximum_break_minutes: number
          maximum_focus_minutes: number
          member_capacity: number
          plan: string
          room_window_minutes: number
          rooms_per_window: number
        }
        Insert: {
          chat_messages_per_window?: number
          chat_window_seconds?: number
          duration_minutes: number
          maximum_break_minutes: number
          maximum_focus_minutes: number
          member_capacity: number
          plan: string
          room_window_minutes?: number
          rooms_per_window?: number
        }
        Update: {
          chat_messages_per_window?: number
          chat_window_seconds?: number
          duration_minutes?: number
          maximum_break_minutes?: number
          maximum_focus_minutes?: number
          member_capacity?: number
          plan?: string
          room_window_minutes?: number
          rooms_per_window?: number
        }
        Relationships: []
      }
      study_room_report_messages: {
        Row: {
          author_display_name: string
          body: string
          position: number
          report_id: string
          sent_at: string
        }
        Insert: {
          author_display_name: string
          body: string
          position: number
          report_id: string
          sent_at: string
        }
        Update: {
          author_display_name?: string
          body?: string
          position?: number
          report_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_report_messages_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "study_room_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_reports: {
        Row: {
          category: string
          created_at: string
          details: string
          id: string
          reported_user_id: string
          reporter_id: string
          review_note: string
          reviewed_at: string | null
          reviewer_id: string | null
          room_id: string
          room_name_snapshot: string
          status: string
        }
        Insert: {
          category: string
          created_at?: string
          details?: string
          id?: string
          reported_user_id: string
          reporter_id: string
          review_note?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          room_id: string
          room_name_snapshot: string
          status?: string
        }
        Update: {
          category?: string
          created_at?: string
          details?: string
          id?: string
          reported_user_id?: string
          reporter_id?: string
          review_note?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          room_id?: string
          room_name_snapshot?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_reports_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_restrictions: {
        Row: {
          actor_id: string | null
          created_at: string
          kind: string
          reason: string
          room_id: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          kind: string
          reason: string
          room_id: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          kind?: string
          reason?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_restrictions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_restrictions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_restrictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_rooms: {
        Row: {
          break_minutes: number
          created_at: string
          created_by: string | null
          cycles_completed: number
          ends_at: string
          focus_minutes: number
          host_plan_snapshot: string
          id: string
          member_capacity: number
          name: string
          subject_tag: string
          timer_anchor_at: string | null
          timer_phase: string
          timer_remaining_seconds: number
          timer_revision: number
          timer_status: string
          university_id: number | null
          updated_at: string
          visibility: string
        }
        Insert: {
          break_minutes: number
          created_at?: string
          created_by?: string | null
          cycles_completed?: number
          ends_at: string
          focus_minutes: number
          host_plan_snapshot: string
          id?: string
          member_capacity: number
          name: string
          subject_tag: string
          timer_anchor_at?: string | null
          timer_phase?: string
          timer_remaining_seconds: number
          timer_revision?: number
          timer_status?: string
          university_id?: number | null
          updated_at?: string
          visibility: string
        }
        Update: {
          break_minutes?: number
          created_at?: string
          created_by?: string | null
          cycles_completed?: number
          ends_at?: string
          focus_minutes?: number
          host_plan_snapshot?: string
          id?: string
          member_capacity?: number
          name?: string
          subject_tag?: string
          timer_anchor_at?: string | null
          timer_phase?: string
          timer_remaining_seconds?: number
          timer_revision?: number
          timer_status?: string
          university_id?: number | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_rooms_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
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
      can_access_study_room: { Args: { p_room_id: string }; Returns: boolean }
      can_close_own_account: { Args: never; Returns: boolean }
      can_consume_note: { Args: { target_note_id: string }; Returns: boolean }
      can_control_study_room: { Args: { p_room_id: string }; Returns: boolean }
      can_delete_cancelled_note_object: {
        Args: { target_object_key: string }
        Returns: boolean
      }
      can_download_note_object: {
        Args: { target_object_key: string }
        Returns: boolean
      }
      can_moderate_note: { Args: { target_note_id: string }; Returns: boolean }
      can_review_membership: {
        Args: { target_university_id: number }
        Returns: boolean
      }
      can_upload_note_object: {
        Args: { target_object_key: string }
        Returns: boolean
      }
      can_view_note_metadata: {
        Args: { target_note_id: string }
        Returns: boolean
      }
      can_view_roadmap_section: {
        Args: { p_section_id: number; p_viewer_id: string }
        Returns: boolean
      }
      can_view_roadmap_source: {
        Args: { p_source_id: number; p_viewer_id: string }
        Returns: boolean
      }
      claim_expired_note_purges: {
        Args: { p_limit?: number }
        Returns: {
          note_id: string
          object_key: string
          preview_object_key: string
        }[]
      }
      claim_pending_note_extractions: {
        Args: { p_limit?: number }
        Returns: {
          detected_mime_type: string
          note_id: string
          object_key: string
          title: string
        }[]
      }
      claim_roadmap_generation: {
        Args: {
          p_generator_key: string
          p_owner_id: string
          p_roadmap_id: string
        }
        Returns: {
          claim_status: string
          roadmap_id: string
          source_count: number
          sources: Json
          study_mode: string
          topic: string
        }[]
      }
      close_own_account: { Args: { p_keep_published: boolean }; Returns: Json }
      complete_note_extraction: {
        Args: {
          p_extracted_text: string
          p_extraction_status: string
          p_extractor_version: string
          p_note_id: string
        }
        Returns: boolean
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
      complete_student_onboarding_initial: {
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
      create_roadmap_source_snapshot: {
        Args: { p_study_mode: string; p_topic: string }
        Returns: {
          generation_plan: string
          roadmap_id: string
          source_count: number
        }[]
      }
      create_study_room: {
        Args: {
          p_break_minutes: number
          p_focus_minutes: number
          p_name: string
          p_subject_tag: string
          p_visibility: string
        }
        Returns: string
      }
      current_roadmap_plan: { Args: never; Returns: string }
      current_study_room_plan: { Args: never; Returns: string }
      delete_note: {
        Args: { p_note_id: string }
        Returns: {
          deleted_at: string
          note_id: string
          purge_after: string
        }[]
      }
      discard_note_upload_draft: {
        Args: { p_note_id: string }
        Returns: boolean
      }
      end_study_room: { Args: { p_room_id: string }; Returns: boolean }
      finalize_note_purge: { Args: { p_note_id: string }; Returns: boolean }
      find_or_create_subject: {
        Args: { p_name: string }
        Returns: {
          code: string
          id: number
          name: string
          university_id: number
        }[]
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
      get_own_account_status: {
        Args: never
        Returns: {
          suspended: boolean
          suspended_at: string
          suspension_reason: string
        }[]
      }
      get_roadmap_share_state: {
        Args: { p_roadmap_id: string }
        Returns: {
          share_token: string
          sharing_enabled: boolean
        }[]
      }
      get_roadmap_snapshot: {
        Args: { p_roadmap_id: string; p_share_token?: string }
        Returns: Json
      }
      get_study_room_snapshot: { Args: { p_room_id: string }; Returns: Json }
      get_usage_daily: {
        Args: { p_days?: number }
        Returns: {
          day: string
          event: string
          events: number
          searches_without_results: number
          students: number
        }[]
      }
      get_usage_weekly: {
        Args: { p_weeks?: number }
        Returns: {
          active_students: number
          returning_students: number
          week: string
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
      is_account_suspended: { Args: never; Returns: boolean }
      is_muted_in_study_room: { Args: { p_room_id: string }; Returns: boolean }
      is_notes_eligible: { Args: never; Returns: boolean }
      is_study_room_eligible: { Args: never; Returns: boolean }
      is_study_room_member: { Args: { p_room_id: string }; Returns: boolean }
      join_study_room: { Args: { p_room_id: string }; Returns: boolean }
      leave_study_room: {
        Args: { p_room_id: string }
        Returns: {
          new_host_id: string
          room_deleted: boolean
        }[]
      }
      list_account_deletion_object_keys: {
        Args: { p_keep_published: boolean }
        Returns: {
          object_key: string
          preview_object_key: string
        }[]
      }
      list_membership_verification_queue: {
        Args: { p_limit?: number }
        Returns: {
          account_email: string
          course: string
          display_name: string
          enrolment_id: string
          graduation_year: number
          request_id: string
          student_context: string
          submitted_at: string
          university_id: number
          university_name: string
        }[]
      }
      list_moderation_queue: {
        Args: { p_limit?: number }
        Returns: {
          category: string
          created_at: string
          details: string
          moderation_status: string
          note_id: string
          note_title: string
          note_visibility: string
          owner_label: string
          report_id: string
          report_status: string
          reporter_label: string
          university_name: string
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
          extraction_status: string
          id: string
          note_type: string
          owner_id: string
          published_at: string
          rating_count: number
          search_rank: number
          search_snippet: string
          subject_code: string
          subject_name: string
          tags: string[]
          title: string
          total_count: number
          visibility: string
        }[]
      }
      list_own_membership_verification_requests: {
        Args: never
        Returns: {
          decision_reason: string
          request_id: string
          reviewed_at: string
          status: string
          submitted_at: string
        }[]
      }
      list_owned_note_moderation_notices: {
        Args: never
        Returns: {
          action: string
          created_at: string
          moderation_status: string
          note_id: string
          note_title: string
          safe_owner_message: string
        }[]
      }
      list_owned_notes: {
        Args: { p_include_deleted?: boolean }
        Returns: {
          average_rating: number
          byte_size: number
          created_at: string
          deleted_at: string
          description: string
          detected_mime_type: string
          moderation_status: string
          note_id: string
          note_type: string
          original_filename: string
          processing_status: string
          publication_status: string
          published_at: string
          purge_after: string
          rating_count: number
          retention_hold: boolean
          subject_code: string
          subject_name: string
          title: string
          updated_at: string
          visibility: string
        }[]
      }
      list_owned_roadmaps: {
        Args: never
        Returns: {
          completed_task_count: number
          created_at: string
          generated_at: string
          generation_plan: string
          roadmap_id: string
          section_count: number
          sharing_enabled: boolean
          source_count: number
          status: string
          study_mode: string
          title: string
          topic: string
          total_task_count: number
        }[]
      }
      list_plan_eligible_roadmap_sources: {
        Args: { p_owner_id: string; p_plan: string }
        Returns: {
          note_id: string
          source_scope: string
          source_university_id: number
          title_snapshot: string
          visibility_snapshot: string
        }[]
      }
      list_study_room_reports: {
        Args: { p_limit?: number }
        Returns: {
          category: string
          cited_messages: Json
          created_at: string
          details: string
          report_id: string
          reported_label: string
          reported_suspended: boolean
          reporter_label: string
          review_note: string
          reviewed_at: string
          reviewer_label: string
          room_name: string
          room_still_live: boolean
          status: string
        }[]
      }
      list_study_rooms: {
        Args: never
        Returns: {
          created_at: string
          current_user_joined: boolean
          cycles_completed: number
          ends_at: string
          host_display_name: string
          member_capacity: number
          member_count: number
          room_id: string
          room_name: string
          subject_tag: string
          timer_phase: string
          timer_remaining_seconds: number
          timer_revision: number
          timer_status: string
          university_id: number
          university_name: string
          visibility: string
        }[]
      }
      list_suspended_accounts: {
        Args: { p_limit?: number }
        Returns: {
          decided_by_label: string
          display_name: string
          suspended_at: string
          suspension_reason: string
          user_id: string
        }[]
      }
      mark_roadmap_generation_failed: {
        Args: {
          p_failure_code: string
          p_owner_id: string
          p_roadmap_id: string
        }
        Returns: boolean
      }
      moderate_note: {
        Args: {
          p_action: string
          p_note_id: string
          p_reason_code: string
          p_safe_owner_message?: string
        }
        Returns: {
          error_code: string
          moderation_status: string
          note_id: string
          success: boolean
        }[]
      }
      normalize_subject_slug: { Args: { p_name: string }; Returns: string }
      preview_roadmap_source_eligibility: {
        Args: never
        Returns: {
          eligible_university_count: number
          generation_plan: string
          personal_count: number
          pro_university_count: number
          public_count: number
          total_eligible_count: number
        }[]
      }
      purge_expired_study_rooms: { Args: never; Returns: number }
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
      remove_study_room_member: {
        Args: { p_reason: string; p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      record_usage_event: {
        Args: { p_event: string; p_found_results?: boolean; p_note_id?: string }
        Returns: boolean
      }
      report_note: {
        Args: { p_category: string; p_details?: string; p_note_id: string }
        Returns: {
          error_code: string
          report_id: string
          success: boolean
        }[]
      }
      report_study_room_participant: {
        Args: {
          p_category: string
          p_details?: string
          p_message_ids?: number[]
          p_room_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      restore_note: {
        Args: { p_note_id: string }
        Returns: {
          error_code: string
          note_id: string
          publication_status: string
          success: boolean
        }[]
      }
      review_membership_verification_request: {
        Args: {
          p_decision: string
          p_evidence_method: string
          p_reason: string
          p_request_id: string
        }
        Returns: boolean
      }
      save_roadmap_snapshot: {
        Args: { p_roadmap_id: string; p_sections: Json; p_title: string }
        Returns: boolean
      }
      send_study_room_message: {
        Args: { p_body: string; p_room_id: string }
        Returns: number
      }
      set_account_suspension: {
        Args: { p_reason: string; p_suspended: boolean; p_user_id: string }
        Returns: boolean
      }
      set_roadmap_sharing: {
        Args: { p_enabled: boolean; p_roadmap_id: string }
        Returns: string
      }
      set_roadmap_task_progress: {
        Args: { p_completed: boolean; p_task_id: number }
        Returns: boolean
      }
      set_study_room_member_role: {
        Args: { p_role: string; p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      set_study_room_mute: {
        Args: {
          p_muted: boolean
          p_reason: string
          p_room_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      set_study_room_report_status: {
        Args: { p_report_id: string; p_review_note?: string; p_status: string }
        Returns: boolean
      }
      study_room_timer_remaining: {
        Args: {
          p_anchor_at: string
          p_remaining_seconds: number
          p_status: string
        }
        Returns: number
      }
      submit_membership_verification_request: {
        Args: { p_enrolment_id: string; p_student_context?: string }
        Returns: string
      }
      suspend_note_owner: {
        Args: { p_note_id: string; p_reason: string }
        Returns: boolean
      }
      suspend_study_room_reported_user: {
        Args: { p_reason: string; p_report_id: string }
        Returns: boolean
      }
      update_study_room_timer: {
        Args: {
          p_action: string
          p_expected_revision?: number
          p_room_id: string
        }
        Returns: {
          cycles_completed: number
          server_now: string
          timer_phase: string
          timer_remaining_seconds: number
          timer_revision: number
          timer_status: string
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

