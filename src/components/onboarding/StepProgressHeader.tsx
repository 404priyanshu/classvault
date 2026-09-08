import { Check } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { LockKeyhole } from 'lucide-react'
import { Brand } from '@/components/ui/Brand'
import { STEPS } from './constants'

export function StepProgressHeader({ step }: { step: number }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <>
      <header className="flex items-center justify-between gap-4 lg:justify-end">
        <Brand className="lg:hidden" />

        <div className="flex items-center gap-3">
          <LockKeyhole className="hidden h-4 w-4 text-club-purple sm:block" />
          <span className="hidden text-xs font-bold text-club-muted sm:block">
            Secure setup
          </span>
          <div
            aria-label={`Step ${step + 1} of ${STEPS.length}`}
            className="hidden h-2 w-24 sm:block overflow-hidden rounded-full border border-club-ink/50 bg-club-paper sm:w-36"
            role="progressbar"
            aria-valuemax={STEPS.length}
            aria-valuemin={1}
            aria-valuenow={step + 1}
          >
            <motion.div
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              className="h-full bg-club-purple"
              transition={
                prefersReducedMotion ? { duration: 0 } : { duration: 0.35 }
              }
            />
          </div>
          <span className="whitespace-nowrap text-xs font-black">
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
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs font-black ${
                  index <= step
                    ? 'border-club-purple bg-club-purple text-club-bg'
                    : 'border-club-ink bg-club-bg'
                }`}
              >
                {index < step ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              {index < STEPS.length - 1 ? (
                <span
                  className={`mx-2 h-[1.5px] flex-1 ${
                    index < step
                      ? 'bg-club-purple'
                      : 'border-t-[1.5px] border-dashed border-club-ink/40'
                  }`}
                />
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 text-center text-[10px] font-bold text-club-muted">
          {STEPS.map((item, index) => (
            <span className={index === step ? 'text-club-purple' : ''} key={item.label}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
