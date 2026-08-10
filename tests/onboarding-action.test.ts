import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock, redirectMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { url })
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

import { completeOnboardingAction } from '@/app/onboarding/actions'

function validOnboardingForm() {
  const data = new FormData()
  data.set('course', 'B.Tech')
  data.set('displayName', 'A Student')
  data.set('graduationYear', '2029')
  data.set('primaryGoal', 'ace_exams')
  data.set('studyPreference', 'study_group')
  data.set('universityId', '42')
  return data
}

describe('onboarding server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns field guidance without contacting Supabase for invalid data', async () => {
    const result = await completeOnboardingAction(
      { error: null },
      new FormData(),
    )

    expect(result.error).toContain('degree')
    expect(result.error).toContain('college')
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('requires validated claims before calling the completion function', async () => {
    const rpc = vi.fn()
    createClientMock.mockResolvedValue({
      auth: { getClaims: vi.fn().mockResolvedValue({ data: null }) },
      rpc,
    })

    await expect(
      completeOnboardingAction({ error: null }, validOnboardingForm()),
    ).rejects.toMatchObject({ url: '/auth/sign-in?next=/onboarding' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('sends only validated onboarding fields to the database function', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: 'user-id' } },
        }),
      },
      rpc,
    })

    await expect(
      completeOnboardingAction({ error: null }, validOnboardingForm()),
    ).rejects.toMatchObject({
      url: '/dashboard?status=Your+vault+is+ready.',
    })

    expect(rpc).toHaveBeenCalledWith('complete_student_onboarding', {
      p_course: 'B.Tech',
      p_display_name: 'A Student',
      p_graduation_year: 2029,
      p_primary_goal: 'ace_exams',
      p_study_preference: 'study_group',
      p_university_id: 42,
    })
  })
})
