export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
            foreignKeyName: 'note_assets_note_id_fkey'
            columns: ['note_id']
            isOneToOne: true
            referencedRelation: 'notes'
            referencedColumns: ['id']
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
            foreignKeyName: 'note_moderation_actions_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'note_moderation_actions_note_id_fkey'
            columns: ['note_id']
            isOneToOne: false
            referencedRelation: 'notes'
            referencedColumns: ['id']
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
            foreignKeyName: 'note_rating_summaries_note_id_fkey'
            columns: ['note_id']
            isOneToOne: true
            referencedRelation: 'notes'
            referencedColumns: ['id']
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
            foreignKeyName: 'note_ratings_note_id_fkey'
            columns: ['note_id']
            isOneToOne: false
            referencedRelation: 'notes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'note_ratings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
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
            foreignKeyName: 'note_reports_note_id_fkey'
            columns: ['note_id']
            isOneToOne: false
            referencedRelation: 'notes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'note_reports_reporter_id_fkey'
            columns: ['reporter_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
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
          search_document: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          extraction_status?: string
          extractor_version?: string | null
          note_id: string
          search_document?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          extraction_status?: string
          extractor_version?: string | null
          note_id?: string
          search_document?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'note_search_documents_note_id_fkey'
            columns: ['note_id']
            isOneToOne: true
            referencedRelation: 'notes'
            referencedColumns: ['id']
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
            foreignKeyName: 'notes_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notes_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notes_superseded_by_note_id_fkey'
            columns: ['superseded_by_note_id']
            isOneToOne: false
            referencedRelation: 'notes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notes_university_id_fkey'
            columns: ['university_id']
            isOneToOne: false
            referencedRelation: 'universities'
            referencedColumns: ['id']
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
            foreignKeyName: 'platform_roles_granted_by_fkey'
            columns: ['granted_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'platform_roles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
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
            foreignKeyName: 'subjects_university_id_fkey'
            columns: ['university_id']
            isOneToOne: false
            referencedRelation: 'universities'
            referencedColumns: ['id']
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
            foreignKeyName: 'university_email_domains_university_id_fkey'
            columns: ['university_id']
            isOneToOne: false
            referencedRelation: 'universities'
            referencedColumns: ['id']
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
            foreignKeyName: 'university_memberships_university_id_fkey'
            columns: ['university_id']
            isOneToOne: false
            referencedRelation: 'universities'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      are_note_tags_valid: {
        Args: { candidate_tags: string[] }
        Returns: boolean
      }
      can_consume_note: {
        Args: { target_note_id: string }
        Returns: boolean
      }
      can_moderate_note: {
        Args: { target_note_id: string }
        Returns: boolean
      }
      can_view_note_metadata: {
        Args: { target_note_id: string }
        Returns: boolean
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
      has_platform_notes_role: {
        Args: { accepted_roles: string[] }
        Returns: boolean
      }
      has_verified_university_membership: {
        Args: { target_university_id: number }
        Returns: boolean
      }
      is_notes_eligible: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
