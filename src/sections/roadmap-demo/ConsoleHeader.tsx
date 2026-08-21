import { useEffect } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import { Check } from 'lucide-react'
import { AsciiOrb } from '@/components/ui/ascii-orb'
import type { StudyMode } from './types'

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

export function ConsoleHeader({
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
          <AsciiOrb
            active={phase === 'generating'}
            cols={18}
            rows={9}
            className="shrink-0 text-[5px]"
          />
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
