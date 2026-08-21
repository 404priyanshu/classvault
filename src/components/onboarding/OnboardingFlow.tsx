'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useActionState, useMemo, useState } from 'react'
import { completeOnboardingAction } from '@/app/onboarding/actions'
import { CampusStep } from './CampusStep'
import { STEPS } from './constants'
import { emailMatchesUniversity, normalizeCourse } from './helpers'
import { IdentityStep } from './IdentityStep'
import { PreferencesStep } from './PreferencesStep'
import { StepProgressHeader } from './StepProgressHeader'
import { StepSidebar } from './StepSidebar'
import { SubmitButton } from './SubmitButton'
import { INITIAL_ACTION_STATE, type OnboardingFlowProps } from './types'

export function OnboardingFlow({
  accountEmail,
  accountIdentifier,
  initialProfile,
  isEditing,
  universities,
}: OnboardingFlowProps) {
  const prefersReducedMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const [displayName, setDisplayName] = useState(initialProfile.displayName)
  const [course, setCourse] = useState(() =>
    normalizeCourse(initialProfile.course),
  )
  const [graduationYear, setGraduationYear] = useState(
    initialProfile.graduationYear.toString(),
  )
  const [universityId, setUniversityId] = useState<number | null>(
    initialProfile.universityId,
  )
  const [primaryGoal, setPrimaryGoal] = useState(initialProfile.primaryGoal)
  const [studyPreference, setStudyPreference] = useState(
    initialProfile.studyPreference,
  )
  const initialUniversity = universities.find(
    (university) => university.id === initialProfile.universityId,
  )
  const [universityQuery, setUniversityQuery] = useState(
    initialUniversity?.name || '',
  )
  const [isUniversitySearchOpen, setIsUniversitySearchOpen] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [actionState, formAction] = useActionState(
    completeOnboardingAction,
    INITIAL_ACTION_STATE,
  )

  const activeUniversity = universities.find(
    (university) => university.id === universityId,
  )

  const filteredUniversities = useMemo(() => {
    const query = universityQuery.trim().toLowerCase()

    if (query.length < 2) {
      return []
    }

    return universities.filter((university) =>
      [
        university.name,
        university.shortName,
        university.city,
        university.state,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    )
  }, [universities, universityQuery])

  const willVerify = accountEmail
    ? emailMatchesUniversity(accountEmail, activeUniversity)
    : false
  const showUniversityResults =
    isUniversitySearchOpen && universityQuery.trim().length >= 2

  function validateCurrentStep() {
    if (step === 0) {
      const year = Number(graduationYear)
      if (
        displayName.trim().length < 2 ||
        course.trim().length < 2 ||
        !Number.isInteger(year) ||
        year < new Date().getFullYear() ||
        year > new Date().getFullYear() + 12
      ) {
        setClientError(
          'Add your name, course, and a realistic graduation year to continue.',
        )
        return false
      }
    }

    if (step === 1 && !universityId) {
      setClientError('Choose your university to continue.')
      return false
    }

    setClientError(null)
    return true
  }

  function goForward() {
    if (validateCurrentStep()) {
      setStep((currentStep) => Math.min(currentStep + 1, STEPS.length - 1))
    }
  }

  function goBack() {
    setClientError(null)
    setStep((currentStep) => Math.max(currentStep - 1, 0))
  }

  return (
    <main className="paper-grain relative min-h-screen overflow-hidden bg-[#f6f1e5] text-[#171512]">
      <div className="bg-dotgrid pointer-events-none absolute inset-0 opacity-50" />

      <div className="relative mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[360px_minmax(0,1fr)]">
        <StepSidebar step={step} />

        <section className="flex min-w-0 flex-col px-4 py-5 sm:px-7 sm:py-7 lg:px-12 lg:py-9">
          <StepProgressHeader step={step} />

          <form
            action={formAction}
            className="bg-ruled relative mx-auto mt-7 flex w-full max-w-[920px] flex-1 flex-col border-[1.5px] border-[#171512] bg-[#fffdf6] shadow-[7px_7px_0_#171512] lg:mt-5"
          >
            <span className="absolute left-1/2 top-0 h-7 w-28 -translate-x-1/2 -translate-y-1/2 rotate-[-2deg] bg-[#f0a202]/80" />

            <input name="displayName" type="hidden" value={displayName} />
            <input name="course" type="hidden" value={course} />
            <input
              name="graduationYear"
              type="hidden"
              value={graduationYear}
            />
            <input name="universityId" type="hidden" value={universityId || ''} />
            <input name="primaryGoal" type="hidden" value={primaryGoal} />
            <input
              name="studyPreference"
              type="hidden"
              value={studyPreference}
            />

            <div className="flex-1 px-5 pb-7 pt-10 sm:px-9 sm:pb-9 sm:pt-12 lg:px-12">
              <AnimatePresence mode="wait">
                <motion.div
                  animate={{ opacity: 1, x: 0 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, x: -18 }
                  }
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, x: 18 }
                  }
                  key={step}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.24 }}
                >
                  {step === 0 ? (
                    <IdentityStep
                      course={course}
                      displayName={displayName}
                      graduationYear={graduationYear}
                      onCourseChange={(value) => {
                        setCourse(value)
                        setClientError(null)
                      }}
                      onDisplayNameChange={(value) => {
                        setDisplayName(value)
                        setClientError(null)
                      }}
                      onGraduationYearChange={(value) => {
                        setGraduationYear(value)
                        setClientError(null)
                      }}
                    />
                  ) : null}

                  {step === 1 ? (
                    <CampusStep
                      accountEmail={accountEmail}
                      accountIdentifier={accountIdentifier}
                      activeUniversity={activeUniversity}
                      filteredUniversities={filteredUniversities}
                      onQueryChange={(value) => {
                        setUniversityQuery(value)
                        setIsUniversitySearchOpen(
                          value.trim().length >= 2,
                        )

                        if (
                          activeUniversity &&
                          value !== activeUniversity.name
                        ) {
                          setUniversityId(null)
                        }
                      }}
                      onQueryFocus={() =>
                        setIsUniversitySearchOpen(
                          universityQuery.trim().length >= 2,
                        )
                      }
                      onSelectUniversity={(university) => {
                        setUniversityId(university.id)
                        setUniversityQuery(university.name)
                        setIsUniversitySearchOpen(false)
                        setClientError(null)
                      }}
                      showUniversityResults={showUniversityResults}
                      universityId={universityId}
                      universityQuery={universityQuery}
                      willVerify={willVerify}
                    />
                  ) : null}

                  {step === 2 ? (
                    <PreferencesStep
                      onGoalChange={(value) => setPrimaryGoal(value)}
                      onPreferenceChange={(value) =>
                        setStudyPreference(value)
                      }
                      primaryGoal={primaryGoal}
                      studyPreference={studyPreference}
                    />
                  ) : null}
                </motion.div>
              </AnimatePresence>

              {clientError || actionState.error ? (
                <p
                  className="mt-6 border-[1.5px] border-red-900/40 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900"
                  role="alert"
                >
                  {clientError || actionState.error}
                </p>
              ) : null}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t-[1.5px] border-[#171512] bg-[#fffdf6]/95 px-5 py-4 sm:px-9">
              {step > 0 ? (
                <button
                  className="flex min-h-12 items-center gap-2 border-[1.5px] border-[#171512] bg-[#fffdf6] px-5 py-3 text-sm font-black shadow-[3px_3px_0_#171512] transition-transform hover:-translate-y-0.5"
                  onClick={goBack}
                  type="button"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <Link
                  className="text-sm font-bold text-[#171512]/55 underline decoration-dashed underline-offset-4"
                  href={isEditing ? '/dashboard' : '/'}
                >
                  {isEditing ? 'Cancel' : 'Do this later'}
                </Link>
              )}

              {step < STEPS.length - 1 ? (
                <button
                  className="flex min-h-12 items-center gap-2 border-[1.5px] border-[#171512] bg-[#17453a] px-6 py-3 text-sm font-black text-[#f6f1e5] shadow-[4px_4px_0_#171512] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#171512]"
                  onClick={goForward}
                  type="button"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <SubmitButton />
              )}
            </footer>
          </form>
        </section>
      </div>
    </main>
  )
}
