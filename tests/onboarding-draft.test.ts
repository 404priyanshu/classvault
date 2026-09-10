import { describe, expect, it } from 'vitest'
import {
  DRAFT_LIFETIME,
  draftKey,
  parseDraft,
} from '@/components/onboarding/draft'

const now = 1000000000
const draft = {
  savedAt: now,
  step: 4,
  displayName: 'Aanya',
  course: 'B.Tech',
  graduationYear: '2029',
  universityId: 42,
  primaryGoal: 'ace_exams',
  studyPreference: 'solo',
}
describe('onboarding recovery', () => {
  it('restores validated answers and the current step', () => {
    expect(parseDraft(JSON.stringify(draft), [42], now)).toEqual(draft)
  })
  it('separates accounts and rejects malformed or expired drafts', () => {
    expect(draftKey('alice')).not.toBe(draftKey('bob'))
    expect(parseDraft('{broken', [42], now)).toBeNull()
    expect(
      parseDraft(JSON.stringify(draft), [42], now + DRAFT_LIFETIME + 1),
    ).toBeNull()
    expect(parseDraft(JSON.stringify(draft), [42], now - 1)).toBeNull()
  })
  it('revisits campus selection when the directory no longer contains it', () => {
    expect(parseDraft(JSON.stringify(draft), [2], now)).toMatchObject({
      universityId: null,
      step: 1,
    })
  })
  it('does not skip missing prerequisites or restore unsupported degrees', () => {
    expect(
      parseDraft(JSON.stringify({ ...draft, displayName: '' }), [42], now)
        ?.step,
    ).toBe(0)
    expect(
      parseDraft(JSON.stringify({ ...draft, course: 'MBA' }), [42], now),
    ).toBeNull()
    expect(
      parseDraft(JSON.stringify({ ...draft, primaryGoal: '' }), [42], now)
        ?.step,
    ).toBe(3)
  })
  it('drops unrelated data such as tokens and email addresses', () => {
    const result = parseDraft(
      JSON.stringify({
        ...draft,
        accessToken: 'secret',
        email: 'student@example.com',
      }),
      [42],
      now,
    )
    expect(result).not.toHaveProperty('accessToken')
    expect(result).not.toHaveProperty('email')
  })
})
