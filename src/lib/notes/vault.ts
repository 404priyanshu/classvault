export type OwnedNote = {
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
}

export function formatVaultFileSize(bytes: number | null) {
  if (!bytes || bytes < 1) return 'File pending'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function daysUntilPurge(purgeAfter: string | null, now = new Date()) {
  if (!purgeAfter) return null
  const remaining = new Date(purgeAfter).getTime() - now.getTime()
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)))
}

export function formatVaultStatus(note: OwnedNote) {
  if (note.publication_status === 'published') return 'Published'
  if (note.publication_status === 'processing') return 'Processing'
  if (note.publication_status === 'failed') return 'Upload needs attention'
  return note.processing_status === 'ready' ? 'Saved draft' : 'Upload in progress'
}
