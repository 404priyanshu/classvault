import { createClient } from '@/lib/supabase/client'
import type {
  NoteFileUploadStorage,
  PreparedNoteUpload,
} from './contracts'

class SupabaseNoteFileUploadStorage implements NoteFileUploadStorage {
  async upload(file: File, prepared: PreparedNoteUpload) {
    const supabase = createClient()
    const { error } = await supabase.storage
      .from(prepared.bucket)
      .uploadToSignedUrl(prepared.objectKey, prepared.token, file, {
        cacheControl: '3600',
        contentType: prepared.contentType,
        upsert: false,
      })

    if (error) {
      throw new Error('The file could not be uploaded. Please try again.')
    }
  }
}

export function createNoteFileUploadStorage(): NoteFileUploadStorage {
  return new SupabaseNoteFileUploadStorage()
}
