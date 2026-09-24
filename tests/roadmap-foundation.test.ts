import { describe, expect, it } from 'vitest'
import {
  formatRoadmapStatus,
  formatRoadmapStudyMode,
  pickRoadmapToContinue,
  type OwnedRoadmapSummary,
} from '@/lib/roadmaps/foundation'

describe('roadmap foundation formatting', () => {
  it('labels the supported study modes', () => {
    expect(formatRoadmapStudyMode('exam')).toBe('Exam revision')
    expect(formatRoadmapStudyMode('indepth')).toBe('In-depth study')
  })

  it('labels roadmap lifecycle states with a safe draft fallback', () => {
    expect(formatRoadmapStatus('ready')).toBe('Ready')
    expect(formatRoadmapStatus('generating')).toBe('Generating')
    expect(formatRoadmapStatus('failed')).toBe('Needs retry')
    expect(formatRoadmapStatus('draft')).toBe('Source snapshot')
  })
})

describe('pickRoadmapToContinue', () => {
  const roadmap = (
    id: string,
    status: string,
    completed: number,
    total: number,
  ): OwnedRoadmapSummary => ({
    completed_task_count: completed,
    created_at: '2026-09-01T00:00:00Z',
    generated_at: null,
    generation_plan: 'deterministic',
    roadmap_id: id,
    section_count: 3,
    sharing_enabled: false,
    source_count: 2,
    status,
    study_mode: 'exam',
    title: id,
    topic: id,
    total_task_count: total,
  })

  it('prefers the newest ready roadmap that still has tasks left', () => {
    const picked = pickRoadmapToContinue([
      roadmap('finished', 'ready', 5, 5),
      roadmap('generating', 'generating', 0, 0),
      roadmap('half-done', 'ready', 2, 6),
      roadmap('older', 'ready', 0, 4),
    ])
    expect(picked?.roadmap_id).toBe('half-done')
  })

  it('falls back to the newest roadmap when none is in progress', () => {
    expect(
      pickRoadmapToContinue([
        roadmap('generating', 'generating', 0, 0),
        roadmap('finished', 'ready', 4, 4),
      ])?.roadmap_id,
    ).toBe('generating')
  })

  it('returns null without roadmaps', () => {
    expect(pickRoadmapToContinue([])).toBeNull()
  })
})
