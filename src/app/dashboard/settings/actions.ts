'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { NOTE_FILE_BUCKET } from '@/lib/notes/storage/contracts'
import { detectNoteFileMimeType } from '@/lib/notes/storage/file-signature'
import type { SettingsActionState } from '@/lib/settings/action-state'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const profileSchema = z.object({
  course: z.enum(['MCA', 'BCA', 'B.Tech', 'M.Tech']),
  displayName: z.string().trim().min(2).max(80),
  graduationYear: z.coerce.number().int().min(2000).max(2100),
})

const preferenceSchema = z.object({
  primaryGoal: z.enum([
    'ace_exams',
    'stay_consistent',
    'master_subjects',
    'placement_prep',
  ]),
  studyPreference: z.enum(['solo', 'accountability', 'study_group']),
})

const passwordSchema = z.string().min(8).max(72)
const AVATAR_BUCKET = 'profile-avatars'
const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const avatarMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

function readString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

async function authenticatedSettingsClient() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const ownerId = z.string().uuid().safeParse(data?.claims?.sub)
  return ownerId.success ? { ownerId: ownerId.data, supabase } : null
}

function refreshSettings() {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
}

export async function updateProfileSettingsAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = profileSchema.safeParse({
    course: readString(formData, 'course'),
    displayName: readString(formData, 'displayName'),
    graduationYear: readString(formData, 'graduationYear'),
  })

  if (!parsed.success) {
    return {
      kind: 'error',
      message: 'Check your display name, degree, and graduation year.',
    }
  }

  const authenticated = await authenticatedSettingsClient()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in again.' }
  }

  const { error } = await authenticated.supabase
    .from('profiles')
    .update({
      course: parsed.data.course,
      display_name: parsed.data.displayName,
      graduation_year: parsed.data.graduationYear,
    })
    .eq('id', authenticated.ownerId)

  if (error) {
    return { kind: 'error', message: 'Your profile could not be updated.' }
  }

  refreshSettings()
  return { kind: 'success', message: 'Profile details saved.' }
}

export async function updateStudyPreferencesAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = preferenceSchema.safeParse({
    primaryGoal: readString(formData, 'primaryGoal'),
    studyPreference: readString(formData, 'studyPreference'),
  })

  if (!parsed.success) {
    return { kind: 'error', message: 'Choose a valid goal and study style.' }
  }

  const authenticated = await authenticatedSettingsClient()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in again.' }
  }

  const { error } = await authenticated.supabase
    .from('profiles')
    .update({
      primary_goal: parsed.data.primaryGoal,
      study_preference: parsed.data.studyPreference,
    })
    .eq('id', authenticated.ownerId)

  if (error) {
    return { kind: 'error', message: 'Your study preferences could not be updated.' }
  }

  refreshSettings()
  return { kind: 'success', message: 'Study preferences saved.' }
}

export async function updateAvatarAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const avatar = formData.get('avatar')
  if (!(avatar instanceof File) || avatar.size < 1) {
    return { kind: 'error', message: 'Choose a JPG, PNG, or WebP image.' }
  }
  if (avatar.size > AVATAR_MAX_BYTES) {
    return { kind: 'error', message: 'Profile photos must be 2 MiB or smaller.' }
  }

  const bytes = new Uint8Array(await avatar.arrayBuffer())
  const detectedMimeType = detectNoteFileMimeType(bytes)
  if (!detectedMimeType || !avatarMimeTypes.has(detectedMimeType)) {
    return { kind: 'error', message: 'Choose a valid JPG, PNG, or WebP image.' }
  }

  const authenticated = await authenticatedSettingsClient()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in again.' }
  }

  const objectKey = `${authenticated.ownerId}/avatar`
  const { error: uploadError } = await authenticated.supabase.storage
    .from(AVATAR_BUCKET)
    .upload(objectKey, avatar, {
      cacheControl: '3600',
      contentType: detectedMimeType,
      upsert: true,
    })

  if (uploadError) {
    return { kind: 'error', message: 'Your profile photo could not be uploaded.' }
  }

  const { data: publicUrlData } = authenticated.supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(objectKey)
  const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`
  const { error: profileError } = await authenticated.supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', authenticated.ownerId)

  if (profileError) {
    return { kind: 'error', message: 'The photo uploaded, but your profile could not be updated.' }
  }

  refreshSettings()
  return { kind: 'success', message: 'Profile photo updated.' }
}

export async function removeAvatarAction(
  _previousState: SettingsActionState,
  _formData: FormData,
): Promise<SettingsActionState> {
  void _previousState
  void _formData
  const authenticated = await authenticatedSettingsClient()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in again.' }
  }

  const objectKey = `${authenticated.ownerId}/avatar`
  const { error: storageError } = await authenticated.supabase.storage
    .from(AVATAR_BUCKET)
    .remove([objectKey])

  if (storageError) {
    return { kind: 'error', message: 'Your profile photo could not be removed.' }
  }

  const { error: profileError } = await authenticated.supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', authenticated.ownerId)

  if (profileError) {
    return { kind: 'error', message: 'Your profile photo could not be cleared.' }
  }

  refreshSettings()
  return { kind: 'success', message: 'Profile photo removed.' }
}

export async function updateSettingsPasswordAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const password = passwordSchema.safeParse(readString(formData, 'password'))
  const confirmation = readString(formData, 'passwordConfirmation')

  if (!password.success || password.data !== confirmation) {
    return {
      kind: 'error',
      message: 'Passwords must match and contain between 8 and 72 characters.',
    }
  }

  const authenticated = await authenticatedSettingsClient()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in again.' }
  }

  const { error } = await authenticated.supabase.auth.updateUser({
    password: password.data,
  })

  if (error) {
    return {
      kind: 'error',
      message: 'Your password could not be updated. You may need to sign in again first.',
    }
  }

  return { kind: 'success', message: 'Password updated.' }
}

const DELETE_CONFIRMATION = 'DELETE'

/**
 * Closes the student's account for good.
 *
 * Four steps that have to happen in this order. The object keys are read while
 * the note rows still exist, because once the rows are gone nothing records
 * where the files were. The rows go next, in one transaction, so the choice
 * between taking uploads along and leaving them is all-or-nothing. Only then
 * are the files removed, and last the auth user, whose deletion is what
 * cascades the profile, membership, ratings, reports, roadmaps and room
 * memberships away.
 *
 * A file that fails to delete is logged and does not stop the close. An
 * unreferenced object costs a little storage; a half-closed account leaves
 * someone signed in to a profile they asked to be rid of.
 */
export async function deleteAccountAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  if (readString(formData, 'confirmation').trim() !== DELETE_CONFIRMATION) {
    return {
      kind: 'error',
      message: `Type ${DELETE_CONFIRMATION} to confirm you want the account closed.`,
    }
  }

  const keepPublished = readString(formData, 'uploads') === 'keep'

  const authenticated = await authenticatedSettingsClient()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in again.' }
  }

  const { data: keyRows, error: keyError } = await authenticated.supabase.rpc(
    'list_account_deletion_object_keys',
    { p_keep_published: keepPublished },
  )

  if (keyError) {
    return { kind: 'error', message: 'Your account could not be closed.' }
  }

  const { error: closeError } = await authenticated.supabase.rpc(
    'close_own_account',
    { p_keep_published: keepPublished },
  )

  if (closeError) {
    return {
      kind: 'error',
      message:
        closeError.code === '42501'
          ? 'Accounts that carry moderation history are closed by support. Email us from this address.'
          : 'Your account could not be closed.',
    }
  }

  const admin = createAdminClient()
  const objectKeys = (keyRows || []).flatMap((row) =>
    [row.object_key, row.preview_object_key].filter(
      (key): key is string => Boolean(key),
    ),
  )

  if (objectKeys.length > 0) {
    const { error: storageError } = await admin.storage
      .from(NOTE_FILE_BUCKET)
      .remove(objectKeys)

    if (storageError) {
      console.error('account close left note files behind', storageError)
    }
  }

  const { error: avatarError } = await admin.storage
    .from(AVATAR_BUCKET)
    .remove([`${authenticated.ownerId}/avatar`])

  if (avatarError) {
    console.error('account close left an avatar behind', avatarError)
  }

  const { error: userError } = await admin.auth.admin.deleteUser(
    authenticated.ownerId,
  )

  if (userError) {
    return {
      kind: 'error',
      message:
        'Your notes were removed but the account itself could not be closed. Contact support.',
    }
  }

  await authenticated.supabase.auth.signOut()
  redirect('/?status=account-closed')
}
