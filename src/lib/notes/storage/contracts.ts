export const NOTE_FILE_BUCKET = 'note-files'
export const NOTE_FILE_MAX_BYTES = 25 * 1024 * 1024

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
