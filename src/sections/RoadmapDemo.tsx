'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion'
import { BookOpenCheck, Check, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import owl from '@/assets/owl.webp'
import { MarkerHighlight } from '@/components/ui/stationery'
import { ConsoleFrameHeader } from './roadmap-demo/ConsoleFrameHeader'
import { ConsoleHeader } from './roadmap-demo/ConsoleHeader'
import { GenerateButton } from './roadmap-demo/GenerateButton'
import { IdlePreview } from './roadmap-demo/IdlePreview'
import { LogStream } from './roadmap-demo/LogStream'
import { PhaseCard } from './roadmap-demo/PhaseCard'
import { PhaseRail } from './roadmap-demo/PhaseRail'
import { EASE_OUT, SUGGESTIONS, STUDY_MODES, TOPICS } from './roadmap-demo/plans'
import type { GenStep, StudyMode } from './roadmap-demo/types'

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
      { log: `Parsing topic “${activeTopic}”`, progress: 10, phases: 0, duration: 450 },
      { log: 'Scanning 128 rated notes · 6 collections', progress: 26, phases: 0, duration: 600 },
      { log: 'Verifying trust signals and access scope', progress: 42, phases: 0, duration: 500 },
    ]
    phases.forEach((p, i) => {
      timeline.push({
        log: `Composing phase ${i + 1} — ${p.title.toLowerCase()}`,
        progress: Math.round(42 + ((i + 1) / phases.length) * 52),
        phases: i + 1,
        duration: 1050,
      })
    })
    timeline.push({
      log: `Finalizing · ${totalTasks} tasks across ${phases.length} phases`,
      progress: 100,
      phases: phases.length,
      duration: 500,
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
      const t = setTimeout(() => setGenStep((s) => s + 1), reduceMotion ? 60 : currentStep.duration)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setPhase('done'), reduceMotion ? 60 : currentStep.duration)
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
            transition={{ duration: 0.72, ease: EASE_OUT }}
          >
            <div className="flex items-center gap-4">
              <span className="stamp text-[#17453a]">Interactive demo</span>
              <Image
                src={owl}
                alt="The ClassVault archivist owl"
                className="animate-wobble pointer-events-none hidden h-20 w-auto select-none motion-reduce:animate-none sm:block"
                draggable={false}
              />
            </div>
            <h2 id="roadmap-heading" className="font-display mt-5 text-wrap-balance text-3xl font-black tracking-[-0.035em] md:text-5xl">
              Generate a roadmap.<br />
              <MarkerHighlight>Right here, right now.</MarkerHighlight>
            </h2>
            <p className="mt-4 max-w-[62ch] text-pretty text-sm leading-relaxed text-[#171512]/75">
              This is a taste of the real thing. On ClassVault, roadmaps are generated from
              notes your plan can actually use — your uploads, public notes, and (on Pro)
              top university notes too.
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={(event) => {
                event.preventDefault()
                generate()
              }}
            >
              <div>
                <label htmlFor="roadmap-topic" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#171512]/65">Your topic</label>
                <input
                  id="roadmap-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Operating Systems"
                  className="min-h-12 w-full rounded-xl border-[1.5px] border-[#171512] bg-[#fffdf6] px-4 py-3 text-sm font-medium shadow-[3px_3px_0_#171512] outline-none transition-[box-shadow,transform] duration-200 placeholder:text-[#171512]/55 focus:-translate-y-0.5 focus:shadow-[5px_5px_0_#171512] focus-visible:ring-2 focus-visible:ring-[#17453a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe8d8]"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => {
                    const selected = displayTopic === suggestion

                    return (
                      <motion.button
                        key={suggestion}
                        type="button"
                        onClick={() => setTopic(suggestion)}
                        whileTap={{ scale: 0.96 }}
                        aria-pressed={selected}
                        className={`min-h-10 rounded-full border-[1.5px] border-[#171512] px-3 py-1 text-xs font-semibold outline-none transition-[background-color,box-shadow,color] duration-200 focus-visible:ring-2 focus-visible:ring-[#17453a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe8d8] ${
                          selected
                            ? 'bg-[#f0a202] shadow-[2px_2px_0_#171512]'
                            : 'bg-[#fffdf6] hover:bg-[#f0a202]/35 hover:shadow-[2px_2px_0_#171512]'
                        }`}
                      >
                        {suggestion}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#171512]/65">Study mode</span>
                <div className="grid grid-cols-2 gap-1 rounded-xl border-[1.5px] border-[#171512] bg-[#fffdf6] p-1 shadow-[3px_3px_0_#171512]">
                  {STUDY_MODES.map((m) => {
                    const Icon = m.icon
                    const selected = mode === m.id
                    return (
                      <motion.button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id)}
                        whileTap={{ scale: 0.97 }}
                        aria-pressed={selected}
                        className="relative min-h-11 rounded-lg px-2 py-2.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#f0a202] sm:px-4 sm:text-sm"
                      >
                        {selected && (
                          <motion.span
                            layoutId="mode-pill"
                            className="absolute inset-0 rounded-lg bg-[#17453a]"
                            transition={{ duration: 0.26, ease: EASE_OUT }}
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

              <GenerateButton phase={phase} />

              <div className="grid gap-2 text-xs text-[#171512]/65 sm:grid-cols-2">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#17453a]" />
                  Access-safe sources
                </span>
                <span className="flex items-center gap-2 sm:justify-end">
                  <BookOpenCheck className="h-4 w-4 shrink-0 text-[#17453a]" />
                  Sample data only
                </span>
              </div>
            </form>
          </motion.div>

          {/* right: planner console */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.72, delay: 0.12, ease: EASE_OUT }}
            className="relative min-h-[590px] overflow-hidden rounded-2xl border-[1.5px] border-[#171512] bg-[linear-gradient(160deg,#0d211c_0%,#0b1e19_55%,#091a15_100%)] shadow-[8px_8px_0_rgba(23,21,18,0.18)]"
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

            <ConsoleFrameHeader phase={phase} />

            <div className="relative z-[1] p-5 sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              {phase === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                  className="relative"
                >
                  <IdlePreview topic={activeTopic} />
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

                  <PhaseRail
                    phases={phases}
                    visible={visible}
                    buildingPhase={buildingPhase}
                    done={phase === 'done'}
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
                          transition={{ duration: 0.45, ease: EASE_OUT }}
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                        transition={{ duration: 0.36, ease: EASE_OUT }}
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
            </div>
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
