'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const ratingSchema = z.object({
  noteId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
})

const reportSchema = z.object({
  category: z.enum([
    'copyright',
    'unsafe_file',
    'wrong_scope',
    'misleading',
    'harassment',
    'spam',
    'other',
  ]),
  details: z.string().trim().max(2000).optional(),
  noteId: z.string().uuid(),
})

type RatingFailure = {
  error: string
  ok: false
}

type RatingSuccess = {
  averageRating: number | null
  ok: true
  ratingCount: number
}

export type NoteRatingResult = RatingFailure | RatingSuccess

type ReportFailure = {
  error: string
  ok: false
}

type ReportSuccess = {
  ok: true
}

export type NoteReportResult = ReportFailure | ReportSuccess

const RATING_ERROR_MESSAGES: Record<string, string> = {
  invalid_rating: 'Choose a rating between one and five stars.',
  note_unavailable: 'This note is no longer available.',
  not_permitted:
    'You need access to this note before you can rate it.',
  self_rating_forbidden: 'You cannot rate your own note.',
  unauthenticated: 'Your session expired. Sign in and try again.',
}

const REPORT_ERROR_MESSAGES: Record<string, string> = {
  already_reported: 'You already have an open report for this note.',
  details_too_long: 'Keep the report details under 2,000 characters.',
  invalid_category: 'Choose a valid report reason.',
  not_permitted: 'You can only report notes you can currently access.',
  self_report_forbidden: 'You cannot report your own note.',
  unauthenticated: 'Your session expired. Sign in and try again.',
}

export async function submitNoteReportAction(
  input: unknown,
): Promise<NoteReportResult> {
  const parsed = reportSchema.safeParse(input)

  if (!parsed.success) {
    return { error: 'Choose a report reason and try again.', ok: false }
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims) {
    return { error: REPORT_ERROR_MESSAGES.unauthenticated, ok: false }
  }

  const { data, error } = await supabase.rpc('report_note', {
    p_category: parsed.data.category,
    p_details: parsed.data.details || undefined,
    p_note_id: parsed.data.noteId,
  })
  const result = data?.[0]

  if (error || !result || !result.success) {
    const errorCode =
      !error && result && typeof result.error_code === 'string'
        ? result.error_code
        : ''
    return {
      error:
        REPORT_ERROR_MESSAGES[errorCode] ||
        'Your report could not be submitted right now. Please try again.',
      ok: false,
    }
  }

  revalidatePath(`/dashboard/notes/${parsed.data.noteId}`)
  revalidatePath('/dashboard/moderation')
  return { ok: true }
}

export async function submitNoteRatingAction(
  input: unknown,
): Promise<NoteRatingResult> {
  const parsed = ratingSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: 'Choose a rating between one and five stars.',
      ok: false,
    }
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims) {
    return {
      error: RATING_ERROR_MESSAGES.unauthenticated,
      ok: false,
    }
  }

  const { data, error } = await supabase.rpc('rate_note', {
    p_note_id: parsed.data.noteId,
    p_rating: parsed.data.rating,
  })

  const result = data?.[0]

  if (error || !result || !result.success) {
    const errorCode =
      !error && result && typeof result.error_code === 'string'
        ? result.error_code
        : ''

    return {
      error:
        RATING_ERROR_MESSAGES[errorCode] ??
        'Your rating could not be saved right now. Please try again.',
      ok: false,
    }
  }

  revalidatePath(`/dashboard/notes/${parsed.data.noteId}`)

  return {
    averageRating:
      result.average_rating === null || result.average_rating === undefined
        ? null
        : Number(result.average_rating),
    ok: true,
    ratingCount: Number(result.rating_count ?? 0),
  }
}
