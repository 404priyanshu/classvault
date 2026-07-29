'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import Image from 'next/image'

import annotationDoodles from '@/assets/stationery/annotation-doodles.webp'
import chaiRing from '@/assets/stationery/chai-ring.webp'
import paperclipBrass from '@/assets/stationery/paperclip-brass.webp'
import { MarkerHighlight, Tape } from '@/components/ui/stationery'

type MarginNote = {
  quote: string
  name: string
  place: string
  rot: number
  tape: string
  attachment: 'clip' | 'saffron' | 'green'
}

const notes: MarginNote[] = [
  {
    quote: 'I stopped begging for notes in class groups. Everything I needed was already rated.',
    name: 'Priya S.',
    place: 'IIT Delhi · CSE',
    rot: -2.5,
    tape: 'left-6',
    attachment: 'clip',
  },
  {
    quote: 'The exam-mode roadmap felt like a senior sitting next to me the night before.',
    name: 'Arjun M.',
    place: 'VIT Vellore · ECE',
    rot: 1.8,
    tape: 'left-1/2 -translate-x-1/2',
    attachment: 'green',
  },
  {
    quote: 'Study rooms at 11 PM hit different. 25-minute sprints with strangers who became friends.',
    name: 'Sneha R.',
    place: 'Delhi University · B.Com',
    rot: -1.2,
    tape: 'right-8',
    attachment: 'saffron',
  },
  {
    quote: 'Found a notes set with 400+ ratings for a subject my prof barely taught. Lifesaver.',
    name: 'Karthik V.',
    place: 'Anna University · Mech',
    rot: 2.4,
    tape: 'left-10',
    attachment: 'green',
  },
]

export default function MarginNotes() {
  const constraintsRef = useRef<HTMLDivElement>(null)

  return (
    <section className="paper-grain relative overflow-hidden py-24">
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
        className="pointer-events-none absolute -right-8 bottom-8 hidden w-52 rotate-12 select-none opacity-45 lg:block"
        sizes="208px"
        unoptimized
      />
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="stamp text-[#8a5a00]">Margin notes</span>
          <h2 className="font-display mt-5 text-3xl font-black tracking-tight md:text-5xl">
            Straight from the <MarkerHighlight>margins</MarkerHighlight>
          </h2>
          <p className="font-hand mt-3 text-xl text-[#171512]/55">
            go ahead — drag the cards around, everyone&apos;s desk is different ✎
          </p>
        </motion.div>

        <div ref={constraintsRef} className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {notes.map((n, i) => (
            <motion.div
              key={n.name}
              initial={{ opacity: 0, y: 32, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: n.rot }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ rotate: 0, scale: 1.04, zIndex: 10 }}
              whileDrag={{ scale: 1.08, rotate: 0, zIndex: 20, cursor: 'grabbing' }}
              drag
              dragConstraints={constraintsRef}
              dragElastic={0.25}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 18 }}
              data-nostamp
              className="paper-card-sm bg-ruled relative cursor-grab touch-none rounded-lg p-6 pt-9"
            >
              {n.attachment === 'clip' ? (
                <Image
                  src={paperclipBrass}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="pointer-events-none absolute -top-5 left-5 z-10 h-auto w-20 -rotate-6 select-none"
                  sizes="80px"
                  unoptimized
                />
              ) : (
                <Tape
                  variant={n.attachment}
                  className={`-top-3 ${n.tape}`}
                  style={{ transform: `rotate(${n.rot * 2}deg)` }}
                />
              )}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-[#f0a202] text-[#171512]" />
                ))}
              </div>
              <p className="font-display mt-3 text-[15px] font-medium italic leading-relaxed text-[#171512]/85">
                “{n.quote}”
              </p>
              <div className="mt-5 border-t-[1.5px] border-dashed border-[#171512]/25 pt-3">
                <p className="text-sm font-black">{n.name}</p>
                <p className="text-xs font-medium text-[#171512]/55">{n.place}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
