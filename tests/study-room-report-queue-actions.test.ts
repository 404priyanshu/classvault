import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock, redirectMock, revalidatePathMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  redirectMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: createClientMock }))
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }))
vi.mock('next/navigation', () => ({ redirect: redirectMock }))

import {
  reviewStudyRoomReportAction,
  suspendReportedParticipantAction,
} from '@/app/dashboard/moderation/actions'

const REPORT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'

// next/navigation's redirect throws to unwind the request, and these actions
// rely on that: a redirect is how they stop. A mock that returns would let
// execution fall through to the RPC, and the tests below would then be
// asserting on a code path the real runtime never takes.
function redirectsBy(url: string) {
  return `REDIRECT:${url}`
}

function moderatorClient(result: { data: unknown; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(result)
  createClientMock.mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({ data: { claims: { sub: 'moderator' } } }),
    },
    rpc,
  })
  return rpc
}

function reviewForm(status: string, reviewNote: string) {
  const formData = new FormData()
  formData.set('reportId', REPORT_ID)
  formData.set('reviewNote', reviewNote)
  formData.set('status', status)
  return formData
}

describe('study-room report queue actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    redirectMock.mockImplementation((url: string) => {
      throw new Error(redirectsBy(url))
    })
  })

  it('refuses to close a report with no account of what was decided', async () => {
    await expect(reviewStudyRoomReportAction(reviewForm('closed', '  '))).rejects.toThrow(
      /Closing%20a%20report%20needs%20a%20note/,
    )
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('refuses a status the workflow does not have', async () => {
    await expect(
      reviewStudyRoomReportAction(reviewForm('deleted', 'Getting rid of it')),
    ).rejects.toThrow(/Check%20the%20review%20fields/)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('takes a report under review without requiring a note', async () => {
    const rpc = moderatorClient({ data: true, error: null })

    await expect(reviewStudyRoomReportAction(reviewForm('reviewing', ''))).rejects.toThrow(
      /Report%20under%20review/,
    )
    expect(rpc).toHaveBeenCalledWith('set_study_room_report_status', {
      p_report_id: REPORT_ID,
      p_review_note: '',
      p_status: 'reviewing',
    })
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard/moderation')
  })

  it('reports a refused review rather than claiming it saved', async () => {
    moderatorClient({ data: false, error: null })

    await expect(
      reviewStudyRoomReportAction(reviewForm('closed', 'Nothing actionable')),
    ).rejects.toThrow(/could%20not%20be%20updated/)
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  // The queue shows a label and no id. If this action ever needs a user id,
  // that id has to appear in the queue first -- which is the thing the
  // suspend-by-report shape exists to avoid.
  it('suspends by report id, never by user id', async () => {
    const rpc = moderatorClient({ data: true, error: null })
    const formData = new FormData()
    formData.set('reason', 'Abusive in a study room')
    formData.set('reportId', REPORT_ID)

    await expect(suspendReportedParticipantAction(formData)).rejects.toThrow(
      /Account%20suspended/,
    )
    expect(rpc).toHaveBeenCalledWith('suspend_study_room_reported_user', {
      p_reason: 'Abusive in a study room',
      p_report_id: REPORT_ID,
    })
  })

  it('refuses a suspension with no reason', async () => {
    const formData = new FormData()
    formData.set('reason', '   ')
    formData.set('reportId', REPORT_ID)

    await expect(suspendReportedParticipantAction(formData)).rejects.toThrow(
      /suspension%20needs%20a%20reason/,
    )
    expect(createClientMock).not.toHaveBeenCalled()
  })
})
