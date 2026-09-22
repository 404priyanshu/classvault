'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const moderationSchema = z.object({
  action: z.enum([
    'start_review',
    'clear_review',
    'restrict',
    'restore',
    'remove',
    'hold',
    'release_hold',
  ]),
  noteId: z.string().uuid(),
  reasonCode: z.string().trim().min(2).max(80),
  safeOwnerMessage: z.string().trim().max(1000).optional(),
})

const suspendSchema = z.object({
  noteId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
})

const restoreSchema = z.object({
  reason: z.string().trim().min(1).max(500),
  userId: z.string().uuid(),
})

function moderationRedirect(message: string) {
  return `/dashboard/moderation?status=${encodeURIComponent(message)}`
}

export async function moderateNoteAction(formData: FormData) {
  const parsed = moderationSchema.safeParse({
    action: formData.get('action'),
    noteId: formData.get('noteId'),
    reasonCode: formData.get('reasonCode'),
    safeOwnerMessage: formData.get('safeOwnerMessage') || undefined,
  })

  if (!parsed.success) redirect(moderationRedirect('Check the moderation fields and try again.'))

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) redirect('/auth/sign-in?next=/dashboard/moderation')

  const { data, error } = await supabase.rpc('moderate_note', {
    p_action: parsed.data.action,
    p_note_id: parsed.data.noteId,
    p_reason_code: parsed.data.reasonCode,
    p_safe_owner_message: parsed.data.safeOwnerMessage || undefined,
  })
  const result = data?.[0]

  if (error || !result?.success) {
    const message =
      result?.error_code === 'not_permitted'
        ? 'You do not have permission to moderate this note.'
        : result?.error_code === 'invalid_transition'
          ? 'That moderation action is no longer valid for this note.'
          : 'The moderation action could not be saved.'
    redirect(moderationRedirect(message))
  }

  revalidatePath('/dashboard/moderation')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/notes')
  revalidatePath(`/dashboard/notes/${parsed.data.noteId}`)
  revalidatePath('/dashboard/vault')
  redirect(moderationRedirect('Moderation action saved.'))
}

/**
 * Suspends the uploader of a reported note.
 *
 * Addressed by note rather than by student: the queue shows a pseudonymous
 * owner label and no id, and `suspend_note_owner` resolves the owner itself.
 * The database refuses anyone who is not a platform administrator, so the only
 * check here is that the form was well formed.
 */
export async function suspendNoteOwnerAction(formData: FormData) {
  const parsed = suspendSchema.safeParse({
    noteId: formData.get('noteId'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) {
    redirect(moderationRedirect('A suspension needs a reason of up to 500 characters.'))
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) redirect('/auth/sign-in?next=/dashboard/moderation')

  const { data, error } = await supabase.rpc('suspend_note_owner', {
    p_note_id: parsed.data.noteId,
    p_reason: parsed.data.reason,
  })

  if (error || !data) {
    redirect(moderationRedirect('That account could not be suspended.'))
  }

  revalidatePath('/dashboard/moderation')
  redirect(moderationRedirect('Account suspended.'))
}

/** Lifts a suspension from the administrator's list of suspended accounts. */
export async function restoreAccountAction(formData: FormData) {
  const parsed = restoreSchema.safeParse({
    reason: formData.get('reason'),
    userId: formData.get('userId'),
  })
  if (!parsed.success) {
    redirect(moderationRedirect('Lifting a suspension needs a reason.'))
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) redirect('/auth/sign-in?next=/dashboard/moderation')

  const { data, error } = await supabase.rpc('set_account_suspension', {
    p_reason: parsed.data.reason,
    p_suspended: false,
    p_user_id: parsed.data.userId,
  })

  if (error || !data) {
    redirect(moderationRedirect('That suspension could not be lifted.'))
  }

  revalidatePath('/dashboard/moderation')
  redirect(moderationRedirect('Suspension lifted.'))
}

const roomReportSchema = z.object({
  reportId: z.string().uuid(),
  reviewNote: z.string().trim().max(1000),
  status: z.enum(['reviewing', 'closed']),
})

const suspendReportedSchema = z.object({
  reason: z.string().trim().min(1).max(500),
  reportId: z.string().uuid(),
})

/**
 * Takes a study-room report under review, or closes it.
 *
 * Closing requires a note in the database as well as here, because closing is
 * how a report leaves the queue: without one, the next reviewer cannot tell a
 * decision from a dismissal.
 */
export async function reviewStudyRoomReportAction(formData: FormData) {
  const parsed = roomReportSchema.safeParse({
    reportId: formData.get('reportId'),
    reviewNote: formData.get('reviewNote') ?? '',
    status: formData.get('status'),
  })
  if (!parsed.success) {
    redirect(moderationRedirect('Check the review fields and try again.'))
  }
  if (parsed.data.status === 'closed' && parsed.data.reviewNote === '') {
    redirect(moderationRedirect('Closing a report needs a note saying what was decided.'))
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) redirect('/auth/sign-in?next=/dashboard/moderation')

  const { data, error } = await supabase.rpc('set_study_room_report_status', {
    p_report_id: parsed.data.reportId,
    p_review_note: parsed.data.reviewNote,
    p_status: parsed.data.status,
  })

  if (error || !data) {
    redirect(moderationRedirect('That report could not be updated.'))
  }

  revalidatePath('/dashboard/moderation')
  redirect(
    moderationRedirect(
      parsed.data.status === 'closed' ? 'Report closed.' : 'Report under review.',
    ),
  )
}

/**
 * Suspends the participant a study-room report names.
 *
 * Addressed by report rather than by student, for the same reason
 * `suspendNoteOwnerAction` is addressed by note: the queue shows a label and no
 * id, and the database resolves the account itself.
 */
export async function suspendReportedParticipantAction(formData: FormData) {
  const parsed = suspendReportedSchema.safeParse({
    reason: formData.get('reason'),
    reportId: formData.get('reportId'),
  })
  if (!parsed.success) {
    redirect(moderationRedirect('A suspension needs a reason of up to 500 characters.'))
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) redirect('/auth/sign-in?next=/dashboard/moderation')

  const { data, error } = await supabase.rpc('suspend_study_room_reported_user', {
    p_reason: parsed.data.reason,
    p_report_id: parsed.data.reportId,
  })

  if (error || !data) {
    redirect(moderationRedirect('That account could not be suspended.'))
  }

  revalidatePath('/dashboard/moderation')
  redirect(moderationRedirect('Account suspended.'))
}
