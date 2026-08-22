'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const noteIdSchema = z.string().uuid()

function readNoteId(formData: FormData) {
  const parsed = noteIdSchema.safeParse(formData.get('noteId'))
  return parsed.success ? parsed.data : null
}

function lifecycleError(message: string) {
  return `/dashboard/vault?status=${encodeURIComponent(message)}`
}

export async function deleteNoteAction(formData: FormData) {
  const noteId = readNoteId(formData)

  if (!noteId) {
    redirect(lifecycleError('That note could not be found.'))
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims) {
    redirect('/auth/sign-in?next=/dashboard/vault')
  }

  const { error } = await supabase.rpc('delete_note', { p_note_id: noteId })

  if (error) {
    redirect(lifecycleError('That note could not be moved to Trash.'))
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/notes')
  revalidatePath('/dashboard/vault')
  revalidatePath(`/dashboard/notes/${noteId}`)
  redirect('/dashboard/vault?status=deleted')
}

export async function restoreNoteAction(formData: FormData) {
  const noteId = readNoteId(formData)

  if (!noteId) {
    redirect('/dashboard/vault?view=trash&status=That%20note%20could%20not%20be%20found.')
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims) {
    redirect('/auth/sign-in?next=/dashboard/vault?view=trash')
  }

  const { data, error } = await supabase.rpc('restore_note', {
    p_note_id: noteId,
  })
  const result = data?.[0]

  if (error || !result?.success) {
    const message =
      result?.error_code === 'recovery_expired'
        ? 'This note has passed its 30-day recovery window.'
        : result?.error_code === 'moderation_blocked'
          ? 'This note cannot be restored while it is under moderation.'
          : 'That note could not be restored.'
    redirect(
      `/dashboard/vault?view=trash&status=${encodeURIComponent(message)}`,
    )
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/notes')
  revalidatePath('/dashboard/vault')
  redirect('/dashboard/vault?view=trash&status=restored')
}
