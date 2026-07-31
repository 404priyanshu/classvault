'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  BookOpenCheck,
  BrainCircuit,
  Check,
  FileText,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import owl from '@/assets/owl.webp'
import { ShinyButton } from '@/components/ui/shiny-button'
import { Spinner } from '@/components/ui/spinner'
import { MarkerHighlight } from '@/components/ui/stationery'

type Phase = { title: string; tasks: string[]; source: string; weeks: string }
type StudyMode = 'indepth' | 'exam'
type GenStep = { log: string; progress: number; phases: number; duration: number }

const TOPICS: Record<string, Phase[]> = {
  default: [
    { title: 'Foundations', weeks: 'Week 1', tasks: ['Skim overview notes & tag weak spots', 'Read 2 top-rated summaries', 'Self-quiz: 20 flash questions'], source: 'Top-rated public notes' },
    { title: 'Core concepts', weeks: 'Week 2–3', tasks: ['Work through unit-wise notes', 'Solve 30 practice problems', 'Join a study room twice this week'], source: 'University community notes' },
    { title: 'Practice & past papers', weeks: 'Week 4', tasks: ['Attempt 3 previous-year papers', 'Review mistakes against source notes', 'Re-rate notes you used'], source: 'PYQ collections' },
    { title: 'Revision sprint', weeks: 'Final days', tasks: ['One-page summaries per unit', 'Timed mock under exam conditions', 'Sleep. Seriously.'], source: 'Your saved roadmap' },
  ],
  exam: [
    { title: 'Triage', weeks: 'Day 1', tasks: ['List chapters by marks weightage', 'Collect highest-rated quick summaries', 'Cut anything below threshold'], source: 'Rated summaries' },
    { title: 'Rapid coverage', weeks: 'Day 2–4', tasks: ['2 units per day, notes + examples', 'Evening study-room accountability', 'Mark doubtful topics'], source: 'University notes' },
    { title: 'Past papers', weeks: 'Day 5–6', tasks: ['2 PYQs daily, timed', 'Pattern-spot repeated questions', 'Fix weak answers from source notes'], source: 'PYQ + answer keys' },
    { title: 'Final polish', weeks: 'Exam eve', tasks: ['Formula & diagram sheets only', 'One light mock', 'Early night — no all-nighter'], source: 'Your checklist' },
  ],
}

const SUGGESTIONS = ['Operating Systems', 'Thermodynamics', 'Data Structures', 'Microeconomics']

const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** Types text character by character, token-stream style. Instantly complete under reduced motion. */
function Typed({
  text,
  delay = 0,
  speed = 11,
  className = '',
  caret = false,
}: {
  text: string
  delay?: number
  speed?: number
  className?: string
  caret?: boolean
}) {
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)

  useEffect(() => {
    if (reduce) return
    let i = 0
    let interval: ReturnType<typeof setInterval> | undefined
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        i += 1
        setN(i)
        if (i >= text.length && interval) clearInterval(interval)
      }, speed)
    }, delay)
    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [text, delay, speed, reduce])

  const shown = reduce ? text : text.slice(0, n)
  const typing = shown.length < text.length
  return (
    <span className={className}>
      {shown}
      {caret && typing && (
        <span aria-hidden className="animate-caret-blink ml-0.5 inline-block h-[1em] w-[7px] translate-y-[2px] rounded-[1px] bg-[#f0a202]" />
      )}
    </span>
  )
}

/** The pulsing "AI core" — a spinning conic ring around a spark. */
function AICore({ active }: { active: boolean }) {
  return (
    <div className="relative h-11 w-11 shrink-0">
      <motion.div
        aria-hidden
        className="absolute -inset-1.5 rounded-full bg-[conic-gradient(from_0deg,#f0a202,#8fd6b4,#6cb4ee,#f0a202)] opacity-70 blur-[6px]"
        animate={active ? { rotate: 360 } : { rotate: 0, opacity: 0.35 }}
        transition={active ? { duration: 3.2, repeat: Infinity, ease: 'linear' } : { duration: 0.4 }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#f0a202,#8fd6b4,#6cb4ee,#f0a202)]"
        animate={active ? { rotate: 360 } : { rotate: 0 }}
        transition={active ? { duration: 2.2, repeat: Infinity, ease: 'linear' } : { duration: 0.4 }}
      />
      <div className="absolute inset-[3px] grid place-items-center rounded-full bg-[#0b1e19]">
        <Sparkles className="h-4 w-4 text-[#f0a202]" />
      </div>
    </div>
  )
}

function ThinkingDots() {
  return (
    <span aria-hidden className="ml-1 inline-flex items-end gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-[3px] w-[3px] rounded-full bg-[#f0a202]"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

function ConsoleHeader({
  phase,
  progressTarget,
  topic,
  mode,
}: {
  phase: 'generating' | 'done'
  progressTarget: number
  topic: string
  mode: StudyMode
}) {
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 80, damping: 20 })
  const display = useTransform(spring, (v) => `${Math.round(v)}`)

  useEffect(() => {
    mv.set(progressTarget)
  }, [mv, progressTarget])

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <AICore active={phase === 'generating'} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">ClassVault AI</p>
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-px font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">
                Sample demo
              </span>
            </div>
            <div className="mt-1 h-5">
              <AnimatePresence mode="wait" initial={false}>
                {phase === 'generating' ? (
                  <motion.p
                    key="gen"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-sm font-semibold text-[#f6f1e5]"
                    role="status"
                    aria-live="polite"
                  >
                    Generating your roadmap<ThinkingDots />
                  </motion.p>
                ) : (
                  <motion.p
                    key="ready"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#f6f1e5]"
                    role="status"
                    aria-live="polite"
                  >
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-[#8fd6b4] text-[#0b1e19]">
                      <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                    </span>
                    Roadmap ready
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-2xl font-bold tabular-nums text-[#f0a202]">
            <motion.span>{display}</motion.span>
            <span className="text-sm text-[#f0a202]/60">%</span>
          </p>
        </div>
      </div>

      <div className="mt-3 truncate font-mono text-[11px] text-white/40">
        <span className="text-[#8fd6b4]/80">{mode === 'exam' ? 'exam-revision' : 'in-depth'}</span>
        <span className="mx-1.5 text-white/20">·</span>
        {topic}
      </div>

      <div
        className="relative mt-3 h-[3px] overflow-hidden rounded-full bg-white/[0.08]"
        role="progressbar"
        aria-label="Roadmap generation progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressTarget}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#f0a202,#ffd166)]"
          animate={{ width: `${progressTarget}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
        />
        {phase === 'generating' && (
          <motion.div
            aria-hidden
            className="absolute inset-y-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]"
            animate={{ x: ['-110%', '340%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
    </div>
  )
}

function LogStream({ logs, done }: { logs: string[]; done: boolean }) {
  const shown = logs.slice(-3)
  return (
    <div className="mt-5 flex h-[66px] flex-col justify-end gap-[7px] overflow-hidden font-mono text-[11px] leading-none">
      <AnimatePresence initial={false}>
        {shown.map((log, i) => {
          const isLatest = i === shown.length - 1
          const settled = done || !isLatest
          return (
            <motion.div
              key={log}
              layout
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: settled ? (isLatest ? 0.85 : 0.4) : 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              {settled ? (
                <Check className="h-3 w-3 shrink-0 text-[#8fd6b4]" strokeWidth={3} />
              ) : (
                <motion.span
                  className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#f0a202]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                />
              )}
              {settled ? (
                <span className="text-white/70">{log}</span>
              ) : (
                <Typed text={log} caret speed={13} className="text-white/85" />
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function PhaseCard({
  phase,
  index,
  runId,
  building,
  interactive,
  checked,
  onToggle,
}: {
  phase: Phase
  index: number
  runId: number
  building: boolean
  interactive: boolean
  checked: Set<string>
  onToggle: (key: string) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18, scale: 0.98, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="relative"
    >
      {building && (
        <motion.div
          aria-hidden
          className="absolute -inset-px rounded-[13px] bg-[linear-gradient(120deg,rgba(240,162,2,0.5),rgba(143,214,180,0.25),rgba(240,162,2,0.5))]"
          animate={{ opacity: [0.35, 0.9, 0.35] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <div className="relative rounded-xl border border-white/10 bg-[#0e231d] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#f0a202]/15 font-mono text-[11px] font-bold text-[#f0a202]">
              {index + 1}
            </span>
            <p className="truncate text-sm font-bold text-[#f6f1e5]">
              {building ? <Typed text={phase.title} speed={16} /> : phase.title}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-white/55">
            {phase.weeks}
          </span>
        </div>

        <ul className="mt-3 space-y-2">
          {phase.tasks.map((task, ti) => {
            const key = `${index}-${ti}`
            const isChecked = checked.has(key)
            return (
              <li key={`${runId}-${key}`} className="flex items-center gap-2.5">
                <button
                  onClick={() => onToggle(key)}
                  disabled={!interactive}
                  aria-label={isChecked ? `Mark "${task}" as not done` : `Mark "${task}" as done`}
                  className={`grid h-[17px] w-[17px] shrink-0 place-items-center rounded-[5px] border transition-all duration-200 disabled:cursor-default ${
                    isChecked
                      ? 'border-[#f0a202] bg-[#f0a202] text-[#171512]'
                      : 'border-white/25 bg-transparent hover:border-[#f0a202]/70'
                  }`}
                >
                  {isChecked && <Check className="h-3 w-3" strokeWidth={3.5} />}
                </button>
                <span
                  className={`text-xs transition-colors duration-200 ${
                    isChecked ? 'text-white/30 line-through' : 'text-white/75'
                  }`}
                >
                  {building ? (
                    <Typed text={task} delay={220 + ti * 260} speed={11} caret={ti === phase.tasks.length - 1} />
                  ) : (
                    task
                  )}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.07] pt-2.5 font-mono text-[10px] text-white/40">
          <FileText className="h-3 w-3 text-[#8fd6b4]/70" />
          sources: {phase.source}
        </div>
      </div>
    </motion.div>
  )
}

export default function RoadmapDemo() {
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState<StudyMode>('indepth')
  const [phase, setPhase] = useState<'idle' | 'generating' | 'done'>('idle')
  const [genStep, setGenStep] = useState(0)
  const [runId, setRunId] = useState(0)
  const [generatedRequest, setGeneratedRequest] = useState<{ topic: string; mode: StudyMode }>({
    topic: 'Operating Systems',
    mode: 'indepth',
  })
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const reduceMotion = useReducedMotion()

  const displayTopic = topic.trim() || 'Operating Systems'
  const activeTopic = phase === 'idle' ? displayTopic : generatedRequest.topic
  const activeMode = phase === 'idle' ? mode : generatedRequest.mode
  const phases = useMemo(() => (activeMode === 'exam' ? TOPICS.exam : TOPICS.default), [activeMode])
  const totalTasks = phases.reduce((n, p) => n + p.tasks.length, 0)

  // The scripted generation timeline: three "agent" beats, then one beat per
  // roadmap phase, then a finalize beat. Demo data only — not a real pipeline.
  const steps = useMemo<GenStep[]>(() => {
    const timeline: GenStep[] = [
      { log: `Parsing topic “${activeTopic}”`, progress: 10, phases: 0, duration: 650 },
      { log: 'Scanning 128 rated notes · 6 collections', progress: 26, phases: 0, duration: 850 },
      { log: 'Verifying trust signals and access scope', progress: 42, phases: 0, duration: 750 },
    ]
    phases.forEach((p, i) => {
      timeline.push({
        log: `Composing phase ${i + 1} — ${p.title.toLowerCase()}`,
        progress: Math.round(42 + ((i + 1) / phases.length) * 52),
        phases: i + 1,
        duration: 1500,
      })
    })
    timeline.push({
      log: `Finalizing · ${totalTasks} tasks across ${phases.length} phases`,
      progress: 100,
      phases: phases.length,
      duration: 650,
    })
    return timeline
  }, [activeTopic, phases, totalTasks])

  const currentStep = steps[Math.min(genStep, steps.length - 1)]
  const visible = phase === 'done' ? phases.length : phase === 'generating' ? currentStep.phases : 0
  const buildingPhase = phase === 'generating' && visible > 0 ? visible - 1 : -1
  const logs = steps.slice(0, Math.min(genStep + 1, steps.length)).map((s) => s.log)
  const generationProgress = phase === 'done' ? 100 : phase === 'generating' ? currentStep.progress : 0

  useEffect(() => {
    if (phase !== 'generating') return
    if (genStep < steps.length - 1) {
      const t = setTimeout(() => setGenStep((s) => s + 1), reduceMotion ? 90 : currentStep.duration)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setPhase('done'), reduceMotion ? 90 : currentStep.duration)
    return () => clearTimeout(t)
  }, [phase, genStep, steps.length, reduceMotion, currentStep.duration])

  const generate = () => {
    setChecked(new Set())
    setGeneratedRequest({ topic: displayTopic, mode })
    setGenStep(0)
    setRunId((r) => r + 1)
    setPhase('generating')
  }

  const toggle = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const taskProgress = Math.round((checked.size / totalTasks) * 100)
  const modes = [
    { id: 'indepth' as const, label: 'In-depth study', icon: BrainCircuit },
    { id: 'exam' as const, label: 'Exam revision', icon: Zap },
  ]

  return (
    <MotionConfig reducedMotion="user">
    <section id="roadmap" className="relative overflow-hidden border-y-[1.5px] border-[#171512] bg-[#efe8d8] py-24">
      <div className="bg-ruled pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.2fr]">
          {/* left: controls */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-4">
              <span className="stamp text-[#17453a]">Interactive demo</span>
              <Image
                src={owl}
                alt="The ClassVault archivist owl"
                className="animate-wobble pointer-events-none hidden h-20 w-auto select-none sm:block"
                draggable={false}
              />
            </div>
            <h2 id="roadmap-heading" className="font-display mt-5 text-3xl font-black tracking-tight md:text-5xl">
              Generate a roadmap.<br />
              <MarkerHighlight>Right here, right now.</MarkerHighlight>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#171512]/70">
              This is a taste of the real thing. On ClassVault, roadmaps are generated from
              notes your plan can actually use — your uploads, public notes, and (on Pro)
              top university notes too.
            </p>

            <div className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#171512]/60">Your topic</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Operating Systems"
                  className="w-full rounded-xl border-[1.5px] border-[#171512] bg-[#fffdf6] px-4 py-3 text-sm font-medium shadow-[3px_3px_0_#171512] outline-none transition-all placeholder:text-[#171512]/40 focus:shadow-[5px_5px_0_#171512]"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <motion.button key={s} onClick={() => setTopic(s)} whileTap={{ scale: 0.94 }}
                      className="rounded-full border-[1.5px] border-[#171512] bg-[#fffdf6] px-3 py-1 text-xs font-semibold transition-all hover:bg-[#f0a202] hover:shadow-[2px_2px_0_#171512]">
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#171512]/60">Study mode</label>
                <div className="grid grid-cols-2 gap-1 rounded-xl border-[1.5px] border-[#171512] bg-[#fffdf6] p-1 shadow-[3px_3px_0_#171512]">
                  {modes.map((m) => {
                    const Icon = m.icon
                    const selected = mode === m.id
                    return (
                      <motion.button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        whileTap={{ scale: 0.97 }}
                        aria-pressed={selected}
                        className="relative rounded-lg px-4 py-2.5 text-sm font-semibold"
                      >
                        {selected && (
                          <motion.span
                            layoutId="mode-pill"
                            className="absolute inset-0 rounded-lg bg-[#17453a]"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          />
                        )}
                        <span className={`relative z-[1] flex items-center justify-center gap-2 transition-colors ${selected ? 'text-[#f6f1e5]' : 'text-[#171512]/55'}`}>
                          <Icon className="h-4 w-4 shrink-0" />
                          {m.label}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              <ShinyButton
                onClick={generate}
                disabled={phase === 'generating'}
                className="w-full"
              >
                {phase === 'generating' ? (
                  <><Spinner className="size-5" decorative size={20} /> Building sample roadmap…</>
                ) : phase === 'done' ? (
                  <><RotateCcw className="h-4 w-4" /> Regenerate roadmap</>
                ) : (
                  <><BookOpenCheck className="h-4 w-4" /> Generate my roadmap</>
                )}
              </ShinyButton>
            </div>
          </motion.div>

          {/* right: AI console */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative min-h-[560px] overflow-hidden rounded-2xl border border-[#171512]/60 bg-[linear-gradient(160deg,#0d211c_0%,#0b1e19_55%,#091a15_100%)] p-5 shadow-[8px_8px_0_rgba(23,21,18,0.18)] md:p-7"
            role="region"
            aria-labelledby="roadmap-heading"
            aria-busy={phase === 'generating'}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(246,241,229,0.05)_1px,transparent_1px)] [background-size:22px_22px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-48 w-2/3 -translate-x-1/2 rounded-full bg-[#f0a202]/[0.07] blur-3xl"
            />

            <AnimatePresence mode="wait">
              {phase === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                  className="relative flex h-[520px] flex-col items-center justify-center text-center"
                >
                  <div className="relative">
                    <motion.div
                      aria-hidden
                      className="absolute -inset-4 rounded-full border border-white/10"
                      animate={{ scale: [1, 1.25], opacity: [0.5, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <AICore active={false} />
                  </div>
                  <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">Ready when you are</p>
                  <p className="mt-2 max-w-[240px] text-sm font-medium leading-relaxed text-white/60">
                    Pick a topic and mode — your generated roadmap streams in here.
                  </p>
                </motion.div>
              )}

              {(phase === 'generating' || phase === 'done') && (
                <motion.div
                  key="console"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  <ConsoleHeader
                    phase={phase}
                    progressTarget={generationProgress}
                    topic={activeTopic}
                    mode={activeMode}
                  />

                  <LogStream logs={logs} done={phase === 'done'} />

                  {phase === 'done' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mt-4"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
                        <span>Your progress</span>
                        <span className="tabular-nums text-white/60">{checked.size} / {totalTasks} tasks</span>
                      </div>
                      <div
                        className="mt-2 h-[5px] overflow-hidden rounded-full bg-white/[0.08]"
                        role="progressbar"
                        aria-label="Roadmap task completion"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={taskProgress}
                      >
                        <motion.div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#8fd6b4,#f0a202)]"
                          animate={{ width: `${taskProgress}%` }}
                          transition={{ type: 'spring', stiffness: 130, damping: 22 }}
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-5 space-y-3">
                    {phases.slice(0, visible).map((p, pi) => (
                      <PhaseCard
                        key={`${runId}-${p.title}`}
                        phase={p}
                        index={pi}
                        runId={runId}
                        building={pi === buildingPhase}
                        interactive={phase === 'done'}
                        checked={checked}
                        onToggle={toggle}
                      />
                    ))}
                  </div>

                  <AnimatePresence>
                    {phase === 'done' && taskProgress === 100 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                        className="mt-6 flex justify-center"
                      >
                        <span className="flex items-center gap-2 rounded-full border border-[#f0a202]/30 bg-[#f0a202]/10 px-4 py-1.5 text-xs font-semibold text-[#f0a202]">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          Sample roadmap complete
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
          className="font-hand mt-10 text-center text-xl text-[#171512]/60"
        >
          want roadmaps built from your real notes?{' '}
          <a
            href="/auth/sign-up"
            className="font-bold text-[#17453a] underline decoration-dashed decoration-2 underline-offset-4 transition-colors hover:text-[#171512]"
          >
            create your vault free →
          </a>
        </motion.p>
      </div>
    </section>
    </MotionConfig>
  )
}
