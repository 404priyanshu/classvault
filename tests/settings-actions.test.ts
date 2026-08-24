import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock, revalidatePathMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: createClientMock }))
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }))

import * as settingsActions from '@/app/dashboard/settings/actions'
import { initialSettingsActionState } from '@/lib/settings/action-state'

const OWNER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

function validProfileForm() {
  const formData = new FormData()
  formData.set('displayName', 'A Student')
  formData.set('course', 'B.Tech')
  formData.set('graduationYear', '2029')
  return formData
}

function authenticatedClient() {
  const eq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn().mockReturnValue({ eq })
  const tableFrom = vi.fn().mockReturnValue({ update })
  const upload = vi.fn().mockResolvedValue({ error: null })
  const remove = vi.fn().mockResolvedValue({ error: null })
  const getPublicUrl = vi.fn().mockReturnValue({
    data: { publicUrl: 'https://project.supabase.co/storage/v1/object/public/profile-avatars/owner/avatar' },
  })
  const storageFrom = vi.fn().mockReturnValue({ getPublicUrl, remove, upload })
  const updateUser = vi.fn().mockResolvedValue({ error: null })

  createClientMock.mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: { claims: { sub: OWNER_ID } },
      }),
      updateUser,
    },
    from: tableFrom,
    storage: { from: storageFrom },
  })

  return { eq, getPublicUrl, remove, storageFrom, tableFrom, update, updateUser, upload }
}

describe('settings server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the use-server module limited to function exports', () => {
    expect(
      Object.values(settingsActions).every(
        (exportedValue) => typeof exportedValue === 'function',
      ),
    ).toBe(true)
  })

  it('rejects malformed profile details before creating a client', async () => {
    await expect(
      settingsActions.updateProfileSettingsAction(
        initialSettingsActionState,
        new FormData(),
      ),
    ).resolves.toMatchObject({ kind: 'error' })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('updates only the authenticated owner profile', async () => {
    const { eq, update } = authenticatedClient()

    await expect(
      settingsActions.updateProfileSettingsAction(
        initialSettingsActionState,
        validProfileForm(),
      ),
    ).resolves.toEqual({ kind: 'success', message: 'Profile details saved.' })
    expect(update).toHaveBeenCalledWith({
      course: 'B.Tech',
      display_name: 'A Student',
      graduation_year: 2029,
    })
    expect(eq).toHaveBeenCalledWith('id', OWNER_ID)
  })

  it('updates validated study preferences', async () => {
    const { update } = authenticatedClient()
    const formData = new FormData()
    formData.set('primaryGoal', 'placement_prep')
    formData.set('studyPreference', 'study_group')

    await expect(
      settingsActions.updateStudyPreferencesAction(
        initialSettingsActionState,
        formData,
      ),
    ).resolves.toMatchObject({ kind: 'success' })
    expect(update).toHaveBeenCalledWith({
      primary_goal: 'placement_prep',
      study_preference: 'study_group',
    })
  })

  it('rejects an avatar whose bytes are not a supported image', async () => {
    const formData = new FormData()
    formData.set(
      'avatar',
      new File(['<svg><script /></svg>'], 'avatar.png', { type: 'image/png' }),
    )

    await expect(
      settingsActions.updateAvatarAction(initialSettingsActionState, formData),
    ).resolves.toEqual({
      kind: 'error',
      message: 'Choose a valid JPG, PNG, or WebP image.',
    })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('uploads a signature-verified avatar to the exact owner object', async () => {
    const { storageFrom, update, upload } = authenticatedClient()
    const formData = new FormData()
    formData.set(
      'avatar',
      new File(
        [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
        'avatar.png',
        { type: 'image/png' },
      ),
    )

    await expect(
      settingsActions.updateAvatarAction(initialSettingsActionState, formData),
    ).resolves.toEqual({ kind: 'success', message: 'Profile photo updated.' })
    expect(storageFrom).toHaveBeenCalledWith('profile-avatars')
    expect(upload).toHaveBeenCalledWith(
      `${OWNER_ID}/avatar`,
      expect.any(File),
      expect.objectContaining({ contentType: 'image/png', upsert: true }),
    )
    expect(update).toHaveBeenCalledWith({
      avatar_url: expect.stringContaining('/profile-avatars/owner/avatar?v='),
    })
  })

  it('removes only the authenticated owner avatar', async () => {
    const { remove, update } = authenticatedClient()

    await expect(
      settingsActions.removeAvatarAction(
        initialSettingsActionState,
        new FormData(),
      ),
    ).resolves.toEqual({ kind: 'success', message: 'Profile photo removed.' })
    expect(remove).toHaveBeenCalledWith([`${OWNER_ID}/avatar`])
    expect(update).toHaveBeenCalledWith({ avatar_url: null })
  })

  it('validates matching passwords before updating Auth', async () => {
    const { updateUser } = authenticatedClient()
    const formData = new FormData()
    formData.set('password', 'a-secure-password')
    formData.set('passwordConfirmation', 'a-secure-password')

    await expect(
      settingsActions.updateSettingsPasswordAction(
        initialSettingsActionState,
        formData,
      ),
    ).resolves.toEqual({ kind: 'success', message: 'Password updated.' })
    expect(updateUser).toHaveBeenCalledWith({ password: 'a-secure-password' })
  })
})
