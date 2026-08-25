'use server'

import { after } from 'next/server'
import { z } from 'zod'
import { NOTE_FILE_BUCKET, NOTE_FILE_MAX_BYTES } from '@/lib/notes/storage/contracts'
import { runNoteExtraction } from '@/lib/notes/search/runner'
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
  subjectName: z.string().trim().min(2).max(120),
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

function subjectErrorMessage(message: string | undefined) {
  if (message?.includes('invalid_subject_name')) {
    return 'Use a subject name between 2 and 120 characters.'
  }

  if (message?.includes('onboarding_incomplete')) {
    return 'Finish onboarding before uploading notes.'
  }

  if (message?.includes('university_required')) {
    return 'Join a university during onboarding before adding a new subject.'
  }

  return 'That subject could not be saved. Try a different name.'
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
  objectKey: string,
) {
  const { data: discardStarted, error: discardStartError } = await supabase.rpc(
    'begin_note_upload_discard',
    {
      p_note_id: noteId,
      p_object_key: objectKey,
    },
  )

  if (discardStartError || !discardStarted) {
    return false
  }

  const { error: removeError } = await supabase.storage
    .from(NOTE_FILE_BUCKET)
    .remove([objectKey])

  if (removeError) {
    return false
  }

  const { data: discarded, error: discardError } = await supabase.rpc(
    'discard_note_upload_draft',
    { p_note_id: noteId },
  )

  return !discardError && discarded === true
}

async function readCompletedUpload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  noteId: string,
) {
  const { data, error } = await supabase.rpc('get_note_upload_status', {
    p_note_id: noteId,
  })
  const status = data?.[0]

  return !error && status?.processing_status === 'ready'
    ? status.publication_status
    : null
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
    subjectName: readString(formData, 'subjectName'),
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

  // Resolve the free-form subject first. The RPC reuses an existing row when
  // the slug matches and otherwise creates one against the caller's university,
  // so the catalog grows with the campus instead of blocking an upload whose
  // course was never seeded.
  const { data: subjectRows, error: subjectError } = await supabase.rpc(
    'find_or_create_subject',
    { p_name: parsed.data.subjectName },
  )

  const subject = subjectRows?.[0]

  if (subjectError || !subject) {
    return { error: subjectErrorMessage(subjectError?.message), ok: false }
  }

  const { data, error } = await supabase.rpc('create_note_upload_draft', {
    p_byte_size: parsed.data.byteSize,
    p_description: parsed.data.description,
    p_detected_mime_type: parsed.data.mimeType,
    p_note_type: parsed.data.noteType,
    p_original_filename: parsed.data.originalFilename,
    p_sha256: parsed.data.sha256,
    p_subject_id: subject.id,
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
    await discardPreparedUpload(
      supabase,
      draft.note_id,
      draft.object_key,
    )
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

    if (completed.publication_status === 'published') {
      // Index after the response is sent so publishing stays fast. The claim
      // RPC is FIFO and shared with the scheduled worker, so this drains the
      // oldest pending notes rather than necessarily this one; either way the
      // backlog shrinks, and the cron sweep still catches anything an
      // interrupted invocation left behind.
      after(async () => {
        try {
          await runNoteExtraction(3)
        } catch (extractionError) {
          console.error(
            'inline note extraction failed',
            parsed.data.noteId,
            extractionError,
          )
        }
      })
    }

    return {
      ok: true,
      publicationStatus: completed.publication_status,
    }
  } catch (error) {
    const discarded = await discardPreparedUpload(
      supabase,
      parsed.data.noteId,
      parsed.data.objectKey,
    )

    if (!discarded) {
      const publicationStatus = await readCompletedUpload(
        supabase,
        parsed.data.noteId,
      )

      if (publicationStatus) {
        return { ok: true, publicationStatus }
      }
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : 'The uploaded file could not be verified.',
      ok: false,
    }
  }
}
