import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock, redirectMock, revalidatePathMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  redirectMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: createClientMock }))
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }))
vi.mock('next/navigation', () => ({ redirect: redirectMock }))

import * as studyRoomActions from '@/app/dashboard/study-rooms/actions'
import { initialStudyRoomActionState } from '@/lib/study-rooms/action-state'

const OWNER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const ROOM_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const PEER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

function authenticatedClient(
  implementation: (name: string, args?: Record<string, unknown>) => unknown,
) {
  const rpc = vi.fn(async (name: string, args?: Record<string, unknown>) =>
    implementation(name, args),
  )
  createClientMock.mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: { claims: { sub: OWNER_ID } },
      }),
    },
    rpc,
  })
  return rpc
}

function validCreateForm() {
  const formData = new FormData()
  formData.set('name', 'Operating Systems sprint')
  formData.set('subjectTag', 'Operating Systems')
  formData.set('visibility', 'public')
  formData.set('focusMinutes', '25')
  formData.set('breakMinutes', '5')
  return formData
}

describe('study-room server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the use-server module limited to async function exports', () => {
    expect(
      Object.values(studyRoomActions).every(
        (exportedValue) => typeof exportedValue === 'function',
      ),
    ).toBe(true)
  })

  it('rejects malformed room creation before creating a client', async () => {
    await expect(
      studyRoomActions.createStudyRoomAction(
        initialStudyRoomActionState,
        new FormData(),
      ),
    ).resolves.toMatchObject({ kind: 'error' })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('creates a validated server-owned room and redirects to it', async () => {
    const rpc = authenticatedClient(() => ({ data: ROOM_ID, error: null }))

    await studyRoomActions.createStudyRoomAction(
      initialStudyRoomActionState,
      validCreateForm(),
    )

    expect(rpc).toHaveBeenCalledWith('create_study_room', {
      p_break_minutes: 5,
      p_focus_minutes: 25,
      p_name: 'Operating Systems sprint',
      p_subject_tag: 'Operating Systems',
      p_visibility: 'public',
    })
    expect(redirectMock).toHaveBeenCalledWith(
      `/dashboard/study-rooms/${ROOM_ID}`,
    )
  })

  it('maps a capacity rejection to a useful join error', async () => {
    authenticatedClient(() => ({
      data: null,
      error: { message: 'Study room is full' },
    }))
    const formData = new FormData()
    formData.set('roomId', ROOM_ID)

    await expect(
      studyRoomActions.joinStudyRoomAction(
        initialStudyRoomActionState,
        formData,
      ),
    ).resolves.toEqual({
      kind: 'error',
      message: 'That study room is already full.',
    })
  })

  it('joins only the validated room identifier', async () => {
    const rpc = authenticatedClient(() => ({ data: true, error: null }))
    const formData = new FormData()
    formData.set('roomId', ROOM_ID)

    await studyRoomActions.joinStudyRoomAction(
      initialStudyRoomActionState,
      formData,
    )

    expect(rpc).toHaveBeenCalledWith('join_study_room', {
      p_room_id: ROOM_ID,
    })
    expect(redirectMock).toHaveBeenCalledWith(
      `/dashboard/study-rooms/${ROOM_ID}`,
    )
  })

  it('sends revision-checked timer controls', async () => {
    const rpc = authenticatedClient(() => ({ data: [], error: null }))
    const formData = new FormData()
    formData.set('action', 'skip')
    formData.set('revision', '4')
    formData.set('roomId', ROOM_ID)

    await expect(
      studyRoomActions.updateStudyRoomTimerAction(
        initialStudyRoomActionState,
        formData,
      ),
    ).resolves.toMatchObject({ kind: 'success' })
    expect(rpc).toHaveBeenCalledWith('update_study_room_timer', {
      p_action: 'skip',
      p_expected_revision: 4,
      p_room_id: ROOM_ID,
    })
  })

  it('trims and sends member chat through the room RPC', async () => {
    const rpc = authenticatedClient(() => ({ data: 1, error: null }))
    const formData = new FormData()
    formData.set('body', '  Ready for the next block.  ')
    formData.set('roomId', ROOM_ID)

    await expect(
      studyRoomActions.sendStudyRoomMessageAction(
        initialStudyRoomActionState,
        formData,
      ),
    ).resolves.toMatchObject({ kind: 'success' })
    expect(rpc).toHaveBeenCalledWith('send_study_room_message', {
      p_body: 'Ready for the next block.',
      p_room_id: ROOM_ID,
    })
  })

  it('lets the host assign only validated co-host roles', async () => {
    const rpc = authenticatedClient(() => ({ data: true, error: null }))
    const formData = new FormData()
    formData.set('role', 'cohost')
    formData.set('roomId', ROOM_ID)
    formData.set('userId', PEER_ID)

    await studyRoomActions.setStudyRoomMemberRoleAction(formData)

    expect(rpc).toHaveBeenCalledWith('set_study_room_member_role', {
      p_role: 'cohost',
      p_room_id: ROOM_ID,
      p_user_id: PEER_ID,
    })
  })

  it('leaves through the database lifecycle function before returning to the lobby', async () => {
    const rpc = authenticatedClient(() => ({
      data: [{ new_host_id: null, room_deleted: false }],
      error: null,
    }))
    const formData = new FormData()
    formData.set('roomId', ROOM_ID)

    await studyRoomActions.leaveStudyRoomAction(formData)

    expect(rpc).toHaveBeenCalledWith('leave_study_room', {
      p_room_id: ROOM_ID,
    })
    expect(redirectMock).toHaveBeenCalledWith(
      '/dashboard/study-rooms?status=left',
    )
  })

  it('ends rooms only after the host-authorized RPC succeeds', async () => {
    const rpc = authenticatedClient(() => ({ data: true, error: null }))
    const formData = new FormData()
    formData.set('roomId', ROOM_ID)

    await studyRoomActions.endStudyRoomAction(formData)

    expect(rpc).toHaveBeenCalledWith('end_study_room', {
      p_room_id: ROOM_ID,
    })
    expect(redirectMock).toHaveBeenCalledWith(
      '/dashboard/study-rooms?status=ended',
    )
  })
})
