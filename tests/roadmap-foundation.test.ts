import { describe, expect, it } from 'vitest'
import {
  formatRoadmapStatus,
  formatRoadmapStudyMode,
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
