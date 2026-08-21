import type { OnboardingActionState } from '@/app/onboarding/actions'

export type University = {
  city: string | null
  domains: string[]
  id: number
  name: string
  shortName: string | null
  state: string | null
}

export type OnboardingFlowProps = {
  accountEmail: string | null
  accountIdentifier: string
  initialProfile: {
    course: string
    displayName: string
    graduationYear: number
    primaryGoal: string
    studyPreference: string
    universityId: number | null
  }
  isEditing: boolean
  universities: University[]
}

export const INITIAL_ACTION_STATE: OnboardingActionState = { error: null }
