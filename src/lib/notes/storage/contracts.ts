export const NOTE_FILE_BUCKET = 'note-files'
/**
 * 10 MiB. Held down deliberately: the free tier gives 1 GB of storage and 5 GB
 * of monthly egress, and every view of a note spends that egress again, so an
 * oversized upload is charged repeatedly. Scanned unit notes fit well inside
 * this. Changing it means changing the storage bucket, the note_assets check
 * constraint and create_note_upload_draft in the same migration.
 */
export const NOTE_FILE_MAX_BYTES = 10 * 1024 * 1024

export const NOTE_FILE_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type NoteFileMimeType = (typeof NOTE_FILE_MIME_TYPES)[number]

export type PreparedNoteUpload = {
  bucket: string
  contentType: NoteFileMimeType
  noteId: string
  objectKey: string
  token: string
}

export type VerifiedNoteFile = {
  byteSize: number
  mimeType: NoteFileMimeType
  sha256: string
}

export interface NoteFileUploadStorage {
  upload(file: File, prepared: PreparedNoteUpload): Promise<void>
}
