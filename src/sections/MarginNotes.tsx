'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

import annotationDoodles from '@/assets/stationery/annotation-doodles.webp'
import chaiRing from '@/assets/stationery/chai-ring.webp'
import paperclipBrass from '@/assets/stationery/paperclip-brass.webp'
import { MarkerHighlight, Tape } from '@/components/ui/stationery'

type MarginNote = {
  quote: string
  tag: string
  rot: number
  tape: string
  attachment: 'clip' | 'saffron' | 'green'
}

const notes: MarginNote[] = [
  {
    quote: 'Notes scattered across 6 WhatsApp groups, 2 Telegram channels and a dead Drive link.',
    tag: '— every class group, ever',
    rot: -2.5,
    tape: 'left-6',
    attachment: 'clip',
  },
  {
    quote: 'Downloading ‘final_final_v3.pdf’ at 1 AM and praying it’s the right unit.',
    tag: '— the end-sem week ritual',
    rot: 1.8,
    tape: 'left-1/2 -translate-x-1/2',
    attachment: 'green',
  },
  {
    quote: 'Studying alone the night before end-sems — no timer, no company, no plan.',
    tag: '— every hostel, every night',
    rot: -1.2,
    tape: 'right-8',
    attachment: 'saffron',
  },
  {
    quote: 'The best notes in class belong to a senior you’ve never talked to.',
    tag: '— the oldest problem on campus',
    rot: 2.4,
    tape: 'left-10',
    attachment: 'green',
  },
]

export default function MarginNotes() {
  const constraintsRef = useRef<HTMLDivElement>(null)

  return (
    <section className="paper-grain relative overflow-hidden py-14 md:py-20">
      <Image
        src={annotationDoodles}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute left-[2%] top-12 hidden w-44 -rotate-6 select-none opacity-75 xl:block"
        sizes="176px"
        unoptimized
      />
      <Image
        src={chaiRing}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute left-[3%] top-[44%] hidden w-40 rotate-12 select-none opacity-60 lg:block"
        sizes="160px"
        unoptimized
      />
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ y: 16 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: '140px' }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-black tracking-tight md:text-5xl">
            Sound <MarkerHighlight>familiar?</MarkerHighlight>
          </h2>
          <p className="font-hand mt-3 text-xl text-[#171512]/55">
            go ahead — drag the cards around, everyone&apos;s desk is different ✎
          </p>
        </motion.div>

        <div ref={constraintsRef} className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {notes.map((n, i) => (
            <motion.div
              key={n.tag}
              initial={{ y: 16, rotate: 0 }}
              whileInView={{ y: 0, rotate: n.rot }}
              viewport={{ once: true, margin: '140px' }}
              transition={{ delay: i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ rotate: 0, scale: 1.04, zIndex: 10 }}
              whileDrag={{ scale: 1.08, rotate: 0, zIndex: 20, cursor: 'grabbing' }}
              drag
              dragConstraints={constraintsRef}
              dragElastic={0.25}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 18 }}
              className="paper-card-sm bg-ruled relative cursor-grab touch-none rounded-lg p-6 pt-9"
            >
              {n.attachment === 'clip' ? (
                <Image
                  src={paperclipBrass}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="pointer-events-none absolute -top-3 left-1 z-10 h-auto w-16 rotate-[78deg] select-none [filter:drop-shadow(1px_1px_0_rgba(23,21,18,0.2))]"
                  sizes="64px"
                  unoptimized
                />
              ) : (
                <Tape
                  variant={n.attachment}
                  className={n.tape}
                  style={{ transform: `rotate(${n.rot * 2}deg)` }}
                />
              )}
              <p className="font-display text-[15px] font-medium italic leading-relaxed text-[#171512]/85">
                “{n.quote}”
              </p>
              <div className="mt-5 border-t-[1.5px] border-dashed border-[#171512]/25 pt-3">
                <p className="font-hand text-lg text-[#171512]/60">{n.tag}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ y: 10 }}
          whileInView={{ y: 0 }}
          viewport={{ margin: '140px', once: true }}
          transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 text-center"
        >
          <a
            href="/auth/sign-up"
            className="font-hand text-xl font-bold text-[#17453a] underline decoration-dashed decoration-2 underline-offset-4 transition-colors hover:text-[#171512]"
          >
            ClassVault exists to fix exactly this →
          </a>
        </motion.p>
      </div>
    </section>
  )
}
