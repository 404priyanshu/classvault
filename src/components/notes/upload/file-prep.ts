import { NOTE_FILE_MAX_BYTES } from '@/lib/notes/storage/contracts'
import { detectNoteFileMimeType } from '@/lib/notes/storage/file-signature'

export async function fingerprintFile(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const mimeType = detectNoteFileMimeType(bytes)

  if (!mimeType) {
    throw new Error('Use a valid PDF, JPG, PNG, or WebP file.')
  }

  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const sha256 = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return { mimeType, sha256 }
}

export function validateSelectedFile(file: File) {
  if (file.size < 1) {
    return 'Choose a file that is not empty.'
  }

  if (file.size > NOTE_FILE_MAX_BYTES) {
    return 'Your note must be 25 MiB or smaller.'
  }

  return null
}
