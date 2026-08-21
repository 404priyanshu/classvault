import { Check } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen, LockKeyhole } from 'lucide-react'
import Link from 'next/link'
import { STEPS } from './constants'

export function StepProgressHeader({ step }: { step: number }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <>
      <header className="flex items-center justify-between gap-4 lg:justify-end">
        <Link className="flex items-center gap-2 lg:hidden" href="/">
          <span className="grid h-9 w-9 place-items-center rounded-lg border-[1.5px] border-[#171512] bg-[#17453a] shadow-[2px_2px_0_#171512]">
            <BookOpen className="h-4 w-4 text-[#f6f1e5]" />
          </span>
          <span className="font-display text-lg font-black">ClassVault</span>
        </Link>

        <div className="flex items-center gap-3">
          <LockKeyhole className="hidden h-4 w-4 text-[#17453a] sm:block" />
          <span className="text-xs font-bold text-[#171512]/60">
            Secure setup
          </span>
          <div
            aria-label={`Step ${step + 1} of ${STEPS.length}`}
            className="h-2 w-24 overflow-hidden rounded-full border border-[#171512]/50 bg-[#fffdf6] sm:w-36"
            role="progressbar"
            aria-valuemax={STEPS.length}
            aria-valuemin={1}
            aria-valuenow={step + 1}
          >
            <motion.div
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              className="h-full bg-[#17453a]"
              transition={
                prefersReducedMotion ? { duration: 0 } : { duration: 0.35 }
              }
            />
          </div>
          <span className="text-xs font-black">
            {step + 1} of {STEPS.length}
          </span>
        </div>
      </header>

      <div className="mt-6 lg:hidden">
        <div className="flex items-center justify-between">
          {STEPS.map((item, index) => (
            <div
              className="flex min-w-0 flex-1 items-center last:flex-none"
              key={item.label}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-[1.5px] text-xs font-black ${
                  index <= step
                    ? 'border-[#17453a] bg-[#17453a] text-[#f6f1e5]'
                    : 'border-[#171512] bg-[#f6f1e5]'
                }`}
              >
                {index < step ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              {index < STEPS.length - 1 ? (
                <span
                  className={`mx-2 h-[1.5px] flex-1 ${
                    index < step
                      ? 'bg-[#17453a]'
                      : 'border-t-[1.5px] border-dashed border-[#171512]/40'
                  }`}
                />
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 text-center text-[10px] font-bold text-[#171512]/55">
          {STEPS.map((item, index) => (
            <span className={index === step ? 'text-[#17453a]' : ''} key={item.label}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
