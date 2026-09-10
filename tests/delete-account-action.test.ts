import { beforeEach, describe, expect, it, vi } from 'vitest'

// The action reaches the admin client, which is server-only.
vi.mock('server-only', () => ({}))

const {
  createAdminClientMock,
  createClientMock,
  redirectMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  createClientMock: vi.fn(),
  redirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
  revalidatePathMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: createClientMock }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }))
vi.mock('next/navigation', () => ({ redirect: redirectMock }))

import { deleteAccountAction } from '@/app/dashboard/settings/actions'
import { initialSettingsActionState } from '@/lib/settings/action-state'

const OWNER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

function form({
  confirmation = 'DELETE',
  uploads = 'remove',
}: { confirmation?: string; uploads?: string } = {}) {
  const formData = new FormData()
  formData.set('confirmation', confirmation)
  formData.set('uploads', uploads)
  return formData
}

function signedIn({
  closeError = null,
  keyRows = [] as { object_key: string; preview_object_key: string | null }[],
}: {
  closeError?: { code: string } | null
  keyRows?: { object_key: string; preview_object_key: string | null }[]
} = {}) {
  const rpc = vi.fn(async (name: string) => {
    if (name === 'list_account_deletion_object_keys') {
      return { data: keyRows, error: null }
    }
    return { data: null, error: closeError }
  })
  const signOut = vi.fn().mockResolvedValue({ error: null })

  createClientMock.mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: { claims: { sub: OWNER_ID } },
      }),
      signOut,
    },
    rpc,
  })

  const remove = vi.fn().mockResolvedValue({ error: null })
  const deleteUser = vi.fn().mockResolvedValue({ error: null })
  createAdminClientMock.mockReturnValue({
    auth: { admin: { deleteUser } },
    storage: { from: vi.fn().mockReturnValue({ remove }) },
  })

  return { deleteUser, remove, rpc, signOut }
}

describe('closing an account', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refuses without the typed confirmation', async () => {
    const client = signedIn()

    const state = await deleteAccountAction(
      initialSettingsActionState,
      form({ confirmation: 'delete my account' }),
    )

    expect(state.kind).toBe('error')
    // Nothing may be touched before the words match exactly.
    expect(client.rpc).not.toHaveBeenCalled()
    expect(client.deleteUser).not.toHaveBeenCalled()
  })

  it('reads the file list before the rows that name the files are deleted', async () => {
    const client = signedIn({
      keyRows: [{ object_key: 'notes/a/source/b', preview_object_key: null }],
    })

    await expect(
      deleteAccountAction(initialSettingsActionState, form()),
    ).rejects.toThrow('NEXT_REDIRECT')

    const calls = client.rpc.mock.calls.map(([name]) => name)
    expect(calls).toEqual([
      'list_account_deletion_object_keys',
      'close_own_account',
    ])
  })

  it('carries the keep-my-published-notes choice through to the database', async () => {
    const client = signedIn()

    await expect(
      deleteAccountAction(initialSettingsActionState, form({ uploads: 'keep' })),
    ).rejects.toThrow('NEXT_REDIRECT')

    expect(client.rpc).toHaveBeenCalledWith('close_own_account', {
      p_keep_published: true,
    })
  })

  it('treats any other answer as take my uploads with me', async () => {
    const client = signedIn()

    await expect(
      deleteAccountAction(initialSettingsActionState, form()),
    ).rejects.toThrow('NEXT_REDIRECT')

    expect(client.rpc).toHaveBeenCalledWith('close_own_account', {
      p_keep_published: false,
    })
  })

  it('deletes the auth user last, and signs the student out', async () => {
    const client = signedIn()

    await expect(
      deleteAccountAction(initialSettingsActionState, form()),
    ).rejects.toThrow('NEXT_REDIRECT')

    expect(client.deleteUser).toHaveBeenCalledWith(OWNER_ID)
    expect(client.signOut).toHaveBeenCalled()
    expect(redirectMock).toHaveBeenCalledWith('/?status=account-closed')
  })

  it('explains itself when the account carries moderation history', async () => {
    // note_moderation_actions.actor_id is `on delete restrict` on purpose, so
    // these accounts are refused rather than allowed to blank an audit trail.
    const client = signedIn({ closeError: { code: '42501' } })

    const state = await deleteAccountAction(
      initialSettingsActionState,
      form(),
    )

    expect(state.kind).toBe('error')
    expect(state.message).toMatch(/moderation history/i)
    expect(client.deleteUser).not.toHaveBeenCalled()
  })

  it('does not close the account when the session has expired', async () => {
    createClientMock.mockResolvedValue({
      auth: { getClaims: vi.fn().mockResolvedValue({ data: null }) },
    })

    const state = await deleteAccountAction(initialSettingsActionState, form())

    expect(state.kind).toBe('error')
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })
})
