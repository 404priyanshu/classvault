import { z } from 'zod'
import type { Database, Json } from '@/lib/supabase/database.types'

export type StudyRoomListItem =
  Database['public']['Functions']['list_study_rooms']['Returns'][number]

const memberSchema = z.object({
  avatarUrl: z.string().nullable(),
  displayName: z.string(),
  joinedAt: z.string(),
  role: z.enum(['host', 'cohost', 'member']),
  userId: z.string().uuid(),
})

const messageSchema = z.object({
  authorDisplayName: z.string(),
  authorId: z.string().uuid().nullable(),
  body: z.string(),
  createdAt: z.string(),
  id: z.number().int().positive(),
})

const snapshotSchema = z.object({
  members: z.array(memberSchema),
  messages: z.array(messageSchema),
  room: z.object({
    breakMinutes: z.number().int(),
    createdAt: z.string(),
    cyclesCompleted: z.number().int(),
    endsAt: z.string(),
    focusMinutes: z.number().int(),
    id: z.string().uuid(),
    memberCapacity: z.number().int(),
    name: z.string(),
    serverNow: z.string(),
    subjectTag: z.string(),
    timerPhase: z.enum(['focus', 'break']),
    timerRemainingSeconds: z.number().int().nonnegative(),
    timerRevision: z.number().int().nonnegative(),
    timerStatus: z.enum(['paused', 'running']),
    universityName: z.string().nullable(),
    visibility: z.enum(['public', 'university']),
  }),
  viewerRole: z.enum(['host', 'cohost', 'member']),
})

export type StudyRoomSnapshot = z.infer<typeof snapshotSchema>

export function parseStudyRoomSnapshot(value: Json): StudyRoomSnapshot | null {
  const parsed = snapshotSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function formatTimerSeconds(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}
