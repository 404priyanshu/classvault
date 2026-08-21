import { motion } from 'framer-motion'
import { EASE_OUT } from './plans'
import type { GenerationPhaseState } from './types'

export function ConsoleFrameHeader({ phase }: { phase: GenerationPhaseState }) {
  const status =
    phase === 'idle' ? 'Awaiting a topic' : phase === 'generating' ? 'Building live' : 'Plan ready'

  return (
    <div className="relative z-10 flex min-h-12 items-center justify-between gap-3 border-b border-white/[0.09] bg-black/10 px-4 py-2.5 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div aria-hidden className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#f0a202]/80" />
          <span className="h-2 w-2 rounded-full bg-[#8fd6b4]/55" />
          <span className="h-2 w-2 rounded-full bg-white/20" />
        </div>
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
          roadmap.workspace
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">
        <motion.span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-[#8fd6b4]"
          animate={phase === 'generating' ? { opacity: [0.35, 1, 0.35] } : { opacity: 0.8 }}
          transition={{ duration: 1.2, repeat: phase === 'generating' ? Infinity : 0, ease: EASE_OUT }}
        />
        {status}
      </div>
    </div>
  )
}
