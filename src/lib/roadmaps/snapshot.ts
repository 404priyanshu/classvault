import { z } from 'zod'

const roadmapSnapshotTaskSchema = z.object({
  completed: z.boolean().nullable(),
  id: z.number().int().positive(),
  position: z.number().int().positive(),
  text: z.string(),
})

const roadmapSnapshotSourceSchema = z.object({
  linkAvailable: z.boolean(),
  noteId: z.string().uuid().nullable(),
  scope: z.string(),
  title: z.string(),
})

const roadmapSnapshotSectionSchema = z.object({
  available: z.boolean(),
  id: z.number().int().positive(),
  position: z.number().int().positive(),
  sources: z.array(roadmapSnapshotSourceSchema),
  summary: z.string().nullable(),
  tasks: z.array(roadmapSnapshotTaskSchema),
  timeframe: z.string().nullable(),
  title: z.string().nullable(),
})

export const roadmapSnapshotSchema = z.object({
  generatedAt: z.string(),
  generationPlan: z.string(),
  id: z.string().uuid(),
  isOwner: z.boolean(),
  sections: z.array(roadmapSnapshotSectionSchema),
  studyMode: z.string(),
  title: z.string(),
  topic: z.string(),
})

export type RoadmapSnapshot = z.infer<typeof roadmapSnapshotSchema>
