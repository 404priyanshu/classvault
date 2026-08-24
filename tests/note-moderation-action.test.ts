import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock, revalidatePathMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}))

import { submitNoteReportAction } from '@/app/dashboard/notes/[noteId]/actions'

const NOTE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

function supabaseWithRpc(result: { data: unknown; error: unknown }) {
  createClientMock.mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({ data: { claims: { sub: 'student-id' } } }),
    },
    rpc: vi.fn().mockResolvedValue(result),
  })
}

describe('submitNoteReportAction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects malformed reports before creating a client', async () => {
    const result = await submitNoteReportAction({
      category: 'not-a-category',
      details: '',
      noteId: NOTE_ID,
    })

    expect(result).toMatchObject({ ok: false })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('requires an authenticated reporter', async () => {
    createClientMock.mockResolvedValue({
      auth: { getClaims: vi.fn().mockResolvedValue({ data: {} }) },
      rpc: vi.fn(),
    })

    await expect(
      submitNoteReportAction({ category: 'spam', details: '', noteId: NOTE_ID }),
    ).resolves.toEqual({
      error: 'Your session expired. Sign in and try again.',
      ok: false,
    })
  })

  it('maps duplicate and self-report guards', async () => {
    supabaseWithRpc({
      data: [{ error_code: 'already_reported', success: false }],
      error: null,
    })
    await expect(
      submitNoteReportAction({ category: 'spam', details: '', noteId: NOTE_ID }),
    ).resolves.toEqual({
      error: 'You already have an open report for this note.',
      ok: false,
    })

    supabaseWithRpc({
      data: [{ error_code: 'self_report_forbidden', success: false }],
      error: null,
    })
    await expect(
      submitNoteReportAction({ category: 'spam', details: '', noteId: NOTE_ID }),
    ).resolves.toEqual({
      error: 'You cannot report your own note.',
      ok: false,
    })
  })

  it('returns success and revalidates note and moderation surfaces', async () => {
    supabaseWithRpc({ data: [{ report_id: 'report-id', success: true }], error: null })

    await expect(
      submitNoteReportAction({
        category: 'wrong_scope',
        details: 'This appears to be scoped to the wrong campus.',
        noteId: NOTE_ID,
      }),
    ).resolves.toEqual({ ok: true })

    expect(revalidatePathMock).toHaveBeenCalledWith(`/dashboard/notes/${NOTE_ID}`)
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard/moderation')
  })
})
