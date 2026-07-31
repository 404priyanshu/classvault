'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, Star, Timer, Users, Play, BadgeCheck, Check } from 'lucide-react'
import Image from 'next/image'
import vault from '@/assets/vault.webp'
import stickyNote from '@/assets/stationery/sticky-note-saffron.webp'
import tornNotebookPaper from '@/assets/stationery/torn-notebook-paper.webp'
import highlighterSwash from '@/assets/stationery/highlighter-swash-saffron.webp'
import { AsciiOrb } from '@/components/ui/ascii-orb'

const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** A headline word that materializes with a blur-to-sharp lift. */
function Word({ children, delay, className = '' }: { children: React.ReactNode; delay: number; className?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay, duration: 0.55, ease: EASE_OUT }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.span>
  )
}

/** Marker highlight whose swash sweeps in left-to-right after the words land. */
function SweepHighlight({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="relative inline-block whitespace-nowrap px-[0.04em]">
      <motion.span
        aria-hidden
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 -4% 0 0)' }}
        transition={{ delay, duration: 0.5, ease: EASE_OUT }}
        className="absolute -bottom-[0.06em] -left-[0.1em] z-0 block h-[0.78em] w-[calc(100%+0.2em)]"
      >
        <Image
          src={highlighterSwash}
          alt=""
          draggable={false}
          className="h-full w-full select-none object-fill saturate-[1.5]"
          sizes="320px"
          unoptimized
        />
      </motion.span>
      <span className="relative z-[1]">{children}</span>
    </span>
  )
}

function FloatingRoomCard() {
  const [secs, setSecs] = useState(24 * 60 + 59)

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 25 * 60)), 1000)
    return () => clearInterval(t)
  }, [])

  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  return (
    <div className="paper-card-green animate-float-slow absolute -bottom-6 -right-4 w-52 rounded-xl p-4 text-[#f6f1e5]" style={{ ['--rot' as string]: '4deg' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-[#f0a202]" />
          <span className="text-xs font-bold">Live study room</span>
        </div>
        <Timer className="h-3.5 w-3.5 text-[#f0a202]" />
      </div>
      <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#f0a202] drop-shadow-[0_0_10px_rgba(240,162,2,0.4)]">
        {mm}:{ss}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex -space-x-2">
          {['bg-[#f0a202]', 'bg-[#e8890c]', 'bg-[#fffdf6]', 'bg-[#7fb5a3]'].map((c, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2 + i * 0.1, type: 'spring', stiffness: 420, damping: 16 }}
              className={`h-6 w-6 rounded-full border-[1.5px] border-[#171512] ${c}`}
            />
          ))}
        </div>
        <span className="text-[10px] text-[#f6f1e5]/70">+9 studying now</span>
      </div>
    </div>
  )
}

/** A tiny dark console chip echoing the roadmap demo's AI language. */
function FloatingOrbChip() {
  return (
    <div
      className="animate-float-slow absolute -left-8 bottom-20 hidden w-44 rounded-xl border-[1.5px] border-[#171512] bg-[#0e231d] p-3 shadow-[4px_4px_0_#171512] lg:block"
      style={{ ['--rot' as string]: '-5deg', animationDelay: '-4.5s' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">AI roadmap</span>
        <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-[#8fd6b4]">
          <Check className="h-2.5 w-2.5" strokeWidth={3.5} /> ready
        </span>
      </div>
      <AsciiOrb cols={16} rows={8} className="mt-1.5 text-[4.5px]" />
    </div>
  )
}

function EarlyAccessBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-dashed border-[#17453a] bg-[#17453a]/8 px-4 py-1.5 text-xs font-bold text-[#17453a]">
      <span className="h-2 w-2 animate-pulse-dot rounded-full bg-[#17453a]" />
      Early access — free while we build
    </span>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 * i, duration: 0.8, ease: EASE_OUT },
  }),
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
  const glowX = useTransform(sx, (v) => v * -40)
  const glowY = useTransform(sy, (v) => v * -28)

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
      className="paper-grain bg-dotgrid relative overflow-hidden pb-32 pt-32 md:pb-36 md:pt-40"
    >
      {/* ambient glows drifting against the cursor */}
      <motion.div
        aria-hidden
        style={{ x: glowX, y: glowY }}
        className="pointer-events-none absolute -left-40 top-8 h-[26rem] w-[26rem] rounded-full bg-[#f0a202]/15 blur-3xl"
      />
      <motion.div
        aria-hidden
        style={{ x: glowY, y: glowX }}
        className="pointer-events-none absolute -right-40 bottom-0 h-[24rem] w-[24rem] rounded-full bg-[#17453a]/15 blur-3xl"
      />

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

            <h1 className="font-display mt-6 text-5xl font-black leading-[1.02] tracking-tight md:text-6xl xl:text-7xl">
              <Word delay={0.15}>Your</Word> <Word delay={0.21}>degree,</Word>{' '}
              <Word delay={0.29}>
                <SweepHighlight delay={0.85}>decoded.</SweepHighlight>
              </Word>
              <br />
              <Word delay={0.4}>Study</Word>{' '}
              <Word delay={0.46} className="font-display font-bold italic text-[#17453a]">together,</Word>{' '}
              <Word delay={0.54}>smarter.</Word>
            </h1>

            <motion.p variants={fadeUp} initial="hidden" animate="show" custom={4}
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#171512]/70 md:text-lg lg:mx-0">
              ClassVault puts trusted, student-rated notes, verified university communities,
              live study rooms, and AI study roadmaps into one vault — so you stop hunting
              for material and start topping your class.
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={5}
              className="mt-9 flex flex-col items-center gap-4 sm:flex-row lg:justify-start sm:justify-center">
              <a href="/auth/sign-up" data-burst className="btn-ink group relative flex items-center gap-2 overflow-hidden rounded-full px-8 py-3.5 font-bold">
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1/2 -translate-x-[160%] -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[320%]"
                />
                <span className="relative">Join your university free</span>
                <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a href="#roadmap" className="btn-saffron group flex items-center gap-2 rounded-full px-8 py-3.5 font-bold">
                <Play className="h-4 w-4 transition-transform duration-300 group-hover:scale-125" />
                Try the roadmap demo
              </a>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={6}
              className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <EarlyAccessBadge />
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
            transition={{ duration: 1, delay: 0.35, ease: EASE_OUT }}
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
          >
            <motion.div style={{ x: vaultX, y: vaultY }}>
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                <div className="pointer-events-none absolute -top-10 left-[7%] z-10 hidden h-32 w-36 rotate-[-6deg] place-items-center md:grid">
                  <Image
                    src={stickyNote}
                    alt=""
                    aria-hidden
                    fill
                    className="select-none object-contain [filter:drop-shadow(3px_4px_0_rgba(23,21,18,0.16))]"
                    sizes="144px"
                    draggable={false}
                    priority
                    unoptimized
                  />
                  <span className="font-hand relative z-[1] max-w-[100px] -translate-y-1 text-center text-base leading-[1.02] text-[#171512]/80">
                    every drawer = a subject ↓
                  </span>
                </div>
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
              <FloatingOrbChip />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* A narrow torn edge anchors the hero sheet directly to the ticker seam. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-7 overflow-hidden md:h-9"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 42%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 42%)',
        }}
      >
        <Image
          src={tornNotebookPaper}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute left-1/2 h-auto w-[104%] max-w-none -translate-x-1/2 select-none [filter:drop-shadow(0_4px_3px_rgba(23,21,18,0.14))]"
          style={{ bottom: 'clamp(-72px, -3.6vw, -14px)' }}
          sizes="100vw"
          unoptimized
        />
      </div>
    </section>
  )
}
