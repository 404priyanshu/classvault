import { motion } from 'framer-motion'
import { Check, FileText } from 'lucide-react'
import { EASE_OUT } from './plans'
import { Typed } from './Typed'
import type { Phase } from './types'

export function PhaseCard({
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
      initial={{ y: 18, scale: 0.98, filter: 'blur(6px)' }}
      animate={{ y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.48, ease: EASE_OUT }}
      className="relative h-full"
    >
      {building && (
        <motion.div
          aria-hidden
          className="absolute -inset-px rounded-[13px] bg-[linear-gradient(120deg,rgba(240,162,2,0.5),rgba(143,214,180,0.25),rgba(240,162,2,0.5))]"
          animate={{ opacity: [0.35, 0.9, 0.35] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <div className="relative flex h-full flex-col rounded-xl border border-white/10 bg-[#0e231d] p-4 transition-colors duration-300 hover:border-white/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#f0a202]/15 font-mono text-[11px] font-bold text-[#f0a202]">
              {index + 1}
            </span>
            <p className="text-pretty text-sm font-bold leading-snug text-[#f6f1e5]">
              {building ? <Typed text={phase.title} speed={12} /> : phase.title}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-white/55">
            {phase.weeks}
          </span>
        </div>

        <ul className="mt-3 flex-1 space-y-1">
          {phase.tasks.map((task, ti) => {
            const key = `${index}-${ti}`
            const isChecked = checked.has(key)
            return (
              <li key={`${runId}-${key}`} className="flex min-h-9 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onToggle(key)}
                  disabled={!interactive}
                  aria-label={isChecked ? `Mark "${task}" as not done` : `Mark "${task}" as done`}
                  className="group/check relative grid h-9 w-9 shrink-0 place-items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#f0a202]/80 disabled:cursor-default"
                >
                  <motion.span
                    className={`grid h-[18px] w-[18px] place-items-center rounded-[5px] border transition-colors duration-200 ${
                      isChecked
                        ? 'border-[#f0a202] bg-[#f0a202] text-[#171512]'
                        : 'border-white/25 bg-transparent group-hover/check:border-[#f0a202]/70'
                    }`}
                    animate={{ scale: isChecked ? [0.86, 1] : 1 }}
                    transition={{ duration: 0.24, ease: EASE_OUT }}
                  >
                    {isChecked && <Check className="h-3 w-3" strokeWidth={3.5} />}
                  </motion.span>
                </button>
                <span
                  className={`text-pretty text-xs leading-relaxed transition-colors duration-200 ${
                    isChecked ? 'text-white/30 line-through' : 'text-white/75'
                  }`}
                >
                  {building ? (
                    <Typed text={task} delay={140 + ti * 140} speed={8} caret={ti === phase.tasks.length - 1} />
                  ) : (
                    task
                  )}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.07] pt-2.5 font-mono text-[10px] leading-relaxed text-white/40">
          <FileText className="h-3 w-3 text-[#8fd6b4]/70" />
          sources: {phase.source}
        </div>
      </div>
    </motion.div>
  )
}
