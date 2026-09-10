'use client'

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Headphones,
  Users,
  HeartHandshake,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { completeOnboardingAction } from '@/app/onboarding/actions'
import { JourneyShell } from '@/components/journey/JourneyShell'
import type { PencilMood } from '@/components/journey/PencilGuide'
import { Spinner } from '@/components/ui/spinner'
import styles from '@/components/journey/Journey.module.css'
import { CampusStep } from './CampusStep'
import { Choice } from './Choice'
import { COURSE_OPTIONS, GOALS, STUDY_PREFERENCES } from './constants'
import { normalizeCourse } from './helpers'
import { draftKey, parseDraft } from './draft'
import { INITIAL_ACTION_STATE, type OnboardingFlowProps } from './types'

const screens = [
  {
    label: 'Your name',
    title: 'What should we call you?',
    description:
      'Your name helps make this space feel like yours. A nickname works, too.',
    message: 'Nice to meet you. Let’s make this yours.',
  },
  {
    label: 'Your campus',
    title: 'Where do you study?',
    description:
      'Find your university so we can connect your account to the right campus.',
    message: 'Every good study session starts somewhere.',
  },
  {
    label: 'Your course',
    title: 'What’s your academic path?',
    description:
      'Your degree and graduation year help us understand where you are in your studies.',
    message: 'One small step toward your next chapter.',
  },
  {
    label: 'Your goal',
    title: 'What are you working toward?',
    description:
      'Choose what matters most right now. You can change this later.',
    message: 'Big goals. Small, steady steps.',
  },
  {
    label: 'Your rhythm',
    title: 'How do you like to study?',
    description:
      'There’s no right answer. Pick the rhythm that feels most like you.',
    message: 'Your pace is a good pace.',
  },
]

export function OnboardingFlow({
  accountEmail,
  initialProfile,
  isEditing,
  universities,
  userId,
}: OnboardingFlowProps) {
  const reducedMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    ...initialProfile,
    course: normalizeCourse(initialProfile.course),
    graduationYear: String(initialProfile.graduationYear),
  })
  const [ready, setReady] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [reaction, setReaction] = useState<PencilMood>('welcome')
  const [actionState, formAction, pending] = useActionState(
    completeOnboardingAction,
    INITIAL_ACTION_STATE,
  )
  const [slow, setSlow] = useState(false)
  const [dismissedError, setDismissedError] = useState<string | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const wasMounted = useRef(false)
  const error = pending
    ? null
    : clientError ||
      (dismissedError !== actionState.error ? actionState.error : null)

  useEffect(() => {
    const task = requestAnimationFrame(() => {
      try {
        const draft = parseDraft(
          sessionStorage.getItem(draftKey(userId)),
          universities.map((university) => university.id),
        )
        if (draft) {
          setAnswers(draft)
          setStep(draft.step)
        }
      } catch {
        /* Private browsing may disable storage; in-memory answers still work. */
      }
      setReady(true)
    })
    return () => cancelAnimationFrame(task)
  }, [userId, universities])

  useEffect(() => {
    if (!ready) return
    try {
      sessionStorage.setItem(
        draftKey(userId),
        JSON.stringify({ ...answers, step, savedAt: Date.now() }),
      )
    } catch {
      /* Storage is an enhancement, never a submission requirement. */
    }
  }, [answers, step, ready, userId])

  useEffect(() => {
    if (wasMounted.current) heading.current?.focus({ preventScroll: true })
    wasMounted.current = true
  }, [step])
  useEffect(() => {
    if (!pending) return
    const timer = setTimeout(() => setSlow(true), 12000)
    return () => clearTimeout(timer)
  }, [pending])

  function change(key: keyof typeof answers, value: string | number | null) {
    setAnswers((current) => ({ ...current, [key]: value }))
    setClientError(null)
    setDismissedError(actionState.error)
    setReaction('acknowledge')
  }
  function validate() {
    const year = Number(answers.graduationYear)
    const message =
      step === 0 && answers.displayName.trim().length < 2
        ? 'Use at least two characters for your name.'
        : step === 1 && !answers.universityId
          ? 'Choose your university from the search results.'
          : step === 2 &&
              (!answers.course ||
                !Number.isInteger(year) ||
                year < 2000 ||
                year > 2100)
            ? 'Choose your degree and a graduation year between 2000 and 2100.'
            : step === 3 && !answers.primaryGoal
              ? 'Choose the goal that matters most to you.'
              : step === 4 && !answers.studyPreference
                ? 'Choose a study style to finish your setup.'
                : null
    setClientError(message)
    return !message
  }
  function navigate(next: number) {
    setStep(next)
    setClientError(null)
    setDismissedError(actionState.error)
    setReaction('welcome')
  }
  const screen = screens[step]
  const mood = error ? 'help' : pending ? 'thinking' : reaction

  return (
    <JourneyShell
      mood={mood}
      message={
        error
          ? 'No rush. We can fix this together.'
          : pending
            ? 'Saving your choices. Almost there.'
            : reaction === 'acknowledge'
              ? 'Got it. A little more you.'
              : screen.message
      }
    >
      <div className={styles.progress}>
        <div
          className={styles.segments}
          role="progressbar"
          aria-label="Student setup"
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuenow={step}
          aria-valuetext={`${step} of 5 steps completed. ${screen.label}.`}
        >
          {screens.map((item, index) => (
            <span
              key={item.label}
              className={styles.segment}
              data-complete={index < step}
              data-current={index === step}
            />
          ))}
        </div>
        <p>
          Step {step + 1} of 5 · {screen.label}
        </p>
      </div>
      <form
        action={formAction}
        onReset={(event) => event.preventDefault()}
        className={styles.form}
        aria-busy={pending}
        onSubmit={(event) => {
          if (pending || !validate()) {
            event.preventDefault()
            return
          }
          if (step < 4) {
            event.preventDefault()
            navigate(step + 1)
            return
          }
          setDismissedError(null)
          setSlow(false)
        }}
      >
        {Object.entries(answers)
          .filter(([key]) =>
            [
              'displayName',
              'course',
              'graduationYear',
              'universityId',
              'primaryGoal',
              'studyPreference',
            ].includes(key),
          )
          .map(([key, value]) => (
            <input key={key} name={key} type="hidden" value={value ?? ''} />
          ))}
        <fieldset disabled={pending || !ready} className={styles.step}>
          <legend className="sr-only">{screen.label}</legend>
          <motion.div
            key={step}
            initial={reducedMotion ? false : { x: 12 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.18 }}
          >
            <h1 ref={heading} tabIndex={-1} className={styles.heading}>
              {screen.title}
            </h1>
            <p className={styles.description}>{screen.description}</p>
            {step === 0 ? (
              <div className={styles.fields}>
                <label htmlFor="display-name" className={styles.label}>
                  Display name
                </label>
                <input
                  id="display-name"
                  className={styles.input}
                  autoComplete="nickname"
                  maxLength={80}
                  value={answers.displayName}
                  onChange={(event) =>
                    change('displayName', event.target.value)
                  }
                  placeholder="Your name or nickname"
                  aria-invalid={!!clientError}
                  aria-describedby="name-hint"
                />
                <p id="name-hint" className={styles.hint}>
                  This appears on your profile. You can update it in settings.
                </p>
              </div>
            ) : null}
            {step === 1 ? (
              <CampusStep
                accountEmail={accountEmail}
                universities={universities}
                universityId={answers.universityId}
                onSelect={(id) => change('universityId', id)}
                invalid={!!clientError}
              />
            ) : null}
            {step === 2 ? (
              <div className={styles.fields}>
                <fieldset>
                  <legend className={styles.label}>Your degree</legend>
                  <div className={`${styles.choices} ${styles.degrees}`}>
                    {COURSE_OPTIONS.map((course) => (
                      <Choice
                        key={course}
                        group="degree-choice"
                        value={course}
                        label={course}
                        checked={answers.course === course}
                        onChange={(value) => change('course', value)}
                      />
                    ))}
                  </div>
                </fieldset>
                <label className={styles.label} htmlFor="graduation-year">
                  Graduation year
                </label>
                <input
                  id="graduation-year"
                  className={styles.input}
                  inputMode="numeric"
                  maxLength={4}
                  value={answers.graduationYear}
                  onChange={(event) =>
                    change(
                      'graduationYear',
                      event.target.value.replace(/\D/g, ''),
                    )
                  }
                  aria-describedby="year-hint"
                />
                <p className={styles.hint} id="year-hint">
                  Your expected year is fine if you’re still studying.
                </p>
              </div>
            ) : null}
            {step === 3 ? (
              <fieldset>
                <legend className="sr-only">Main study goal</legend>
                <div className={styles.choices}>
                  {GOALS.map(({ icon: Icon, ...goal }) => (
                    <Choice
                      key={goal.value}
                      group="goal-choice"
                      {...goal}
                      icon={<Icon aria-hidden="true" />}
                      checked={answers.primaryGoal === goal.value}
                      onChange={(value) => change('primaryGoal', value)}
                    />
                  ))}
                </div>
              </fieldset>
            ) : null}
            {step === 4 ? (
              <fieldset>
                <legend className="sr-only">Study preference</legend>
                <div className={styles.choices}>
                  {STUDY_PREFERENCES.map((preference, index) => {
                    const Icon = [Headphones, HeartHandshake, Users][index]
                    return (
                      <Choice
                        key={preference.value}
                        group="preference-choice"
                        {...preference}
                        icon={<Icon aria-hidden="true" />}
                        checked={answers.studyPreference === preference.value}
                        onChange={(value) => change('studyPreference', value)}
                      />
                    )
                  })}
                </div>
                <p className={styles.hint}>
                  You’ll still have access to public notes and study rooms,
                  whichever you choose.
                </p>
              </fieldset>
            ) : null}
          </motion.div>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
        </fieldset>
        <div className={styles.actions}>
          {step > 0 ? (
            <button
              type="button"
              className={styles.back}
              disabled={pending}
              onClick={() => navigate(step - 1)}
            >
              <ArrowLeft aria-hidden="true" />
              Back
            </button>
          ) : (
            <Link
              className={styles.back}
              href={isEditing ? '/dashboard/settings' : '/'}
            >
              {isEditing ? 'Cancel' : 'Back to home'}
            </Link>
          )}
          <button
            type="submit"
            className={styles.primary}
            disabled={pending || !ready}
          >
            {pending ? <Spinner decorative size={22} /> : null}
            {pending
              ? 'Saving your setup…'
              : step === 4
                ? 'Finish setup'
                : 'Continue'}
            {!pending ? (
              step === 4 ? (
                <BookOpen aria-hidden="true" />
              ) : (
                <ArrowRight aria-hidden="true" />
              )
            ) : null}
          </button>
        </div>
        {pending ? (
          <p className={styles.saveStatus} role="status">
            {slow
              ? 'This is taking longer than usual. Keep this tab open while we finish. If the connection has stalled, reload to try recovering your setup.'
              : 'We’re saving your profile and checking campus access.'}
          </p>
        ) : null}
      </form>
    </JourneyShell>
  )
}
