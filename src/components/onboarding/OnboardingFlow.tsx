'use client'

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleUserRound,
  GraduationCap,
  LockKeyhole,
  Mail,
  Search,
  Smartphone,
  Sparkles,
  Target,
  UsersRound,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useActionState, useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Spinner } from '@/components/ui/spinner'
import owl from '@/assets/owl.webp'
import {
  completeOnboardingAction,
  type OnboardingActionState,
} from '@/app/onboarding/actions'

type University = {
  city: string | null
  domains: string[]
  id: number
  name: string
  shortName: string | null
  state: string | null
}

type OnboardingFlowProps = {
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

const STEPS = [
  {
    description: 'Your name and academic path',
    icon: CircleUserRound,
    label: 'Your identity',
  },
  {
    description: 'The community you belong to',
    icon: Building2,
    label: 'Your campus',
  },
  {
    description: 'How ClassVault should help',
    icon: CalendarDays,
    label: 'Study rhythm',
  },
]

const GOALS = [
  {
    description: 'Turn the syllabus into a clear revision plan.',
    icon: Target,
    label: 'Ace my exams',
    value: 'ace_exams',
  },
  {
    description: 'Build momentum without last-minute panic.',
    icon: CalendarDays,
    label: 'Stay consistent',
    value: 'stay_consistent',
  },
  {
    description: 'Go deeper on difficult concepts and subjects.',
    icon: BookOpen,
    label: 'Master my subjects',
    value: 'master_subjects',
  },
  {
    description: 'Balance coursework with interview preparation.',
    icon: Sparkles,
    label: 'Prepare for placements',
    value: 'placement_prep',
  },
]

const STUDY_PREFERENCES = [
  {
    description: 'Quiet focus with a plan I can follow.',
    label: 'Mostly solo',
    value: 'solo',
  },
  {
    description: 'A little structure and someone keeping pace.',
    label: 'Accountability',
    value: 'accountability',
  },
  {
    description: 'Live rooms and shared study sessions.',
    label: 'Study groups',
    value: 'study_group',
  },
]

const COURSE_OPTIONS = ['MCA', 'BCA', 'B.Tech', 'M.Tech'] as const

const INITIAL_ACTION_STATE: OnboardingActionState = { error: null }

function getEmailDomain(email: string) {
  return email.toLowerCase().split('@')[1] || ''
}

function emailMatchesUniversity(email: string, university?: University) {
  if (!university) {
    return false
  }

  const emailDomain = getEmailDomain(email)
  return university.domains.some(
    (domain) => emailDomain === domain || emailDomain.endsWith(`.${domain}`),
  )
}

function normalizeCourse(course: string) {
  const normalized = course.trim().toLowerCase().replaceAll(' ', '')

  if (normalized.startsWith('mca')) return 'MCA'
  if (normalized.startsWith('bca')) return 'BCA'
  if (normalized.startsWith('b.tech') || normalized.startsWith('btech')) {
    return 'B.Tech'
  }
  if (normalized.startsWith('m.tech') || normalized.startsWith('mtech')) {
    return 'M.Tech'
  }

  return ''
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      className="flex min-h-12 items-center justify-center gap-2 border-[1.5px] border-[#171512] bg-[#17453a] px-6 py-3 text-sm font-black text-[#f6f1e5] shadow-[4px_4px_0_#171512] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#171512] disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <Spinner className="size-6" decorative size={24} />
      ) : null}
      {pending ? 'Setting up your vault…' : 'Finish setup'}
      {pending ? null : <ArrowRight className="h-4 w-4" />}
    </button>
  )
}

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
        <aside className="hidden border-r-[1.5px] border-[#171512]/35 px-9 py-10 lg:flex lg:flex-col">
          <Link className="flex items-center gap-2.5" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-lg border-[1.5px] border-[#171512] bg-[#17453a] shadow-[3px_3px_0_#171512]">
              <BookOpen className="h-5 w-5 text-[#f6f1e5]" />
            </span>
            <span className="font-display text-xl font-black">
              Class<span className="text-[#17453a]">Vault</span>
            </span>
          </Link>

          <h1 className="font-display mt-16 text-6xl font-black leading-[0.93] tracking-[-0.04em]">
            Make
            <br />
            ClassVault
            <br />
            <span className="italic text-[#17453a]">yours.</span>
          </h1>

          <ol className="mt-14 space-y-1">
            {STEPS.map((item, index) => {
              const Icon = item.icon
              const isActive = index === step
              const isComplete = index < step

              return (
                <li className="relative flex min-h-24 gap-4" key={item.label}>
                  {index < STEPS.length - 1 ? (
                    <span
                      className={`absolute left-[19px] top-10 h-[calc(100%-16px)] border-l-[1.5px] ${
                        index < step
                          ? 'border-[#17453a]'
                          : 'border-dashed border-[#171512]/35'
                      }`}
                    />
                  ) : null}
                  <span
                    className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] text-sm font-black ${
                      isActive || isComplete
                        ? 'border-[#17453a] bg-[#17453a] text-[#f6f1e5]'
                        : 'border-[#171512] bg-[#f6f1e5]'
                    }`}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <div className="pt-1">
                    <div
                      className={`flex items-center gap-2 font-bold ${
                        isActive ? 'text-[#17453a]' : ''
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#171512]/50">
                      {item.description}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="mt-auto flex items-end gap-3 pt-6">
            <Image
              alt=""
              aria-hidden
              className="h-auto w-24"
              draggable={false}
              src={owl}
            />
            <p className="font-hand pb-3 text-xl leading-tight text-[#17453a]">
              Small setup.
              <br />
              Smarter semester.
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col px-4 py-5 sm:px-7 sm:py-7 lg:px-12 lg:py-9">
          <header className="flex items-center justify-between gap-4 lg:justify-end">
            <Link className="flex items-center gap-2 lg:hidden" href="/">
              <span className="grid h-9 w-9 place-items-center rounded-lg border-[1.5px] border-[#171512] bg-[#17453a] shadow-[2px_2px_0_#171512]">
                <BookOpen className="h-4 w-4 text-[#f6f1e5]" />
              </span>
              <span className="font-display text-lg font-black">ClassVault</span>
            </Link>

            <div className="flex items-center gap-3">
              <LockKeyhole className="hidden h-4 w-4 text-[#17453a] sm:block" />
              <span className="text-xs font-bold text-[#171512]/60">
                Secure setup
              </span>
              <div
                aria-label={`Step ${step + 1} of ${STEPS.length}`}
                className="h-2 w-24 overflow-hidden rounded-full border border-[#171512]/50 bg-[#fffdf6] sm:w-36"
                role="progressbar"
                aria-valuemax={STEPS.length}
                aria-valuemin={1}
                aria-valuenow={step + 1}
              >
                <motion.div
                  animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                  className="h-full bg-[#17453a]"
                  transition={
                    prefersReducedMotion ? { duration: 0 } : { duration: 0.35 }
                  }
                />
              </div>
              <span className="text-xs font-black">
                {step + 1} of {STEPS.length}
              </span>
            </div>
          </header>

          <div className="mt-6 lg:hidden">
            <div className="flex items-center justify-between">
              {STEPS.map((item, index) => (
                <div
                  className="flex min-w-0 flex-1 items-center last:flex-none"
                  key={item.label}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-[1.5px] text-xs font-black ${
                      index <= step
                        ? 'border-[#17453a] bg-[#17453a] text-[#f6f1e5]'
                        : 'border-[#171512] bg-[#f6f1e5]'
                    }`}
                  >
                    {index < step ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  {index < STEPS.length - 1 ? (
                    <span
                      className={`mx-2 h-[1.5px] flex-1 ${
                        index < step
                          ? 'bg-[#17453a]'
                          : 'border-t-[1.5px] border-dashed border-[#171512]/40'
                      }`}
                    />
                  ) : null}
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-3 text-center text-[10px] font-bold text-[#171512]/55">
              {STEPS.map((item, index) => (
                <span className={index === step ? 'text-[#17453a]' : ''} key={item.label}>
                  {item.label}
                </span>
              ))}
            </div>
          </div>

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
                    <div>
                      <h2 className="font-display max-w-2xl text-4xl font-black leading-[1.02] tracking-[-0.03em] sm:text-5xl">
                        First, tell us who&apos;s studying.
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#171512]/60 sm:text-base">
                        These details shape your profile and help us organize the
                        right academic experience around you.
                      </p>

                      <div className="mt-9 grid gap-6 sm:grid-cols-2">
                        <label className="block sm:col-span-2">
                          <span className="text-sm font-black">Your name</span>
                          <span className="mt-1 block text-xs text-[#171512]/50">
                            Use the name classmates should see.
                          </span>
                          <input
                            autoComplete="name"
                            className="mt-2 h-[52px] w-full border-[1.5px] border-[#171512] bg-[#fffdf6] px-4 text-base font-semibold outline-none transition-shadow focus:shadow-[3px_3px_0_#f0a202]"
                            maxLength={80}
                            minLength={2}
                            onChange={(event) => {
                              setDisplayName(event.target.value)
                              setClientError(null)
                            }}
                            placeholder="Akruti Tiwari"
                            required
                            value={displayName}
                          />
                        </label>

                        <label className="block">
                          <span className="text-sm font-black">Course or degree</span>
                          <span className="mt-1 block text-xs text-[#171512]/50">
                            Your current academic program.
                          </span>
                          <div className="relative mt-2">
                            <GraduationCap className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#17453a]" />
                            <select
                              className="h-[52px] w-full appearance-none border-[1.5px] border-[#171512] bg-[#fffdf6] pl-11 pr-11 text-base font-semibold outline-none transition-shadow focus:shadow-[3px_3px_0_#f0a202]"
                              onChange={(event) => {
                                setCourse(event.target.value)
                                setClientError(null)
                              }}
                              required
                              value={course}
                            >
                              <option disabled value="">
                                Select your degree
                              </option>
                              {COURSE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#17453a]" />
                          </div>
                        </label>

                        <label className="block">
                          <span className="text-sm font-black">Graduation year</span>
                          <span className="mt-1 block text-xs text-[#171512]/50">
                            Your expected year of graduation.
                          </span>
                          <div className="relative mt-2">
                            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#17453a]" />
                            <input
                              className="h-[52px] w-full border-[1.5px] border-[#171512] bg-[#fffdf6] pl-11 pr-4 text-base font-semibold outline-none transition-shadow focus:shadow-[3px_3px_0_#f0a202]"
                              inputMode="numeric"
                              max={new Date().getFullYear() + 12}
                              min={new Date().getFullYear()}
                              onChange={(event) => {
                                setGraduationYear(event.target.value)
                                setClientError(null)
                              }}
                              required
                              type="number"
                              value={graduationYear}
                            />
                          </div>
                        </label>
                      </div>
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div>
                      <h2 className="font-display max-w-2xl text-4xl font-black leading-[1.02] tracking-[-0.03em] sm:text-5xl">
                        Which campus do you call home?
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#171512]/60 sm:text-base">
                        Choose your university to unlock the right notes and
                        communities.
                      </p>

                      <div className="mt-7 border-[1.5px] border-[#17453a]/55 bg-[#17453a]/5 p-4">
                        <div className="flex items-start gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#17453a] text-[#f6f1e5]">
                            {accountEmail ? (
                              <Mail className="h-4 w-4" />
                            ) : (
                              <Smartphone className="h-4 w-4" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#171512]/50">
                              Signed in with {accountEmail ? 'email' : 'phone'}
                            </p>
                            <p className="truncate font-black text-[#17453a]">
                              {accountIdentifier}
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-[#171512]/60">
                              {!accountEmail ? (
                                <>
                                  You can continue with your verified phone
                                  number. University-only access will remain
                                  pending until a verified academic email is
                                  added.
                                </>
                              ) : activeUniversity ? (
                                willVerify ? (
                                  <>
                                    Your confirmed email matches{' '}
                                    <strong>{activeUniversity.shortName || activeUniversity.name}</strong>.
                                    Campus access will be verified automatically.
                                  </>
                                ) : (
                                  <>
                                    You can continue, but university-only access
                                    will remain pending until this email domain is
                                    verified for your campus.
                                  </>
                                )
                              ) : (
                                'Verification is checked automatically after you choose a campus.'
                              )}
                            </p>
                          </div>
                          {activeUniversity && willVerify ? (
                            <Check className="ml-auto h-5 w-5 shrink-0 text-[#17453a]" />
                          ) : null}
                        </div>
                      </div>

                      <div className="relative mt-6">
                        <label className="relative block">
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#17453a]" />
                          <span className="sr-only">
                            Search for your university
                          </span>
                          <input
                            aria-autocomplete="list"
                            aria-controls="university-search-results"
                            aria-expanded={showUniversityResults}
                            className="h-[52px] w-full border-[1.5px] border-[#171512] bg-[#fffdf6] pl-12 pr-4 text-sm font-semibold outline-none transition-shadow placeholder:font-normal focus:shadow-[3px_3px_0_#f0a202]"
                            onChange={(event) => {
                              const value = event.target.value
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
                            onFocus={() =>
                              setIsUniversitySearchOpen(
                                universityQuery.trim().length >= 2,
                              )
                            }
                            placeholder="Start typing your college name"
                            role="combobox"
                            type="search"
                            value={universityQuery}
                          />
                        </label>

                        {showUniversityResults ? (
                          <div
                            className="absolute inset-x-0 top-[calc(100%+8px)] z-20 max-h-[290px] overflow-y-auto border-[1.5px] border-[#171512] bg-[#fffdf6] shadow-[4px_4px_0_#171512]"
                            id="university-search-results"
                            role="listbox"
                          >
                            {filteredUniversities.length ? (
                              filteredUniversities.map((university) => {
                                const selected =
                                  university.id === universityId

                                return (
                                  <button
                                    aria-selected={selected}
                                    className={`flex w-full items-center gap-3 border-b border-[#171512]/15 px-4 py-3 text-left last:border-b-0 ${
                                      selected
                                        ? 'bg-[#17453a] text-[#f6f1e5]'
                                        : 'hover:bg-[#f0a202]/10'
                                    }`}
                                    key={university.id}
                                    onClick={() => {
                                      setUniversityId(university.id)
                                      setUniversityQuery(university.name)
                                      setIsUniversitySearchOpen(false)
                                      setClientError(null)
                                    }}
                                    role="option"
                                    type="button"
                                  >
                                    <Building2 className="h-5 w-5 shrink-0" />
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-sm font-black">
                                        {university.name}
                                      </span>
                                      <span
                                        className={`mt-0.5 block text-xs ${
                                          selected
                                            ? 'text-[#f6f1e5]/65'
                                            : 'text-[#171512]/50'
                                        }`}
                                      >
                                        {[university.city, university.state]
                                          .filter(Boolean)
                                          .join(', ')}
                                      </span>
                                    </span>
                                    {selected ? (
                                      <Check className="h-4 w-4 shrink-0" />
                                    ) : null}
                                  </button>
                                )
                              })
                            ) : (
                              <p className="px-5 py-8 text-center text-sm text-[#171512]/55">
                                No college matches that search yet.
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {activeUniversity ? (
                        <div className="mt-3 flex items-center gap-3 border-[1.5px] border-[#17453a] bg-[#17453a] px-4 py-3 text-[#f6f1e5]">
                          <Building2 className="h-5 w-5 shrink-0" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-black">
                              {activeUniversity.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-[#f6f1e5]/65">
                              {[activeUniversity.city, activeUniversity.state]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          </span>
                          <Check className="h-4 w-4 shrink-0" />
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-[#171512]/50">
                          Type at least two characters, then choose a college
                          from the results.
                        </p>
                      )}
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div>
                      <h2 className="font-display max-w-2xl text-4xl font-black leading-[1.02] tracking-[-0.03em] sm:text-5xl">
                        What should this semester feel like?
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#171512]/60 sm:text-base">
                        Pick the goal and study rhythm that fit you now. You can
                        change both later.
                      </p>

                      <fieldset className="mt-8">
                        <legend className="text-sm font-black">
                          Your main goal
                        </legend>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {GOALS.map((goal) => {
                            const Icon = goal.icon
                            const selected = primaryGoal === goal.value

                            return (
                              <button
                                aria-pressed={selected}
                                className={`flex items-start gap-3 border-[1.5px] p-4 text-left transition-all ${
                                  selected
                                    ? 'border-[#171512] bg-[#f0a202]/25 shadow-[3px_3px_0_#171512]'
                                    : 'border-[#171512]/35 bg-[#fffdf6] hover:border-[#171512]'
                                }`}
                                key={goal.value}
                                onClick={() => setPrimaryGoal(goal.value)}
                                type="button"
                              >
                                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#17453a]" />
                                <span>
                                  <span className="block text-sm font-black">
                                    {goal.label}
                                  </span>
                                  <span className="mt-1 block text-xs leading-relaxed text-[#171512]/55">
                                    {goal.description}
                                  </span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </fieldset>

                      <fieldset className="mt-7">
                        <legend className="text-sm font-black">
                          You study best with
                        </legend>
                        <div className="mt-3 grid gap-2">
                          {STUDY_PREFERENCES.map((preference) => {
                            const selected =
                              studyPreference === preference.value

                            return (
                              <button
                                aria-pressed={selected}
                                className={`flex items-center gap-3 border-[1.5px] px-4 py-3 text-left ${
                                  selected
                                    ? 'border-[#17453a] bg-[#17453a] text-[#f6f1e5]'
                                    : 'border-[#171512]/30 bg-[#fffdf6] hover:border-[#171512]'
                                }`}
                                key={preference.value}
                                onClick={() =>
                                  setStudyPreference(preference.value)
                                }
                                type="button"
                              >
                                <UsersRound className="h-4 w-4 shrink-0" />
                                <span className="min-w-0 flex-1">
                                  <span className="text-sm font-black">
                                    {preference.label}
                                  </span>
                                  <span
                                    className={`ml-2 text-xs ${
                                      selected
                                        ? 'text-[#f6f1e5]/65'
                                        : 'text-[#171512]/50'
                                    }`}
                                  >
                                    {preference.description}
                                  </span>
                                </span>
                                {selected ? <Check className="h-4 w-4" /> : null}
                              </button>
                            )
                          })}
                        </div>
                      </fieldset>
                    </div>
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
