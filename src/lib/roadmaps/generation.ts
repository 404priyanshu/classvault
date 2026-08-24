import { z } from 'zod'

export const roadmapStudyModeSchema = z.enum(['indepth', 'exam'])

export const roadmapGenerationSourceSchema = z.object({
  excerpt: z.string().max(12000).nullable(),
  extractionStatus: z.string().nullable(),
  noteId: z.string().uuid(),
  scope: z.enum(['personal', 'public', 'university']),
  title: z.string().trim().min(3).max(180),
  visibility: z.enum(['public', 'university']),
})

export const roadmapGeneratedSectionSchema = z.object({
  sourceNoteIds: z.array(z.string().uuid()).min(1).max(100),
  summary: z.string().trim().min(2).max(4000),
  tasks: z.array(z.string().trim().min(2).max(500)).min(1).max(30),
  timeframe: z.string().trim().min(1).max(80),
  title: z.string().trim().min(2).max(160),
})

export const roadmapGenerationOutputSchema = z.object({
  sections: z.array(roadmapGeneratedSectionSchema).min(1).max(20),
  title: z.string().trim().min(3).max(180),
})

export type RoadmapGenerationSource = z.infer<
  typeof roadmapGenerationSourceSchema
>
export type RoadmapGenerationOutput = z.infer<
  typeof roadmapGenerationOutputSchema
>
export type RoadmapStudyMode = z.infer<typeof roadmapStudyModeSchema>

export type RoadmapGenerationRequest = {
  sources: RoadmapGenerationSource[]
  studyMode: RoadmapStudyMode
  topic: string
}

export type RoadmapGenerationProvider = {
  generate(request: RoadmapGenerationRequest): Promise<unknown>
  id: string
}

const MAX_SECTION_SOURCES = 100
const MAX_SECTIONS = 20

function truncate(value: string, length: number) {
  return value.length <= length ? value : `${value.slice(0, length - 1).trim()}…`
}

function sourceLabel(sources: RoadmapGenerationSource[]) {
  const visibleTitles = sources.slice(0, 3).map((source) => source.title)
  const remaining = sources.length - visibleTitles.length
  return `${visibleTitles.join(', ')}${remaining > 0 ? ` and ${remaining} more` : ''}`
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }
  return result
}

function phaseSections(request: RoadmapGenerationRequest) {
  const sourceIds = request.sources.map((source) => source.noteId)
  const label = sourceLabel(request.sources)
  const examMode = request.studyMode === 'exam'

  return [
    {
      sourceNoteIds: sourceIds,
      summary: `Build a reliable concept map for ${request.topic} from ${label}.`,
      tasks: [
        `Read the cited notes and outline the essential ${request.topic} concepts.`,
        'Create a one-page concept map that links definitions, examples, and common mistakes.',
      ],
      timeframe: examMode ? 'Session 1' : 'Days 1–2',
      title: 'Build the foundation',
    },
    {
      sourceNoteIds: sourceIds,
      summary: examMode
        ? `Turn the cited ${request.topic} material into active-recall practice.`
        : `Apply the cited ${request.topic} material through explanation and practice.`,
      tasks: [
        examMode
          ? 'Write ten closed-book recall questions from the cited notes.'
          : 'Explain each major idea without looking at the notes, then correct the gaps.',
        `Complete one focused ${request.topic} practice set and annotate every error.`,
      ],
      timeframe: examMode ? 'Session 2' : 'Days 3–4',
      title: examMode ? 'Practise for recall' : 'Apply the ideas',
    },
    {
      sourceNoteIds: sourceIds,
      summary: `Consolidate ${request.topic} into a final review using the same authorized sources.`,
      tasks: [
        'Review only the errors and weak links identified in the previous phase.',
        examMode
          ? 'Run one timed recall pass and finish with a concise exam-day sheet.'
          : 'Teach the roadmap aloud and write a concise long-term review sheet.',
      ],
      timeframe: examMode ? 'Final session' : 'Day 5',
      title: 'Consolidate and review',
    },
  ]
}

export const deterministicRoadmapProvider: RoadmapGenerationProvider = {
  id: 'deterministic-v1',
  async generate(request) {
    if (request.sources.length === 0) {
      throw new Error('Roadmap generation requires at least one source.')
    }

    const sourceChunks = chunks(request.sources, MAX_SECTION_SOURCES)
    if (sourceChunks.length > MAX_SECTIONS) {
      throw new Error('The roadmap source set is too large to generate safely.')
    }

    const sections =
      sourceChunks.length === 1
        ? phaseSections(request)
        : sourceChunks.map((sourceChunk, index) => ({
            sourceNoteIds: sourceChunk.map((source) => source.noteId),
            summary: `Review source set ${index + 1} for ${request.topic}: ${sourceLabel(sourceChunk)}.`,
            tasks: [
              `Extract the key ${request.topic} ideas from this source set.`,
              'Write a short recall check and record any unresolved gaps.',
            ],
            timeframe: `Source pass ${index + 1}`,
            title: `Source pass ${index + 1}`,
          }))

    return {
      sections,
      title: truncate(
        `${request.topic}: ${request.studyMode === 'exam' ? 'exam revision' : 'in-depth study'} roadmap`,
        180,
      ),
    }
  },
}

export function validateRoadmapGenerationOutput(
  value: unknown,
  allowedSources: RoadmapGenerationSource[],
) {
  const parsed = roadmapGenerationOutputSchema.parse(value)
  const allowedSourceIds = new Set(allowedSources.map((source) => source.noteId))
  const referencedSourceIds = new Set<string>()

  for (const section of parsed.sections) {
    const sectionSourceIds = new Set(section.sourceNoteIds)
    if (sectionSourceIds.size !== section.sourceNoteIds.length) {
      throw new Error('A generated roadmap section cited a source more than once.')
    }

    for (const sourceId of section.sourceNoteIds) {
      if (!allowedSourceIds.has(sourceId)) {
        throw new Error('A generated roadmap cited an unauthorized source.')
      }
      referencedSourceIds.add(sourceId)
    }
  }

  if (referencedSourceIds.size !== allowedSourceIds.size) {
    throw new Error('The generated roadmap did not cite every selected source.')
  }

  return parsed
}
