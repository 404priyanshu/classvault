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
