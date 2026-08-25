import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { EASE_OUT } from './plans'
import { Typed } from './Typed'

export function LogStream({ logs, done }: { logs: string[]; done: boolean }) {
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
              initial={{ y: 10, filter: 'blur(4px)' }}
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
