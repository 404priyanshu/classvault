import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { EASE_OUT } from './plans'
import type { Phase } from './types'

export function PhaseRail({
  phases,
  visible,
  buildingPhase,
  done,
}: {
  phases: Phase[]
  visible: number
  buildingPhase: number
  done: boolean
}) {
  return (
    <ol className="mt-5 grid grid-cols-4 gap-1" aria-label="Roadmap phase generation status">
      {phases.map((roadmapPhase, index) => {
        const complete = done || index < visible - 1
        const active = !done && (index === buildingPhase || (visible === 0 && index === 0))
        const reached = complete || active

        return (
          <li key={roadmapPhase.title} className="relative min-w-0">
            <div className="flex items-center">
              <motion.span
                className={`relative z-[1] grid h-5 w-5 shrink-0 place-items-center rounded-full border font-mono text-[9px] font-bold ${
                  complete
                    ? 'border-[#8fd6b4] bg-[#8fd6b4] text-[#0b1e19]'
                    : active
                      ? 'border-[#f0a202] bg-[#f0a202]/15 text-[#f0a202]'
                      : 'border-white/15 bg-[#0b1e19] text-white/30'
                }`}
                animate={active ? { boxShadow: ['0 0 0 0 rgba(240,162,2,0)', '0 0 0 5px rgba(240,162,2,0.12)', '0 0 0 0 rgba(240,162,2,0)'] } : { boxShadow: '0 0 0 0 rgba(240,162,2,0)' }}
                transition={{ duration: 1.5, repeat: active ? Infinity : 0, ease: EASE_OUT }}
              >
                {complete ? <Check className="h-3 w-3" strokeWidth={3.5} /> : index + 1}
              </motion.span>
              {index < phases.length - 1 ? (
                <span className="relative mx-1 h-px flex-1 overflow-hidden bg-white/10">
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-[#8fd6b4]/70"
                    animate={{ width: complete ? '100%' : reached ? '35%' : '0%' }}
                    transition={{ duration: 0.45, ease: EASE_OUT }}
                  />
                </span>
              ) : null}
            </div>
            <span
              className={`mt-1.5 block truncate pr-1 font-mono text-[9px] ${
                reached || done ? 'text-white/55' : 'text-white/25'
              }`}
            >
              {roadmapPhase.title}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
