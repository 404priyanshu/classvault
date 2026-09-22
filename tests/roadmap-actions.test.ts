import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  adminCountMock,
  createClientMock,
  generateRoadmapForOwnerMock,
  isRoadmapWorkerConfiguredMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  adminCountMock: vi.fn(),
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
// The daily-cap count: a chain ending in the awaited count result.
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ gte: adminCountMock }) }),
    }),
  }),
}))

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
      roadmapActions.setRoadmapSharingAction,
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

  it('does not reach the database when the sharing form is malformed', async () => {
    const formData = new FormData()
    formData.set('roadmapId', 'not-a-uuid')
    formData.set('enabled', 'true')

    await roadmapActions.setRoadmapSharingAction(formData)

    expect(createClientMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it('passes the sharing decision straight to the database function', async () => {
    const rpc = authenticatedClient()
    const formData = new FormData()
    formData.set('roadmapId', ROADMAP_ID)
    formData.set('enabled', 'true')

    await roadmapActions.setRoadmapSharingAction(formData)

    expect(rpc).toHaveBeenCalledWith('set_roadmap_sharing', {
      p_enabled: true,
      p_roadmap_id: ROADMAP_ID,
    })
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/dashboard/roadmaps/${ROADMAP_ID}`,
    )
  })

  // Anything other than the literal 'true' must revoke rather than enable, so a
  // mangled form cannot turn sharing on by accident.
  it('treats a non-true enabled field as a revocation', async () => {
    const rpc = authenticatedClient()
    const formData = new FormData()
    formData.set('roadmapId', ROADMAP_ID)
    formData.set('enabled', 'false')

    await roadmapActions.setRoadmapSharingAction(formData)

    expect(rpc).toHaveBeenCalledWith('set_roadmap_sharing', {
      p_enabled: false,
      p_roadmap_id: ROADMAP_ID,
    })
  })

  it('does not revalidate when the database refuses the sharing change', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({ data: { claims: { sub: OWNER_ID } } }),
      },
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'denied' } }),
    })
    const formData = new FormData()
    formData.set('roadmapId', ROADMAP_ID)
    formData.set('enabled', 'true')

    await roadmapActions.setRoadmapSharingAction(formData)

    expect(revalidatePathMock).not.toHaveBeenCalled()
  })
  // A quota guard for the shared free Gemini tier. It applies only while an AI
  // provider is configured, and it must stop before the source snapshot is
  // created, or a refused request would still leave a roadmap row behind.
  it('refuses a new roadmap once today\'s AI limit is reached', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    vi.stubEnv('ROADMAP_DAILY_LIMIT', '2')
    adminCountMock.mockResolvedValue({ count: 2, error: null })
    const rpc = authenticatedClient()

    await expect(
      createRoadmapAction(initialRoadmapGenerationState, requestForm()),
    ).resolves.toMatchObject({ kind: 'error', message: expect.stringContaining('limit') })
    expect(rpc).not.toHaveBeenCalled()
    expect(generateRoadmapForOwnerMock).not.toHaveBeenCalled()
    vi.unstubAllEnvs()
  })

  it('fails closed when the daily count cannot be read', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    adminCountMock.mockResolvedValue({ count: null, error: { message: 'down' } })
    const rpc = authenticatedClient()

    await expect(
      createRoadmapAction(initialRoadmapGenerationState, requestForm()),
    ).resolves.toMatchObject({ kind: 'error' })
    expect(rpc).not.toHaveBeenCalled()
    vi.unstubAllEnvs()
  })

  it('applies no cap when no AI provider is configured', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    authenticatedClient()
    generateRoadmapForOwnerMock.mockResolvedValue({ roadmapId: ROADMAP_ID, status: 'ready' })

    await expect(
      createRoadmapAction(initialRoadmapGenerationState, requestForm()),
    ).resolves.toMatchObject({ kind: 'success' })
    expect(adminCountMock).not.toHaveBeenCalled()
    vi.unstubAllEnvs()
  })
})
