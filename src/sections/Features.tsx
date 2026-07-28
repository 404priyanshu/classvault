'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image, { type StaticImageData } from 'next/image'
import {
  Star, ShieldCheck, MessageSquare, Mic, Timer,
  CheckCircle2, Search,
} from 'lucide-react'
import spotNote from '@/assets/spot-note.webp'
import spotUniversity from '@/assets/spot-university.webp'
import spotPomodoro from '@/assets/spot-pomodoro.webp'
import spotRoadmap from '@/assets/spot-roadmap.webp'
import doodleChai from '@/assets/doodle-chai.webp'

const cardAnim = (i: number) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
})

const hoverLift =
  'transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#171512]'

function Spot({ src, alt, className }: { src: StaticImageData; alt: string; className?: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      className={`pointer-events-none select-none ${className ?? ''}`}
      draggable={false}
    />
  )
}

function InteractiveRating() {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(s)}
            className="transition-transform hover:scale-125"
            aria-label={`Rate ${s} stars`}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                s <= (hover || rating) ? 'fill-[#f0a202] text-[#171512]' : 'text-[#171512]/25'
              }`}
            />
          </button>
        ))}
      </div>
      <p className="font-hand mt-2 h-5 text-lg text-[#17453a]">
        {rating
          ? `you rated it ${rating}/5 — weighted by count & recency, so trusted notes rise ↑`
          : '← try it, rate this note'}
      </p>
    </div>
  )
}

export default function Features() {
  return (
    <section id="features" className="paper-grain relative mx-auto max-w-7xl px-6 py-24">
      {/* floating doodle */}
      <Image
        src={doodleChai}
        alt=""
        aria-hidden
        className="animate-wobble pointer-events-none absolute right-[3%] top-16 hidden w-20 opacity-90 lg:block"
        draggable={false}
      />

      <motion.div {...cardAnim(0)} className="mx-auto max-w-2xl text-center">
        <span className="stamp text-[#8a5a00]">Everything in one vault</span>
        <h2 className="font-display mt-5 text-3xl font-black tracking-tight md:text-5xl">
          Four superpowers for <span className="hl">every semester</span>
        </h2>
        <p className="mt-4 text-[#171512]/65">
          No more scattered PDFs on WhatsApp groups, dead Telegram channels, or studying alone at 2 AM.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Notes — large card */}
        <motion.div {...cardAnim(1)} className={`paper-card rounded-2xl p-7 lg:col-span-2 ${hoverLift}`}>
          <div className="flex items-start justify-between">
            <Spot src={spotNote} alt="A note stamped with a gold star" className="h-24 w-auto -rotate-3" />
            <span className="rounded-full border-[1.5px] border-[#171512] bg-[#f0a202]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8a5a00]">
              Rated by students
            </span>
          </div>
          <h3 className="font-display mt-5 text-2xl font-black">Trusted, rated notes — not random PDFs</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#171512]/70">
            Every note carries a 1–5 star rating, weighted by rating count and recency so a single
            5-star never outranks a note trusted by hundreds. Search scans titles, tags,{' '}
            <em className="font-semibold not-italic text-[#17453a]">and the text inside your files</em>.
          </p>
          <div className="mt-5 rounded-xl border-[1.5px] border-dashed border-[#171512]/40 bg-[#f6f1e5] p-4">
            <div className="flex items-center gap-2 text-sm">
              <Search className="h-4 w-4 text-[#171512]/50" />
              <span className="font-medium">“b-tree indexing”</span>
              <span className="ml-auto text-xs font-bold text-[#17453a]">14 results · DBMS</span>
            </div>
            <div className="mt-3 border-t-[1.5px] border-dashed border-[#171512]/25 pt-3">
              <p className="text-sm font-bold">DBMS Unit 3 — Indexing & Normalization.pdf</p>
              <InteractiveRating />
            </div>
          </div>
        </motion.div>

        {/* University communities */}
        <motion.div {...cardAnim(2)} className={`paper-card rounded-2xl p-7 ${hoverLift}`}>
          <Spot src={spotUniversity} alt="University stamp" className="h-24 w-auto rotate-2" />
          <h3 className="font-display mt-5 text-2xl font-black">Your university, verified</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#171512]/70">
            One college email proves you belong. Communities are scoped to your whole university —
            notes and conversations stay relevant to your actual exams.
          </p>
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center gap-2 rounded-lg border-[1.5px] border-[#171512] bg-[#17453a]/8 px-3 py-2.5 text-xs">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#17453a]" />
              <span>priya@<b>iitd.ac.in</b></span>
              <span className="ml-auto font-bold text-[#17453a]">Verified ✓</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border-[1.5px] border-[#171512]/25 bg-[#fffdf6] px-3 py-2.5 text-xs text-[#171512]/60">
              <MessageSquare className="h-4 w-4 shrink-0 text-[#e8890c]" />
              “PYQ for EC-305 end-sem anyone?”
            </div>
            <div className="flex items-center gap-2 rounded-lg border-[1.5px] border-[#171512]/25 bg-[#fffdf6] px-3 py-2.5 text-xs text-[#171512]/60">
              <MessageSquare className="h-4 w-4 shrink-0 text-[#e8890c]" />
              “Unit 2 summary thread — exam tips”
            </div>
          </div>
        </motion.div>

        {/* Study rooms */}
        <motion.div {...cardAnim(3)} className={`paper-card rounded-2xl p-7 ${hoverLift}`}>
          <Spot src={spotPomodoro} alt="Pomodoro timer with students studying around it" className="h-24 w-auto -rotate-1" />
          <h3 className="font-display mt-5 text-2xl font-black">Live study rooms</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#171512]/70">
            Video, audio, a synced timer and light chat. Join a public room or your university&apos;s —
            the room keeps going even if the host leaves.
          </p>
          <div className="mt-5 flex items-center gap-3 rounded-lg border-[1.5px] border-[#171512] bg-[#17453a] px-4 py-3 text-[#f6f1e5]">
            <span className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-[#f0a202]" />
            <Timer className="h-4 w-4 text-[#f0a202]" />
            <span className="font-display text-sm font-black tabular-nums">25:00 focus</span>
            <Mic className="ml-auto h-4 w-4 text-[#f6f1e5]/60" />
          </div>
        </motion.div>

        {/* Roadmaps — wide card */}
        <motion.div {...cardAnim(4)} className={`paper-card rounded-2xl p-7 lg:col-span-2 ${hoverLift}`}>
          <div className="flex items-start justify-between">
            <Spot src={spotRoadmap} alt="An ink-drawn roadmap with checkpoint flags" className="h-24 w-auto rotate-2" />
            <span className="stamp text-[#17453a]">AI-powered</span>
          </div>
          <h3 className="font-display mt-5 text-2xl font-black">Roadmaps built from real notes</h3>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#171512]/70">
            Pick a topic, choose <b>in-depth</b> or <b>exam revision</b>, and ClassVault builds a
            phased study plan with checklists, tasks and source-note links — generated from notes
            you&apos;re actually allowed to use.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {['Phase 1 · Foundations', 'Phase 2 · Core practice', 'Phase 3 · Mock revision'].map((p, i) => (
              <div key={p} className="rounded-lg border-[1.5px] border-[#171512]/30 bg-[#f6f1e5] p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <CheckCircle2 className={`h-4 w-4 ${i === 0 ? 'text-[#17453a]' : 'text-[#171512]/30'}`} />
                  {p}
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full border border-[#171512]/30 bg-[#fffdf6]">
                  <div
                    className={`h-full ${i === 0 ? 'bg-[#17453a]' : i === 1 ? 'bg-[#f0a202]' : 'bg-transparent'}`}
                    style={{ width: i === 0 ? '100%' : i === 1 ? '45%' : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
