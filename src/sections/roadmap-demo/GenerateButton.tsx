import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, Sparkles } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { EASE_OUT } from './plans'
import type { GenerationPhaseState } from './types'

/** The generate CTA — ink pill with saffron hard shadow, shine sweep, and morphing label. */
export function GenerateButton({
  phase,
}: {
  phase: GenerationPhaseState
}) {
  return (
    <motion.button
      type="submit"
      disabled={phase === 'generating'}
      whileHover={phase === 'generating' ? undefined : { y: -2 }}
      whileTap={phase === 'generating' ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.24, ease: EASE_OUT }}
      className="group relative min-h-12 w-full overflow-hidden rounded-xl border-[1.5px] border-[#171512] bg-[#171512] px-6 py-3.5 text-sm font-bold text-[#f6f1e5] shadow-[4px_4px_0_#f0a202] outline-none transition-[box-shadow,opacity] duration-300 hover:shadow-[6px_6px_0_#f0a202,0_0_22px_rgba(240,162,2,0.22)] focus-visible:ring-2 focus-visible:ring-[#17453a] focus-visible:ring-offset-4 focus-visible:ring-offset-[#efe8d8] disabled:cursor-wait disabled:opacity-80"
    >
      {phase === 'generating' ? (
        <motion.span
          aria-hidden
          className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-160%', '460%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: EASE_OUT }}
        />
      ) : null}
      <span className="relative flex items-center justify-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {phase === 'generating' ? (
            <motion.span
              key="building"
              initial={{ y: 8 }}
              animate={{ y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Spinner className="size-4" decorative size={16} /> Building sample roadmap…
            </motion.span>
          ) : phase === 'done' ? (
            <motion.span
              key="regen"
              initial={{ y: 8 }}
              animate={{ y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180" /> Regenerate roadmap
            </motion.span>
          ) : (
            <motion.span
              key="generate"
              initial={{ y: 8 }}
              animate={{ y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-[#f0a202] transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
              Generate my roadmap
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  )
}
