'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { MarkerHighlight } from '@/components/ui/stationery'

const steps = [
  {
    n: '1',
    title: 'Create your free vault',
    line: 'Thirty seconds, no card, no catch.',
    rot: '-rotate-1',
  },
  {
    n: '2',
    title: 'Verify your university',
    line: 'Your college email is the key.',
    rot: 'rotate-1',
  },
  {
    n: '3',
    title: 'Study your way',
    line: 'Rated notes, live rooms & roadmaps — scoped to your campus.',
    rot: '-rotate-[0.5deg]',
  },
]

export default function HowItWorks() {
  return (
    <section className="paper-grain relative overflow-hidden py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ y: 16 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: '140px' }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-black tracking-tight md:text-4xl">
            Up and running in <MarkerHighlight>two minutes</MarkerHighlight>
          </h2>
        </motion.div>

        <div className="relative mt-12">
          <div className="absolute left-[18%] right-[18%] top-1/2 hidden border-t-2 border-dashed border-[#171512]/20 md:block" />
          <div className="relative grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ y: 16 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, margin: '140px' }}
                transition={{ delay: i * 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={`paper-card-sm rounded-xl p-6 text-center ${s.rot} transition-transform duration-200 hover:rotate-0`}
              >
                <span className="font-hand text-6xl leading-none text-[#f0a202] [text-shadow:2px_2px_0_#171512]">
                  {s.n}
                </span>
                <h3 className="font-display mt-3 text-lg font-black">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#171512]/65">{s.line}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.a
          initial={{ y: 10 }}
          whileInView={{ y: 0 }}
          viewport={{ margin: '140px', once: true }}
          transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          href="/auth/sign-up"
          className="group mx-auto mt-10 flex w-fit items-center gap-1.5 text-sm font-bold text-[#17453a] underline decoration-dashed decoration-2 underline-offset-4 transition-colors hover:text-[#171512]"
        >
          start now
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </motion.a>
      </div>
    </section>
  )
}
