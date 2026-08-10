import 'server-only'

import { createHash } from 'node:crypto'
import type { createClient } from '@/lib/supabase/server'
import {
  NOTE_FILE_BUCKET,
  NOTE_FILE_MAX_BYTES,
  type VerifiedNoteFile,
} from './contracts'
import { detectNoteFileMimeType } from './file-signature'

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

export async function verifyStoredNoteFile(
  supabase: ServerSupabaseClient,
  objectKey: string,
): Promise<VerifiedNoteFile> {
  const { data, error } = await supabase.storage
    .from(NOTE_FILE_BUCKET)
    .download(objectKey)

  if (error || !data) {
    throw new Error('The uploaded file could not be verified.')
  }

  if (data.size < 1 || data.size > NOTE_FILE_MAX_BYTES) {
    throw new Error('The uploaded file is larger than 25 MiB.')
  }

  const bytes = new Uint8Array(await data.arrayBuffer())
  const mimeType = detectNoteFileMimeType(bytes)

  if (!mimeType) {
    throw new Error('Use a valid PDF, JPG, PNG, or WebP file.')
  }

  return {
    byteSize: bytes.byteLength,
    mimeType,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
}
