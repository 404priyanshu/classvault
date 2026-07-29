'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpenCheck, BrainCircuit, FileText, RotateCcw, Zap } from 'lucide-react'
import Image from 'next/image'
import owl from '@/assets/owl.webp'
import doodleSticky from '@/assets/doodle-sticky.webp'
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

export default function RoadmapDemo() {
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState<'indepth' | 'exam'>('indepth')
  const [phase, setPhase] = useState<'idle' | 'generating' | 'done'>('idle')
  const [visible, setVisible] = useState(0)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const phases = useMemo(() => (mode === 'exam' ? TOPICS.exam : TOPICS.default), [mode])

  useEffect(() => {
    if (phase !== 'generating') return
    if (visible >= phases.length) {
      const t = setTimeout(() => setPhase('done'), 500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setVisible((v) => v + 1), 650)
    return () => clearTimeout(t)
  }, [phase, visible, phases.length])

  const generate = () => {
    setChecked(new Set())
    setVisible(0)
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
                    <button key={s} onClick={() => setTopic(s)}
                      className="rounded-full border-[1.5px] border-[#171512] bg-[#fffdf6] px-3 py-1 text-xs font-semibold transition-all hover:bg-[#f0a202] hover:shadow-[2px_2px_0_#171512]">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#171512]/60">Study mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setMode('indepth')}
                    className={`flex items-center gap-2.5 rounded-xl border-[1.5px] border-[#171512] px-4 py-3 text-left text-sm font-semibold transition-all ${
                      mode === 'indepth' ? 'bg-[#17453a] text-[#f6f1e5] shadow-[3px_3px_0_#171512]' : 'bg-[#fffdf6] text-[#171512]/60 hover:shadow-[2px_2px_0_#171512]'
                    }`}>
                    <BrainCircuit className="h-4 w-4 shrink-0" />
                    In-depth study
                  </button>
                  <button onClick={() => setMode('exam')}
                    className={`flex items-center gap-2.5 rounded-xl border-[1.5px] border-[#171512] px-4 py-3 text-left text-sm font-semibold transition-all ${
                      mode === 'exam' ? 'bg-[#f0a202] text-[#171512] shadow-[3px_3px_0_#171512]' : 'bg-[#fffdf6] text-[#171512]/60 hover:shadow-[2px_2px_0_#171512]'
                    }`}>
                    <Zap className="h-4 w-4 shrink-0" />
                    Exam revision
                  </button>
                </div>
              </div>

              <button onClick={generate} disabled={phase === 'generating'}
                className="btn-ink flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold disabled:opacity-60">
                {phase === 'generating' ? (
                  <><Spinner className="size-5" decorative size={20} /> Reading source notes…</>
                ) : phase === 'done' ? (
                  <><RotateCcw className="h-4 w-4" /> Regenerate roadmap</>
                ) : (
                  <><BookOpenCheck className="h-4 w-4" /> Generate my roadmap</>
                )}
              </button>
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
                <motion.div key="out" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#171512]/50">
                        {mode === 'exam' ? '⚡ Exam revision' : '🧠 In-depth'} roadmap
                      </p>
                      <h3 className="font-display mt-1 text-2xl font-black">
                        {topic.trim() || 'Operating Systems'}
                      </h3>
                    </div>
                    {phase === 'done' && (
                      <div className="text-right">
                        <p className="font-display text-3xl font-black text-[#17453a]">{progress}%</p>
                        <p className="text-[10px] font-semibold text-[#171512]/50">complete</p>
                      </div>
                    )}
                  </div>

                  {phase === 'done' && (
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full border-[1.5px] border-[#171512] bg-[#f6f1e5]">
                      <div className="h-full bg-[#f0a202] transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  )}

                  <div className="mt-6 space-y-4">
                    {phases.slice(0, visible).map((p, pi) => (
                      <motion.div key={p.title}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="rounded-xl border-[1.5px] border-[#171512]/35 bg-[#f6f1e5] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black">
                            <span className="text-[#e8890c]">Phase {pi + 1}</span> · {p.title}
                          </p>
                          <span className="rounded-full border border-[#171512]/40 bg-[#fffdf6] px-2.5 py-0.5 text-[10px] font-bold">{p.weeks}</span>
                        </div>
                        <ul className="mt-3 space-y-2">
                          {p.tasks.map((t, ti) => {
                            const key = `${pi}-${ti}`
                            const done = checked.has(key)
                            return (
                              <li key={key}>
                                <button onClick={() => toggle(key)} disabled={phase !== 'done'}
                                  className="flex w-full items-center gap-2.5 text-left text-xs font-medium text-[#171512]/80 transition-colors hover:text-[#171512] disabled:cursor-default">
                                  <span className={`grid h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 place-items-center rounded border-[1.5px] border-[#171512] transition-all ${
                                    done ? 'bg-[#17453a] text-[#f6f1e5]' : 'bg-[#fffdf6]'
                                  }`}>
                                    {done && <span className="text-[10px] font-black">✓</span>}
                                  </span>
                                  <span className={done ? 'text-[#171512]/40 line-through' : ''}>{t}</span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                        <div className="mt-3 flex items-center gap-1.5 border-t-[1.5px] border-dashed border-[#171512]/25 pt-2.5 text-[10px] font-semibold text-[#171512]/55">
                          <FileText className="h-3 w-3 text-[#17453a]" />
                          Sources: {p.source}
                        </div>
                      </motion.div>
                    ))}
                    {phase === 'generating' && visible < phases.length && (
                      <div className="animate-shimmer h-24 rounded-xl border-[1.5px] border-[#171512]/20 bg-gradient-to-r from-[#f6f1e5] via-[#e5dcc6] to-[#f6f1e5]" />
                    )}
                  </div>
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
