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

import { submitNoteRatingAction } from '@/app/dashboard/notes/[noteId]/actions'

const NOTE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

function supabaseWithRpc(rpcResult: {
  data: unknown
  error: unknown
}) {
  return createClientMock.mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: { claims: { sub: 'student-id' } },
      }),
    },
    rpc: vi.fn().mockResolvedValue(rpcResult),
  })
}

describe('submitNoteRatingAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects out-of-range ratings without contacting Supabase', async () => {
    const result = await submitNoteRatingAction({ noteId: NOTE_ID, rating: 6 })

    expect(result).toMatchObject({ ok: false })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('rejects malformed note ids without contacting Supabase', async () => {
    const result = await submitNoteRatingAction({ noteId: 'not-a-uuid', rating: 4 })

    expect(result).toMatchObject({ ok: false })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('requires a signed-in rater', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({ data: {} }),
      },
      rpc: vi.fn(),
    })

    const result = await submitNoteRatingAction({ noteId: NOTE_ID, rating: 4 })

    expect(result).toMatchObject({
      error: 'Your session expired. Sign in and try again.',
      ok: false,
    })
  })

  it('maps the self-rating guard to a friendly message', async () => {
    supabaseWithRpc({
      data: [
        {
          success: false,
          error_code: 'self_rating_forbidden',
        },
      ],
      error: null,
    })

    const result = await submitNoteRatingAction({ noteId: NOTE_ID, rating: 5 })

    expect(result).toMatchObject({
      error: 'You cannot rate your own note.',
      ok: false,
    })
  })

  it('maps lost note access to a friendly message', async () => {
    supabaseWithRpc({
      data: [
        {
          success: false,
          error_code: 'not_permitted',
        },
      ],
      error: null,
    })

    const result = await submitNoteRatingAction({ noteId: NOTE_ID, rating: 5 })

    expect(result).toMatchObject({
      error: 'You need access to this note before you can rate it.',
      ok: false,
    })
  })

  it('returns refreshed summary values and revalidates the page', async () => {
    supabaseWithRpc({
      data: [
        {
          average_rating: '4.50',
          error_code: null,
          rating_count: 2,
          success: true,
          weighted_score: '3.9667',
        },
      ],
      error: null,
    })

    const result = await submitNoteRatingAction({ noteId: NOTE_ID, rating: 4 })

    expect(result).toEqual({
      averageRating: 4.5,
      ok: true,
      ratingCount: 2,
    })
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/dashboard/notes/${NOTE_ID}`,
    )
  })

  it('surfaces transport failures as a retryable error', async () => {
    supabaseWithRpc({ data: null, error: { message: 'network down' } })

    const result = await submitNoteRatingAction({ noteId: NOTE_ID, rating: 3 })

    expect(result).toMatchObject({ ok: false })
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })
})
