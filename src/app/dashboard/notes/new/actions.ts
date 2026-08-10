'use server'

import { z } from 'zod'
import { NOTE_FILE_BUCKET, NOTE_FILE_MAX_BYTES } from '@/lib/notes/storage/contracts'
import { verifyStoredNoteFile } from '@/lib/notes/storage/supabase-server'
import { createClient } from '@/lib/supabase/server'

const noteTypeSchema = z.enum([
  'lecture_notes',
  'summary',
  'pyq',
  'solution',
  'lab',
  'other',
])

const mimeTypeSchema = z.enum([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const tagSchema = z
  .string()
  .min(2)
  .max(32)
  .regex(/^[a-z0-9]+(?:[ -][a-z0-9]+)*$/)

const prepareUploadSchema = z.object({
  byteSize: z.coerce.number().int().min(1).max(NOTE_FILE_MAX_BYTES),
  description: z.string().trim().max(2000),
  mimeType: mimeTypeSchema,
  noteType: noteTypeSchema,
  originalFilename: z.string().trim().min(1).max(255),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  subjectId: z.coerce.number().int().positive(),
  tags: z.array(tagSchema).max(10),
  title: z.string().trim().min(3).max(180),
  visibility: z.enum(['public', 'university']),
})

const completionSchema = z.object({
  noteId: z.string().uuid(),
  objectKey: z
    .string()
    .regex(/^notes\/[0-9a-f-]{36}\/source\/[0-9a-f-]{36}$/),
  publish: z.boolean(),
})

type UploadFailure = {
  error: string
  ok: false
}

type PreparedUploadSuccess = {
  ok: true
  prepared: {
    bucket: string
    contentType: z.infer<typeof mimeTypeSchema>
    noteId: string
    objectKey: string
    token: string
  }
}

type CompletedUploadSuccess = {
  ok: true
  publicationStatus: string
}

export type PrepareNoteUploadResult = UploadFailure | PreparedUploadSuccess
export type CompleteNoteUploadResult = UploadFailure | CompletedUploadSuccess

function readString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function normalizeFilename(value: string) {
  return (
    value
      .split(/[\\/]/)
      .at(-1)
      ?.replace(/[\u0000-\u001f\u007f]/g, '')
      .trim() || ''
  )
}

function normalizeTags(value: string) {
  return [
    ...new Set(
      value
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  ]
}

function safeUploadError(message?: string) {
  if (message?.includes('Verified university membership')) {
    return 'University-only notes require a verified university membership.'
  }

  if (message?.includes('Subject')) {
    return 'Choose an available subject for this note.'
  }

  return 'Your note could not be prepared right now. Please try again.'
}

async function discardPreparedUpload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  noteId: string,
  objectKey?: string,
) {
  if (objectKey) {
    await supabase.storage.from(NOTE_FILE_BUCKET).remove([objectKey])
  }

  await supabase.rpc('discard_note_upload_draft', { p_note_id: noteId })
}

export async function prepareNoteUploadAction(
  formData: FormData,
): Promise<PrepareNoteUploadResult> {
  const parsed = prepareUploadSchema.safeParse({
    byteSize: readString(formData, 'byteSize'),
    description: readString(formData, 'description'),
    mimeType: readString(formData, 'mimeType'),
    noteType: readString(formData, 'noteType'),
    originalFilename: normalizeFilename(
      readString(formData, 'originalFilename'),
    ),
    sha256: readString(formData, 'sha256'),
    subjectId: readString(formData, 'subjectId'),
    tags: normalizeTags(readString(formData, 'tags')),
    title: readString(formData, 'title'),
    visibility: readString(formData, 'visibility'),
  })

  if (!parsed.success) {
    return {
      error:
        'Review the file, title, subject, note type, visibility, and tags before continuing.',
      ok: false,
    }
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims) {
    return { error: 'Your session expired. Sign in and try again.', ok: false }
  }

  const { data, error } = await supabase.rpc('create_note_upload_draft', {
    p_byte_size: parsed.data.byteSize,
    p_description: parsed.data.description,
    p_detected_mime_type: parsed.data.mimeType,
    p_note_type: parsed.data.noteType,
    p_original_filename: parsed.data.originalFilename,
    p_sha256: parsed.data.sha256,
    p_subject_id: parsed.data.subjectId,
    p_tags: parsed.data.tags,
    p_title: parsed.data.title,
    p_visibility: parsed.data.visibility,
  })

  const draft = data?.[0]

  if (error || !draft) {
    return { error: safeUploadError(error?.message), ok: false }
  }

  const { data: signedUpload, error: signedUploadError } = await supabase.storage
    .from(NOTE_FILE_BUCKET)
    .createSignedUploadUrl(draft.object_key, { upsert: false })

  if (signedUploadError || !signedUpload) {
    await discardPreparedUpload(supabase, draft.note_id)
    return {
      error: 'A secure upload link could not be created. Please try again.',
      ok: false,
    }
  }

  return {
    ok: true,
    prepared: {
      bucket: NOTE_FILE_BUCKET,
      contentType: parsed.data.mimeType,
      noteId: draft.note_id,
      objectKey: draft.object_key,
      token: signedUpload.token,
    },
  }
}

export async function discardNoteUploadAction(input: {
  noteId: string
  objectKey: string
}) {
  const parsed = completionSchema
    .pick({ noteId: true, objectKey: true })
    .safeParse(input)

  if (!parsed.success) return

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims) return

  await discardPreparedUpload(
    supabase,
    parsed.data.noteId,
    parsed.data.objectKey,
  )
}

export async function completeNoteUploadAction(input: {
  noteId: string
  objectKey: string
  publish: boolean
}): Promise<CompleteNoteUploadResult> {
  const parsed = completionSchema.safeParse(input)

  if (!parsed.success) {
    return { error: 'The upload details were invalid.', ok: false }
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims) {
    return { error: 'Your session expired. Sign in and try again.', ok: false }
  }

  try {
    const verified = await verifyStoredNoteFile(
      supabase,
      parsed.data.objectKey,
    )
    const { data, error } = await supabase.rpc('complete_note_upload', {
      p_note_id: parsed.data.noteId,
      p_publish: parsed.data.publish,
      p_verified_byte_size: verified.byteSize,
      p_verified_mime_type: verified.mimeType,
      p_verified_sha256: verified.sha256,
    })

    const completed = data?.[0]

    if (error || !completed) {
      throw new Error(safeUploadError(error?.message))
    }

    return {
      ok: true,
      publicationStatus: completed.publication_status,
    }
  } catch (error) {
    await discardPreparedUpload(
      supabase,
      parsed.data.noteId,
      parsed.data.objectKey,
    )

    return {
      error:
        error instanceof Error
          ? error.message
          : 'The uploaded file could not be verified.',
      ok: false,
    }
  }
}
