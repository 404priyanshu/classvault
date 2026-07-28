'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type OnboardingActionState = {
  error: string | null
}

const onboardingSchema = z.object({
  course: z.enum(['MCA', 'BCA', 'B.Tech', 'M.Tech']),
  displayName: z.string().trim().min(2).max(80),
  graduationYear: z.coerce.number().int().min(2000).max(2100),
  primaryGoal: z.enum([
    'ace_exams',
    'stay_consistent',
    'master_subjects',
    'placement_prep',
  ]),
  studyPreference: z.enum(['solo', 'accountability', 'study_group']),
  universityId: z.coerce.number().int().positive(),
})

function readString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export async function completeOnboardingAction(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const parsed = onboardingSchema.safeParse({
    course: readString(formData, 'course'),
    displayName: readString(formData, 'displayName'),
    graduationYear: readString(formData, 'graduationYear'),
    primaryGoal: readString(formData, 'primaryGoal'),
    studyPreference: readString(formData, 'studyPreference'),
    universityId: readString(formData, 'universityId'),
  })

  if (!parsed.success) {
    const fieldLabels: Record<string, string> = {
      course: 'degree',
      displayName: 'name',
      graduationYear: 'graduation year',
      primaryGoal: 'main goal',
      studyPreference: 'study preference',
      universityId: 'college',
    }
    const invalidFields = [
      ...new Set(
        parsed.error.issues.map(
          (issue) => fieldLabels[String(issue.path[0])] || 'details',
        ),
      ),
    ]

    return {
      error: `Please review your ${invalidFields.join(', ')} and try again.`,
    }
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims) {
    redirect('/auth/sign-in?next=/onboarding')
  }

  const { error } = await supabase.rpc('complete_student_onboarding', {
    p_course: parsed.data.course,
    p_display_name: parsed.data.displayName,
    p_graduation_year: parsed.data.graduationYear,
    p_primary_goal: parsed.data.primaryGoal,
    p_study_preference: parsed.data.studyPreference,
    p_university_id: parsed.data.universityId,
  })

  if (error) {
    return {
      error:
        'Your setup could not be saved right now. Your answers are still here—please try once more.',
    }
  }

  redirect('/dashboard?status=Your+vault+is+ready.')
}
