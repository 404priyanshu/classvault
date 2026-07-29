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
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
