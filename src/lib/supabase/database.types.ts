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
          university_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
