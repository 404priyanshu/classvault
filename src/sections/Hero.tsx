'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, Star, Timer, Users, Play, BadgeCheck } from 'lucide-react'
import Image from 'next/image'
import vault from '@/assets/vault.webp'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 * i, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

function FloatingRoomCard() {
  return (
    <div className="paper-card-green animate-float-slow absolute -bottom-6 -right-4 w-52 rounded-xl p-4 text-[#f6f1e5]" style={{ ['--rot' as string]: '4deg' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-[#f0a202]" />
          <span className="text-xs font-bold">Live study room</span>
        </div>
        <Timer className="h-3.5 w-3.5 text-[#f0a202]" />
      </div>
      <p className="font-display mt-2 text-2xl font-black tabular-nums">24:59</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex -space-x-2">
          {['bg-[#f0a202]', 'bg-[#e8890c]', 'bg-[#fffdf6]', 'bg-[#7fb5a3]'].map((c, i) => (
            <span key={i} className={`h-6 w-6 rounded-full border-[1.5px] border-[#171512] ${c}`} />
          ))}
        </div>
        <span className="text-[10px] text-[#f6f1e5]/70">+9 studying now</span>
      </div>
    </div>
  )
}

function LiveCounter() {
  const [count, setCount] = useState(2314)
  useEffect(() => {
    const t = setInterval(() => {
      setCount((c) => Math.max(2000, c + Math.floor(Math.random() * 7) - 2))
    }, 4000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-dashed border-[#17453a] bg-[#17453a]/8 px-4 py-1.5 text-xs font-bold text-[#17453a]">
      <span className="h-2 w-2 animate-pulse-dot rounded-full bg-[#17453a]" />
      <span className="tabular-nums">{count.toLocaleString('en-IN')}</span> students studying right now
    </span>
  )
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 55, damping: 16 })
  const sy = useSpring(my, { stiffness: 55, damping: 16 })
  const vaultX = useTransform(sx, (v) => v * 24)
  const vaultY = useTransform(sy, (v) => v * 16)
  const cardX = useTransform(sx, (v) => v * -16)
  const cardY = useTransform(sy, (v) => v * -10)

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect()
    if (!rect) return
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <section
      id="top"
      ref={sectionRef}
      onMouseMove={onMouseMove}
      className="paper-grain bg-dotgrid relative overflow-hidden pb-24 pt-32 md:pt-40"
    >
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          {/* left: copy */}
          <div className="relative text-center lg:text-left">
            <div className="font-hand pointer-events-none absolute -top-10 left-2 hidden rotate-[-8deg] text-2xl text-[#17453a] xl:block">
              100% free to start ↓
            </div>
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
              <span className="stamp text-[#17453a]">
                <BadgeCheck className="h-3.5 w-3.5" />
                Made for Indian college students
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
              className="font-display mt-6 text-5xl font-black leading-[1.02] tracking-tight md:text-6xl xl:text-7xl">
              Your degree,{' '}
              <span className="hl whitespace-nowrap">decoded.</span>
              <br />
              Study <em className="font-display font-bold italic text-[#17453a]">together,</em> smarter.
            </motion.h1>

            <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#171512]/70 md:text-lg lg:mx-0">
              ClassVault puts trusted, student-rated notes, verified university communities,
              live study rooms, and AI study roadmaps into one vault — so you stop hunting
              for material and start topping your class.
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
              className="mt-9 flex flex-col items-center gap-4 sm:flex-row lg:justify-start sm:justify-center">
              <a href="#cta" data-burst className="btn-ink group flex items-center gap-2 rounded-full px-8 py-3.5 font-bold">
                Join your university free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a href="#roadmap" className="btn-saffron group flex items-center gap-2 rounded-full px-8 py-3.5 font-bold">
                <Play className="h-4 w-4" />
                Try the roadmap demo
              </a>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}
              className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <LiveCounter />
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#171512]/60">
                <Star className="h-3.5 w-3.5 fill-[#f0a202] text-[#171512]" /> Community-rated notes
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#171512]/60">
                <Users className="h-3.5 w-3.5 text-[#17453a]" /> Verified by college email
              </span>
            </motion.div>
          </div>

          {/* right: the vault (mouse parallax) */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 3 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
          >
            <div className="font-hand pointer-events-none absolute -top-8 right-4 z-10 rotate-[6deg] text-2xl text-[#8a5a00]">
              every drawer = a subject ↓
            </div>
            <motion.div style={{ x: vaultX, y: vaultY }}>
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image
                  src={vault}
                  alt="The ClassVault archive — drawers of rated notes, timers and university pennants"
                  className="h-auto w-full [filter:drop-shadow(10px_12px_0_rgba(23,21,18,0.14))]"
                  priority
                  sizes="(min-width: 1024px) 48vw, (min-width: 640px) 512px, calc(100vw - 48px)"
                />
              </motion.div>
            </motion.div>
            <motion.div className="hidden sm:block" style={{ x: cardX, y: cardY }}>
              <FloatingRoomCard />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* torn-paper edge into next section */}
      <div className="mt-24 border-t-[1.5px] border-dashed border-[#171512]/30" />
    </section>
  )
}
