import { z } from 'zod'

export const DRAFT_LIFETIME = 24 * 60 * 60 * 1000
export const draftKey = (userId: string) => `classvault:setup:v1:${userId}`
const draftSchema = z.object({
  savedAt: z.number(),
  step: z.number().int().min(0).max(4),
  displayName: z.string().max(80),
  course: z.enum(['', 'MCA', 'BCA', 'B.Tech', 'M.Tech']),
  graduationYear: z.string().max(4),
  universityId: z.number().int().positive().nullable(),
  primaryGoal: z.enum([
    '',
    'ace_exams',
    'stay_consistent',
    'master_subjects',
    'placement_prep',
  ]),
  studyPreference: z.enum(['', 'solo', 'accountability', 'study_group']),
})

/** Tab-only, account-scoped, expiring answers. Never store credentials or tokens. */
export function parseDraft(
  raw: string | null,
  universityIds: number[],
  now = Date.now(),
) {
  if (!raw) return null
  try {
    const result = draftSchema.safeParse(JSON.parse(raw))
    if (
      !result.success ||
      now - result.data.savedAt > DRAFT_LIFETIME ||
      result.data.savedAt > now
    )
      return null
    const draft = result.data
    if (
      draft.universityId !== null &&
      !universityIds.includes(draft.universityId)
    )
      return { ...draft, universityId: null, step: Math.min(draft.step, 1) }
    const year = Number(draft.graduationYear)
    const earliest =
      draft.displayName.trim().length < 2
        ? 0
        : !draft.universityId
          ? 1
          : !draft.course ||
              !Number.isInteger(year) ||
              year < 2000 ||
              year > 2100
            ? 2
            : !draft.primaryGoal
              ? 3
              : 4
    return { ...draft, step: Math.min(draft.step, earliest) }
  } catch {
    return null
  }
}
