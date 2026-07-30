'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { BookOpenCheck, BrainCircuit, Check, FileText, RotateCcw, Sparkles, Zap } from 'lucide-react'
import Image from 'next/image'
import owl from '@/assets/owl.webp'
import doodleSticky from '@/assets/doodle-sticky.webp'
import highlighterSwash from '@/assets/stationery/highlighter-swash-saffron.webp'
import { Spinner } from '@/components/ui/spinner'
import { MarkerHighlight, Tape } from '@/components/ui/stationery'

type Phase = { title: string; tasks: string[]; source: string; weeks: string }

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

const phaseCardV = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}
const taskListV = { show: { transition: { staggerChildren: 0.08, delayChildren: 0.18 } } }
const taskItemV = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35 } },
}

/** Simulated build log shown while the roadmap is "being written". */
function BuildLog({ steps, activeStep }: { steps: string[]; activeStep: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-6 overflow-hidden"
    >
      <div className="flex items-start gap-4 rounded-xl border-[1.5px] border-[#171512]/25 bg-[#fffdf6]/70 p-4">
        <div className="relative grid h-11 w-11 shrink-0 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#f0a202]/25" />
          <span className="absolute inset-0 animate-spin rounded-full border-[1.5px] border-dashed border-[#17453a]/50 [animation-duration:5s]" />
          <Sparkles className="h-[18px] w-[18px] text-[#17453a]" />
        </div>
        <ul className="min-w-0 flex-1 space-y-1.5 pt-0.5">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2 text-xs font-semibold">
              {i < activeStep ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                >
                  <Check className="h-3.5 w-3.5 text-[#17453a]" strokeWidth={3} />
                </motion.span>
              ) : i === activeStep ? (
                <Spinner decorative size={13} className="shrink-0" />
              ) : (
                <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-dashed border-[#171512]/25" />
              )}
              <span className={i <= activeStep ? 'text-[#171512]/85' : 'text-[#171512]/35'}>{s}…</span>
              {i === activeStep && <span className="animate-pulse text-[#e8890c]">▍</span>}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

export default function RoadmapDemo() {
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState<'indepth' | 'exam'>('indepth')
  const [phase, setPhase] = useState<'idle' | 'generating' | 'done'>('idle')
  const [genStep, setGenStep] = useState(0)
  const [visible, setVisible] = useState(0)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const reduceMotion = useReducedMotion()

  const phases = useMemo(() => (mode === 'exam' ? TOPICS.exam : TOPICS.default), [mode])
  const displayTopic = topic.trim() || 'Operating Systems'
  const steps = useMemo(
    () => [
      `scanning rated notes for “${displayTopic}”`,
      'ranking sources by rating + recency',
      'checking which notes you can actually use',
      'sequencing phases across your weeks',
      'polishing the plan',
    ],
    [displayTopic],
  )

  // generation choreography: status feed first, then phase cards stream in
  useEffect(() => {
    if (phase !== 'generating') return
    if (genStep < steps.length) {
      const t = setTimeout(() => setGenStep((s) => s + 1), 620)
      return () => clearTimeout(t)
    }
    if (visible < phases.length) {
      const t = setTimeout(() => setVisible((v) => v + 1), 600)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setPhase('done'), 450)
    return () => clearTimeout(t)
  }, [phase, genStep, visible, phases.length, steps.length])

  const generate = () => {
    setChecked(new Set())
    setVisible(0)
    setGenStep(0)
    setPhase('generating')
  }

  const toggle = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const totalTasks = phases.reduce((n, p) => n + p.tasks.length, 0)
  const progress = Math.round((checked.size / totalTasks) * 100)

  return (
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
            <h2 className="font-display mt-5 text-3xl font-black tracking-tight md:text-5xl">
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
                <div className="grid grid-cols-2 gap-3">
                  <motion.button onClick={() => setMode('indepth')} whileTap={{ scale: 0.97 }}
                    className={`flex items-center gap-2.5 rounded-xl border-[1.5px] border-[#171512] px-4 py-3 text-left text-sm font-semibold transition-all ${
                      mode === 'indepth' ? 'bg-[#17453a] text-[#f6f1e5] shadow-[3px_3px_0_#171512]' : 'bg-[#fffdf6] text-[#171512]/60 hover:shadow-[2px_2px_0_#171512]'
                    }`}>
                    <BrainCircuit className="h-4 w-4 shrink-0" />
                    In-depth study
                  </motion.button>
                  <motion.button onClick={() => setMode('exam')} whileTap={{ scale: 0.97 }}
                    className={`flex items-center gap-2.5 rounded-xl border-[1.5px] border-[#171512] px-4 py-3 text-left text-sm font-semibold transition-all ${
                      mode === 'exam' ? 'bg-[#f0a202] text-[#171512] shadow-[3px_3px_0_#171512]' : 'bg-[#fffdf6] text-[#171512]/60 hover:shadow-[2px_2px_0_#171512]'
                    }`}>
                    <Zap className="h-4 w-4 shrink-0" />
                    Exam revision
                  </motion.button>
                </div>
              </div>

              <motion.button onClick={generate} disabled={phase === 'generating'} whileTap={{ scale: 0.98 }}
                className="btn-ink flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold disabled:opacity-60">
                {phase === 'generating' ? (
                  <><Spinner className="size-5" decorative size={20} /> {steps[Math.min(genStep, steps.length - 1)]}…</>
                ) : phase === 'done' ? (
                  <><RotateCcw className="h-4 w-4" /> Regenerate roadmap</>
                ) : (
                  <><BookOpenCheck className="h-4 w-4" /> Generate my roadmap</>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* right: output — clipboard style */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="paper-card relative min-h-[480px] rounded-2xl p-6 md:p-8"
          >
            <Tape className="-top-3 left-8 -rotate-[4deg]" />
            <Image
              src={doodleSticky}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-10 hidden w-24 rotate-6 select-none md:block"
              draggable={false}
            />

            {/* scanning beam while generating */}
            {phase === 'generating' && !reduceMotion && (
              <div aria-hidden className="pointer-events-none absolute inset-0 z-[3] overflow-hidden rounded-2xl">
                <motion.div
                  className="absolute inset-x-3 top-0 h-28 rounded-full bg-gradient-to-b from-transparent via-[#f0a202]/15 to-transparent"
                  animate={{ y: ['-7rem', '40rem'] }}
                  transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            )}

            <AnimatePresence mode="wait">
              {phase === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex h-[440px] flex-col items-center justify-center text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-xl border-[1.5px] border-[#171512] bg-[#f0a202]/20">
                    <BookOpenCheck className="h-8 w-8 text-[#17453a]" />
                  </div>
                  <p className="font-hand mt-5 max-w-xs text-xl text-[#171512]/60">
                    pick a topic + mode, hit generate — your roadmap appears here
                  </p>
                </motion.div>
              )}

              {(phase === 'generating' || phase === 'done') && (
                <motion.div key="out" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <AnimatePresence>
                    {phase === 'generating' && <BuildLog steps={steps} activeStep={genStep} />}
                  </AnimatePresence>

                  {visible > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#171512]/50">
                          {mode === 'exam' ? '⚡ Exam revision' : '🧠 In-depth'} roadmap
                        </p>
                        <h3 className="font-display mt-1 text-2xl font-black">
                          <span className="relative inline-block px-[0.04em]">
                            {phase === 'done' && (
                              <motion.span
                                aria-hidden
                                initial={{ clipPath: 'inset(0 100% 0 0)' }}
                                animate={{ clipPath: 'inset(0 -4% 0 0)' }}
                                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                                className="absolute -bottom-[0.06em] -left-[0.1em] z-0 block h-[0.78em] w-[calc(100%+0.2em)]"
                              >
                                <Image
                                  src={highlighterSwash}
                                  alt=""
                                  draggable={false}
                                  className="h-full w-full select-none object-fill saturate-[1.5]"
                                  sizes="320px"
                                  unoptimized
                                />
                              </motion.span>
                            )}
                            <span className="relative z-[1]">{displayTopic}</span>
                          </span>
                        </h3>
                      </div>
                      {phase === 'done' && (
                        <div className="text-right">
                          <motion.p
                            key={progress}
                            initial={{ scale: 1.3 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                            className="font-display text-3xl font-black tabular-nums text-[#17453a]"
                          >
                            {progress}%
                          </motion.p>
                          <p className="text-[10px] font-semibold text-[#171512]/50">complete</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {phase === 'done' && (
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full border-[1.5px] border-[#171512] bg-[#f6f1e5]">
                      <div className="h-full bg-[#f0a202] transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  )}

                  <div className="mt-6 space-y-4">
                    {phases.slice(0, visible).map((p, pi) => (
                      <motion.div key={p.title}
                        variants={phaseCardV}
                        initial="hidden"
                        animate="show"
                        className="rounded-xl border-[1.5px] border-[#171512]/35 bg-[#f6f1e5] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black">
                            <span className="text-[#e8890c]">Phase {pi + 1}</span> · {p.title}
                          </p>
                          <span className="rounded-full border border-[#171512]/40 bg-[#fffdf6] px-2.5 py-0.5 text-[10px] font-bold">{p.weeks}</span>
                        </div>
                        <motion.ul variants={taskListV} className="mt-3 space-y-2">
                          {p.tasks.map((t, ti) => {
                            const key = `${pi}-${ti}`
                            const done = checked.has(key)
                            return (
                              <motion.li key={key} variants={taskItemV}>
                                <button onClick={() => toggle(key)} disabled={phase !== 'done'}
                                  className="flex w-full items-center gap-2.5 text-left text-xs font-medium text-[#171512]/80 transition-colors hover:text-[#171512] disabled:cursor-default">
                                  <motion.span
                                    key={done ? 'on' : 'off'}
                                    initial={{ scale: 0.55 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 550, damping: 16 }}
                                    className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded border-[1.5px] border-[#171512] transition-colors ${
                                      done ? 'bg-[#17453a] text-[#f6f1e5]' : 'bg-[#fffdf6]'
                                    }`}>
                                    {done && <span className="text-[10px] font-black">✓</span>}
                                  </motion.span>
                                  <span className={done ? 'text-[#171512]/40 line-through' : ''}>{t}</span>
                                </button>
                              </motion.li>
                            )
                          })}
                        </motion.ul>
                        <div className="mt-3 flex items-center gap-1.5 border-t-[1.5px] border-dashed border-[#171512]/25 pt-2.5 text-[10px] font-semibold text-[#171512]/55">
                          <FileText className="h-3 w-3 text-[#17453a]" />
                          Sources: {p.source}
                        </div>
                      </motion.div>
                    ))}
                    {phase === 'generating' && visible < phases.length && genStep >= steps.length && (
                      <div className="animate-shimmer h-24 rounded-xl border-[1.5px] border-[#171512]/20 bg-gradient-to-r from-[#f6f1e5] via-[#e5dcc6] to-[#f6f1e5]" />
                    )}
                  </div>

                  <AnimatePresence>
                    {phase === 'done' && progress === 100 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid place-items-center overflow-hidden"
                      >
                        <motion.div
                          initial={{ scale: 2.4, rotate: -26, opacity: 0 }}
                          animate={{ scale: 1, rotate: -8, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.1 }}
                          className="mt-6 grid h-24 w-24 place-items-center rounded-full border-2 border-dashed border-[#17453a] bg-[#f0a202]/15 text-center shadow-[3px_3px_0_rgba(23,21,18,0.15)]"
                        >
                          <span className="font-hand text-xl font-bold leading-[0.95] text-[#17453a]">
                            syllabus<br />locked ✓
                          </span>
                        </motion.div>
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
  )
}
