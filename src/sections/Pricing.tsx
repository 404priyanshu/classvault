'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import Image from 'next/image'
import ledger from '@/assets/ledger.webp'
import doodleCalculator from '@/assets/doodle-calculator.webp'
import doodleStamps from '@/assets/doodle-stamps.webp'

const free = [
  'Upload & share notes (limited storage)',
  'Browse, download & rate university notes',
  'Join public + university study rooms',
  'Basic roadmaps from your & public notes',
  'Limited roadmap generations',
  '30-day restore for deleted notes',
]

const pro = [
  'Everything in Free, expanded',
  'Unlimited roadmap generations*',
  'Roadmaps powered by university notes',
  'Longer rooms, bigger capacity',
  'Pro host controls: co-hosts, lock, mute-all',
  'AI extras & priority features',
  'Ad-free, forever',
]

export default function Pricing() {
  return (
    <section id="pricing" className="paper-grain bg-dotgrid relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="stamp text-[#8a5a00]">Pricing</span>
          <h2 className="font-display mt-5 text-3xl font-black tracking-tight md:text-5xl">
            Free to start. <span className="hl">Pro to fly.</span>
          </h2>
          <p className="mt-4 text-[#171512]/65">
            University notes and rooms are never paywalled — Pro unlocks power, not access.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20, rotate: -4 }}
            whileInView={{ opacity: 1, y: 0, rotate: -2 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-8 w-full max-w-md"
          >
            <Image
              src={ledger}
              alt="An open ledger with ₹0 → ₹149 written in ink"
              className="pointer-events-none h-auto w-full select-none [filter:drop-shadow(6px_8px_0_rgba(23,21,18,0.12))]"
              draggable={false}
            />
          </motion.div>
        </motion.div>

        <div className="relative mt-6 grid gap-8 md:grid-cols-2">
          {/* floating doodles */}
          <Image src={doodleCalculator} alt="" aria-hidden draggable={false}
            className="animate-float pointer-events-none absolute -left-24 top-24 hidden w-24 select-none xl:block" style={{ ['--rot' as string]: '-8deg' }} />
          <Image src={doodleStamps} alt="" aria-hidden draggable={false}
            className="animate-float-slow pointer-events-none absolute -right-20 bottom-10 hidden w-20 select-none xl:block" style={{ ['--rot' as string]: '6deg' }} />
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 32, rotate: -0.5 }}
            whileInView={{ opacity: 1, y: 0, rotate: -0.5 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8 }}
            className="paper-card rounded-2xl p-8 transition-all duration-200 hover:rotate-0 hover:shadow-[8px_8px_0_#171512]"
          >
            <h3 className="font-display text-2xl font-black">Free</h3>
            <p className="mt-1 text-sm font-medium text-[#171512]/55">For getting your semester together</p>
            <p className="font-display mt-6 text-6xl font-black">
              ₹0<span className="text-lg font-bold text-[#171512]/50">/forever</span>
            </p>
            <ul className="mt-8 space-y-3.5">
              {free.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm font-medium text-[#171512]/75">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px] border-[#171512] bg-[#fffdf6]">
                    <Check className="h-3 w-3" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <a href="#cta" className="btn-ink mt-9 block rounded-xl py-3 text-center text-sm font-bold">
              Start free
            </a>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 32, rotate: 0.5 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0.5 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, delay: 0.12 }}
            className="relative rounded-2xl border-[1.5px] border-[#171512] bg-[#17453a] p-8 text-[#f6f1e5] shadow-[8px_8px_0_#171512] transition-all duration-200 hover:rotate-0 hover:shadow-[10px_10px_0_#171512]"
          >
            <div className="tape -top-3 right-10" />
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-black">Pro</h3>
              <span className="stamp text-[#f0a202]">
                <Sparkles className="h-3 w-3" /> Most popular
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-[#f6f1e5]/60">For toppers-in-the-making</p>
            <p className="font-display mt-6 text-6xl font-black">
              ₹149<span className="text-lg font-bold text-[#f6f1e5]/50">/month</span>
            </p>
            <ul className="mt-8 space-y-3.5">
              {pro.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm font-medium text-[#f6f1e5]/90">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px] border-[#171512] bg-[#f0a202] text-[#171512]">
                    <Check className="h-3 w-3" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <a href="#cta" data-burst className="btn-saffron mt-9 block rounded-xl py-3 text-center text-sm font-black">
              Upgrade to Pro
            </a>
            <p className="mt-3 text-center text-[10px] font-medium text-[#f6f1e5]/50">
              *Subject to fair-use limits. Saved roadmaps stay yours, even after downgrade.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
