import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createClientMock,
  generateRoadmapForOwnerMock,
  isRoadmapWorkerConfiguredMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  generateRoadmapForOwnerMock: vi.fn(),
  isRoadmapWorkerConfiguredMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: createClientMock }))
vi.mock('@/lib/roadmaps/worker', () => ({
  generateRoadmapForOwner: generateRoadmapForOwnerMock,
  isRoadmapWorkerConfigured: isRoadmapWorkerConfiguredMock,
}))
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }))

import * as roadmapActions from '@/app/dashboard/roadmaps/actions'
import { initialRoadmapGenerationState } from '@/lib/roadmaps/action-state'

const { createRoadmapAction, retryRoadmapAction } = roadmapActions

const OWNER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const ROADMAP_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

function requestForm() {
  const formData = new FormData()
  formData.set('topic', 'Operating Systems')
  formData.set('studyMode', 'exam')
  return formData
}

function authenticatedClient() {
  const rpc = vi.fn().mockResolvedValue({
    data: [{ roadmap_id: ROADMAP_ID, source_count: 2 }],
    error: null,
  })
  createClientMock.mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({ data: { claims: { sub: OWNER_ID } } }),
    },
    rpc,
  })
  return rpc
}

describe('roadmap generation actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isRoadmapWorkerConfiguredMock.mockReturnValue(true)
  })

  it('keeps the use-server module limited to async function exports', () => {
    expect(Object.values(roadmapActions)).toEqual([
      createRoadmapAction,
      retryRoadmapAction,
      roadmapActions.setRoadmapTaskProgressAction,
    ])
    expect(
      Object.values(roadmapActions).every(
        (exportedValue) => typeof exportedValue === 'function',
      ),
    ).toBe(true)
  })

  it('rejects malformed requests before creating a database client', async () => {
    const formData = requestForm()
    formData.set('topic', 'x')

    await expect(
      createRoadmapAction(initialRoadmapGenerationState, formData),
    ).resolves.toMatchObject({ kind: 'error' })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('does not create a source snapshot when the worker secret is missing', async () => {
    const rpc = authenticatedClient()
    isRoadmapWorkerConfiguredMock.mockReturnValue(false)

    await expect(
      createRoadmapAction(initialRoadmapGenerationState, requestForm()),
    ).resolves.toEqual({
      kind: 'error',
      message: 'The server-side roadmap worker is not configured yet.',
    })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('creates a server-owned source snapshot and returns the ready roadmap', async () => {
    const rpc = authenticatedClient()
    generateRoadmapForOwnerMock.mockResolvedValue({
      roadmapId: ROADMAP_ID,
      status: 'ready',
    })

    await expect(
      createRoadmapAction(initialRoadmapGenerationState, requestForm()),
    ).resolves.toEqual({
      kind: 'success',
      message: 'Your grounded roadmap is ready.',
      roadmapId: ROADMAP_ID,
    })
    expect(rpc).toHaveBeenCalledWith('create_roadmap_source_snapshot', {
      p_study_mode: 'exam',
      p_topic: 'Operating Systems',
    })
    expect(generateRoadmapForOwnerMock).toHaveBeenCalledWith(
      ROADMAP_ID,
      OWNER_ID,
    )
  })

  it('derives the owner during retry instead of accepting one from the form', async () => {
    authenticatedClient()
    generateRoadmapForOwnerMock.mockResolvedValue({
      roadmapId: ROADMAP_ID,
      status: 'ready',
    })
    const formData = new FormData()
    formData.set('roadmapId', ROADMAP_ID)
    formData.set('ownerId', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc')

    await expect(
      retryRoadmapAction(initialRoadmapGenerationState, formData),
    ).resolves.toMatchObject({ kind: 'success', roadmapId: ROADMAP_ID })
    expect(generateRoadmapForOwnerMock).toHaveBeenCalledWith(
      ROADMAP_ID,
      OWNER_ID,
    )
  })
})
