'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { StudyRoomActionState } from '@/lib/study-rooms/action-state'
import { createClient } from '@/lib/supabase/server'
import { recordUsageEvent } from '@/lib/usage'

const roomIdSchema = z.string().uuid()
const createRoomSchema = z.object({
  breakMinutes: z.coerce.number().int().min(1).max(20),
  focusMinutes: z.coerce.number().int().min(5).max(60),
  name: z.string().trim().min(3).max(80),
  subjectTag: z.string().trim().min(2).max(60),
  visibility: z.enum(['public', 'university']),
})
const timerSchema = z.object({
  action: z.enum(['start', 'pause', 'reset', 'skip']),
  revision: z.coerce.number().int().nonnegative(),
  roomId: roomIdSchema,
})
const messageSchema = z.object({
  body: z.string().trim().min(1).max(1000),
  roomId: roomIdSchema,
})
const roleSchema = z.object({
  role: z.enum(['cohost', 'member']),
  roomId: roomIdSchema,
  userId: z.string().uuid(),
})

// The three abuse controls from ADR 0030. Each carries a reason because the
// database refuses without one: a moderation action nobody has to justify is
// the kind that gets used casually.
const moderationSchema = z.object({
  reason: z.string().trim().min(1).max(500),
  roomId: roomIdSchema,
  userId: z.string().uuid(),
})
const muteSchema = moderationSchema.extend({
  muted: z.enum(['true', 'false']),
})
const reportSchema = z.object({
  category: z.enum([
    'harassment',
    'spam',
    'hate_speech',
    'sexual_content',
    'other',
  ]),
  details: z.string().trim().max(1000),
  // Capped here as well as in the database, so a hand-built post cannot ask a
  // reviewer to read a hundred messages.
  messageIds: z.array(z.coerce.number().int().positive()).max(10),
  roomId: roomIdSchema,
  userId: z.string().uuid(),
})

async function authenticatedRoomClient() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const ownerId = z.string().uuid().safeParse(data?.claims?.sub)
  return ownerId.success ? { ownerId: ownerId.data, supabase } : null
}

function mapRoomError(message: string | undefined) {
  const normalized = message?.toLowerCase() || ''
  if (normalized.includes('full')) return 'That study room is already full.'
  if (normalized.includes('verified university')) {
    return 'Verified university membership is required for campus rooms.'
  }
  if (normalized.includes('timer state changed')) {
    return 'The timer changed in another session. Try the control again.'
  }
  if (normalized.includes('host controls')) {
    return 'Only the host or a co-host can control this timer.'
  }
  if (normalized.includes('active room membership')) {
    return 'Join the room before sending a message.'
  }
  if (normalized.includes('cannot post in this room')) {
    return 'A host muted you in this room, so you cannot post here.'
  }
  // Both caps are deliberately vague about the exact number: the limits are
  // configurable, so copy that quotes one would be wrong the moment it changes.
  if (normalized.includes('too many rooms created')) {
    return 'You have started several rooms just now. Wait a few minutes before opening another.'
  }
  if (normalized.includes('sending messages too quickly')) {
    return 'You are sending messages too quickly. Wait a moment and try again.'
  }
  if (normalized.includes('unavailable')) {
    return 'That study room is no longer available.'
  }
  return 'ClassVault could not update the study room.'
}

function refreshRoom(roomId?: string) {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/study-rooms')
  if (roomId) revalidatePath(`/dashboard/study-rooms/${roomId}`)
}

export async function createStudyRoomAction(
  _previousState: StudyRoomActionState,
  formData: FormData,
): Promise<StudyRoomActionState> {
  const parsed = createRoomSchema.safeParse({
    breakMinutes: formData.get('breakMinutes'),
    focusMinutes: formData.get('focusMinutes'),
    name: formData.get('name'),
    subjectTag: formData.get('subjectTag'),
    visibility: formData.get('visibility'),
  })

  if (!parsed.success) {
    return {
      kind: 'error',
      message: 'Check the room name, subject, access, and timer lengths.',
    }
  }

  const authenticated = await authenticatedRoomClient()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in again.' }
  }

  const { data: roomId, error } = await authenticated.supabase.rpc(
    'create_study_room',
    {
      p_break_minutes: parsed.data.breakMinutes,
      p_focus_minutes: parsed.data.focusMinutes,
      p_name: parsed.data.name,
      p_subject_tag: parsed.data.subjectTag,
      p_visibility: parsed.data.visibility,
    },
  )

  if (error || !roomId) {
    return { kind: 'error', message: mapRoomError(error?.message) }
  }

  // The host joins the room they open, so creating one counts as a join.
  recordUsageEvent(authenticated.supabase, { event: 'study_room_joined' })
  refreshRoom(roomId)
  redirect(`/dashboard/study-rooms/${roomId}`)
}

export async function joinStudyRoomAction(
  _previousState: StudyRoomActionState,
  formData: FormData,
): Promise<StudyRoomActionState> {
  const roomId = roomIdSchema.safeParse(formData.get('roomId'))
  if (!roomId.success) {
    return { kind: 'error', message: 'That study room could not be found.' }
  }

  const authenticated = await authenticatedRoomClient()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in again.' }
  }

  const { data: joined, error } = await authenticated.supabase.rpc(
    'join_study_room',
    { p_room_id: roomId.data },
  )

  if (error || !joined) {
    return { kind: 'error', message: mapRoomError(error?.message) }
  }

  recordUsageEvent(authenticated.supabase, { event: 'study_room_joined' })
  refreshRoom(roomId.data)
  redirect(`/dashboard/study-rooms/${roomId.data}`)
}

export async function leaveStudyRoomAction(formData: FormData) {
  const roomId = roomIdSchema.safeParse(formData.get('roomId'))
  if (!roomId.success) return

  const authenticated = await authenticatedRoomClient()
  if (!authenticated) redirect('/auth/sign-in?next=/dashboard/study-rooms')

  await authenticated.supabase.rpc('leave_study_room', {
    p_room_id: roomId.data,
  })
  refreshRoom(roomId.data)
  redirect('/dashboard/study-rooms?status=left')
}

export async function endStudyRoomAction(formData: FormData) {
  const roomId = roomIdSchema.safeParse(formData.get('roomId'))
  if (!roomId.success) return

  const authenticated = await authenticatedRoomClient()
  if (!authenticated) redirect('/auth/sign-in?next=/dashboard/study-rooms')

  const { data: ended } = await authenticated.supabase.rpc('end_study_room', {
    p_room_id: roomId.data,
  })
  if (!ended) return

  refreshRoom(roomId.data)
  redirect('/dashboard/study-rooms?status=ended')
}

export async function updateStudyRoomTimerAction(
  _previousState: StudyRoomActionState,
  formData: FormData,
): Promise<StudyRoomActionState> {
  const parsed = timerSchema.safeParse({
    action: formData.get('action'),
    revision: formData.get('revision'),
    roomId: formData.get('roomId'),
  })
  if (!parsed.success) {
    return { kind: 'error', message: 'That timer control is no longer valid.' }
  }

  const authenticated = await authenticatedRoomClient()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in again.' }
  }

  const { error } = await authenticated.supabase.rpc(
    'update_study_room_timer',
    {
      p_action: parsed.data.action,
      p_expected_revision: parsed.data.revision,
      p_room_id: parsed.data.roomId,
    },
  )

  if (error) {
    return { kind: 'error', message: mapRoomError(error.message) }
  }

  refreshRoom(parsed.data.roomId)
  return { kind: 'success', message: 'Timer synchronized.' }
}

export async function sendStudyRoomMessageAction(
  _previousState: StudyRoomActionState,
  formData: FormData,
): Promise<StudyRoomActionState> {
  const parsed = messageSchema.safeParse({
    body: formData.get('body'),
    roomId: formData.get('roomId'),
  })
  if (!parsed.success) {
    return { kind: 'error', message: 'Write a message before sending it.' }
  }

  const authenticated = await authenticatedRoomClient()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in again.' }
  }

  const { error } = await authenticated.supabase.rpc('send_study_room_message', {
    p_body: parsed.data.body,
    p_room_id: parsed.data.roomId,
  })

  if (error) {
    return { kind: 'error', message: mapRoomError(error.message) }
  }

  refreshRoom(parsed.data.roomId)
  return { kind: 'success', message: 'Message sent.' }
}

export async function setStudyRoomMemberRoleAction(formData: FormData) {
  const parsed = roleSchema.safeParse({
    role: formData.get('role'),
    roomId: formData.get('roomId'),
    userId: formData.get('userId'),
  })
  if (!parsed.success) return

  const authenticated = await authenticatedRoomClient()
  if (!authenticated) return

  await authenticated.supabase.rpc('set_study_room_member_role', {
    p_role: parsed.data.role,
    p_room_id: parsed.data.roomId,
    p_user_id: parsed.data.userId,
  })
  refreshRoom(parsed.data.roomId)
}

/**
 * Removes a participant from this room and blocks them rejoining it.
 *
 * The database refuses for several distinct reasons -- the target holds a
 * platform role, the target is the host, the caller lost control of the room --
 * and reports all of them as a plain `false`. That is deliberate, so the copy
 * here stays equally plain rather than inventing a reason it was not told.
 */
export async function removeStudyRoomMemberAction(
  _previousState: StudyRoomActionState,
  formData: FormData,
): Promise<StudyRoomActionState> {
  const parsed = moderationSchema.safeParse({
    reason: formData.get('reason'),
    roomId: formData.get('roomId'),
    userId: formData.get('userId'),
  })
  if (!parsed.success) {
    return { kind: 'error', message: 'Give a reason of up to 500 characters.' }
  }

  const authenticated = await authenticatedRoomClient()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in again.' }
  }

  const { data: removed, error } = await authenticated.supabase.rpc(
    'remove_study_room_member',
    {
      p_reason: parsed.data.reason,
      p_room_id: parsed.data.roomId,
      p_user_id: parsed.data.userId,
    },
  )

  if (error) return { kind: 'error', message: mapRoomError(error.message) }
  if (!removed) {
    return {
      kind: 'error',
      message: 'That participant cannot be removed from this room.',
    }
  }

  refreshRoom(parsed.data.roomId)
  return { kind: 'success', message: 'Removed from the room.' }
}

/** Withdraws or restores a participant's ability to post in this room. */
export async function setStudyRoomMuteAction(
  _previousState: StudyRoomActionState,
  formData: FormData,
): Promise<StudyRoomActionState> {
  const parsed = muteSchema.safeParse({
    muted: formData.get('muted'),
    reason: formData.get('reason'),
    roomId: formData.get('roomId'),
    userId: formData.get('userId'),
  })
  if (!parsed.success) {
    return { kind: 'error', message: 'Give a reason of up to 500 characters.' }
  }

  const muting = parsed.data.muted === 'true'
  const authenticated = await authenticatedRoomClient()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in again.' }
  }

  const { data: applied, error } = await authenticated.supabase.rpc(
    'set_study_room_mute',
    {
      p_muted: muting,
      p_reason: parsed.data.reason,
      p_room_id: parsed.data.roomId,
      p_user_id: parsed.data.userId,
    },
  )

  if (error) return { kind: 'error', message: mapRoomError(error.message) }
  if (!applied) {
    return {
      kind: 'error',
      message: muting
        ? 'That participant cannot be muted in this room.'
        : 'That mute could not be lifted.',
    }
  }

  refreshRoom(parsed.data.roomId)
  return {
    kind: 'success',
    message: muting ? 'Muted for this room.' : 'Mute lifted.',
  }
}

/**
 * Reports a participant to platform moderators, optionally citing messages.
 *
 * The cited messages are copied into the report as it is filed, because the
 * room's chat is deleted when the room ends -- see ADR 0030. Ids the reporter
 * cannot see are dropped by the database rather than rejected, so a report that
 * cites nothing still files.
 */
export async function reportStudyRoomParticipantAction(
  _previousState: StudyRoomActionState,
  formData: FormData,
): Promise<StudyRoomActionState> {
  const parsed = reportSchema.safeParse({
    category: formData.get('category'),
    details: formData.get('details') ?? '',
    messageIds: formData.getAll('messageIds'),
    roomId: formData.get('roomId'),
    userId: formData.get('userId'),
  })
  if (!parsed.success) {
    return {
      kind: 'error',
      message: 'Choose a reason, and cite at most ten messages.',
    }
  }

  const authenticated = await authenticatedRoomClient()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in again.' }
  }

  const { data: filed, error } = await authenticated.supabase.rpc(
    'report_study_room_participant',
    {
      p_category: parsed.data.category,
      p_details: parsed.data.details,
      p_message_ids: parsed.data.messageIds,
      p_room_id: parsed.data.roomId,
      p_user_id: parsed.data.userId,
    },
  )

  if (error) return { kind: 'error', message: mapRoomError(error.message) }
  if (!filed) {
    return { kind: 'error', message: 'That report could not be filed.' }
  }

  revalidatePath('/dashboard/moderation')
  return {
    kind: 'success',
    message: 'Sent to the platform moderators. Thank you.',
  }
}
