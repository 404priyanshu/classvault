import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { generateRoadmapForOwner } from '@/lib/roadmaps/worker'

const ROADMAP_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const OWNER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const NOTE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

function claimedRoadmap() {
  return {
    claim_status: 'claimed',
    roadmap_id: ROADMAP_ID,
    source_count: 1,
    sources: [
      {
        excerpt: 'Scheduling uses queues.',
        extractionStatus: 'ready',
        noteId: NOTE_ID,
        scope: 'public',
        title: 'Scheduling notes',
        visibility: 'public',
      },
    ],
    study_mode: 'exam',
    topic: 'Operating Systems',
  }
}

describe('roadmap generation worker', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('claims, validates, and saves provider output through the admin client', async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: [claimedRoadmap()], error: null })
      .mockResolvedValueOnce({ data: true, error: null })
    const provider = {
      generate: vi.fn().mockResolvedValue({
        sections: [
          {
            sourceNoteIds: [NOTE_ID],
            summary: 'Review scheduling.',
            tasks: ['Read the scheduling note.'],
            timeframe: 'Day 1',
            title: 'Scheduling',
          },
        ],
        title: 'Operating Systems roadmap',
      }),
      id: 'test-provider',
    }

    await expect(
      generateRoadmapForOwner(ROADMAP_ID, OWNER_ID, {
        admin: { rpc } as never,
        provider,
      }),
    ).resolves.toEqual({ roadmapId: ROADMAP_ID, status: 'ready' })

    expect(rpc).toHaveBeenNthCalledWith(1, 'claim_roadmap_generation', {
      p_generator_key: 'test-provider',
      p_owner_id: OWNER_ID,
      p_roadmap_id: ROADMAP_ID,
    })
    expect(rpc).toHaveBeenNthCalledWith(
      2,
      'save_roadmap_snapshot',
      expect.objectContaining({ p_roadmap_id: ROADMAP_ID }),
    )
  })

  it('marks claimed roadmaps failed when provider output is not fully grounded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: [claimedRoadmap()], error: null })
      .mockResolvedValueOnce({ data: true, error: null })
    const provider = {
      generate: vi.fn().mockResolvedValue({
        sections: [
          {
            sourceNoteIds: ['dddddddd-dddd-4ddd-8ddd-dddddddddddd'],
            summary: 'Unsafe output.',
            tasks: ['Read another note.'],
            timeframe: 'Day 1',
            title: 'Unsafe phase',
          },
        ],
        title: 'Unsafe roadmap',
      }),
      id: 'unsafe-provider',
    }

    await expect(
      generateRoadmapForOwner(ROADMAP_ID, OWNER_ID, {
        admin: { rpc } as never,
        provider,
      }),
    ).resolves.toEqual({
      failureCode: 'invalid_generation_output',
      roadmapId: ROADMAP_ID,
      status: 'failed',
    })
    expect(rpc).toHaveBeenLastCalledWith('mark_roadmap_generation_failed', {
      p_failure_code: 'invalid_generation_output',
      p_owner_id: OWNER_ID,
      p_roadmap_id: ROADMAP_ID,
    })
  })

  it('returns server-owned claim failures without invoking the provider', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ ...claimedRoadmap(), claim_status: 'source_access_changed', sources: [] }],
      error: null,
    })
    const provider = { generate: vi.fn(), id: 'test-provider' }

    await expect(
      generateRoadmapForOwner(ROADMAP_ID, OWNER_ID, {
        admin: { rpc } as never,
        provider,
      }),
    ).resolves.toEqual({
      failureCode: 'source_access_changed',
      roadmapId: ROADMAP_ID,
      status: 'failed',
    })
    expect(provider.generate).not.toHaveBeenCalled()
  })
})
