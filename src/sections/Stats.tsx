'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1800
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 4)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, target])

  return (
    <span ref={ref} className="font-display text-4xl font-black tabular-nums md:text-5xl">
      {value.toLocaleString('en-IN')}
      <span className="text-[#e8890c]">{suffix}</span>
    </span>
  )
}

const stats = [
  { target: 48000, suffix: '+', label: 'notes shared & rated' },
  { target: 320, suffix: '+', label: 'university communities' },
  { target: 150000, suffix: '+', label: 'students studying together' },
  { target: 92, suffix: '%', label: 'say roadmaps saved their semester' },
]

export default function Stats() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.1, duration: 0.7 }}
            className="relative text-center"
          >
            <Counter target={s.target} suffix={s.suffix} />
            <div className="mx-auto mt-2 h-[3px] w-10 rounded-full bg-[#f0a202]" />
            <p className="mt-2 text-sm font-medium text-[#171512]/60">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
