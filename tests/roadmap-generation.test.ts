import { describe, expect, it } from 'vitest'
import {
  deterministicRoadmapProvider,
  validateRoadmapGenerationOutput,
  type RoadmapGenerationSource,
} from '@/lib/roadmaps/generation'

function source(index: number): RoadmapGenerationSource {
  return {
    excerpt: index % 2 ? `Extracted source ${index}` : null,
    extractionStatus: index % 2 ? 'ready' : 'unsupported',
    noteId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    scope: index % 2 ? 'public' : 'personal',
    title: `Roadmap source ${index}`,
    visibility: 'public',
  }
}

describe('deterministic roadmap generation', () => {
  it('builds a three-phase exam plan that cites every selected source', async () => {
    const sources = [source(1), source(2), source(3)]
    const rawOutput = await deterministicRoadmapProvider.generate({
      sources,
      studyMode: 'exam',
      topic: 'Operating Systems',
    })
    const output = validateRoadmapGenerationOutput(rawOutput, sources)

    expect(output.title).toContain('Operating Systems')
    expect(output.sections).toHaveLength(3)
    expect(output.sections[0].sourceNoteIds).toEqual(
      sources.map((item) => item.noteId),
    )
    expect(output.sections[1].tasks.join(' ')).toContain('recall')
  })

  it('splits large source pools without omitting an eligible source', async () => {
    const sources = Array.from({ length: 150 }, (_, index) => source(index + 1))
    const rawOutput = await deterministicRoadmapProvider.generate({
      sources,
      studyMode: 'indepth',
      topic: 'Distributed Systems',
    })
    const output = validateRoadmapGenerationOutput(rawOutput, sources)
    const cited = new Set(
      output.sections.flatMap((section) => section.sourceNoteIds),
    )

    expect(output.sections).toHaveLength(2)
    expect(cited.size).toBe(150)
  })

  it('rejects provider output that cites unauthorized or incomplete sources', () => {
    const sources = [source(1), source(2)]
    const base = {
      sections: [
        {
          sourceNoteIds: [sources[0].noteId],
          summary: 'Review one source.',
          tasks: ['Read the source.'],
          timeframe: 'Day 1',
          title: 'Foundation',
        },
      ],
      title: 'Test roadmap',
    }

    expect(() => validateRoadmapGenerationOutput(base, sources)).toThrow(
      'did not cite every selected source',
    )
    expect(() =>
      validateRoadmapGenerationOutput(
        {
          ...base,
          sections: [
            {
              ...base.sections[0],
              sourceNoteIds: [source(99).noteId],
            },
          ],
        },
        sources,
      ),
    ).toThrow('unauthorized source')
  })
})
