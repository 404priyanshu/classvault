import 'server-only'

import type { createClient } from '@/lib/supabase/server'
import { NOTE_FILE_BUCKET } from './contracts'

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

export type AccessibleNoteFile = {
  byteSize: number
  mimeType: string
  noteId: string
  objectKey: string
  originalFilename: string
  pageCount: number | null
}

export async function getAccessibleNoteFile(
  supabase: ServerSupabaseClient,
  noteId: string,
): Promise<AccessibleNoteFile | null> {
  const { data, error } = await supabase.rpc('get_accessible_note_file', {
    p_note_id: noteId,
  })

  if (error) {
    throw new Error('The note file could not be authorized.')
  }

  const file = data?.[0]

  return file
    ? {
        byteSize: Number(file.byte_size),
        mimeType: file.detected_mime_type,
        noteId: file.note_id,
        objectKey: file.object_key,
        originalFilename: file.original_filename,
        pageCount: file.page_count,
      }
    : null
}

export async function createAccessibleNoteFileUrl(
  supabase: ServerSupabaseClient,
  file: AccessibleNoteFile,
  options: { download?: boolean } = {},
) {
  const { data, error } = await supabase.storage
    .from(NOTE_FILE_BUCKET)
    .createSignedUrl(file.objectKey, 300, {
      download: options.download ? file.originalFilename : undefined,
    })

  if (error || !data?.signedUrl) {
    throw new Error('The private note file could not be opened.')
  }

  return data.signedUrl
}
