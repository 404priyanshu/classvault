'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { Lightbulb } from 'lucide-react'

/* ---------- rubber stamps on background clicks ---------- */
const STAMP_DEFS = [
  { text: 'VERIFIED ✓', color: '#17453a' },
  { text: 'A+', color: '#e8890c' },
  { text: 'TOP RATED ★', color: '#17453a' },
  { text: '★ STAR NOTE', color: '#8a5a00' },
  { text: 'ARCHIVED', color: '#8a5a00' },
]

type Stamp = {
  id: number
  x: number
  y: number
  rot: number
  def: (typeof STAMP_DEFS)[number]
  small?: boolean
}

let stampId = 0

function StampLayer({ stamps }: { stamps: Stamp[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[90]">
      <AnimatePresence>
        {stamps.map((s) => (
          <motion.div
            key={s.id}
            initial={{ scale: 2.4, opacity: 0, rotate: s.rot * 3 }}
            animate={{ scale: 1, opacity: 1, rotate: s.rot }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.35 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="absolute"
            style={{ left: s.x, top: s.y, translateX: '-50%', translateY: '-50%', mixBlendMode: 'multiply' }}
          >
            <span
              className={`inline-block whitespace-nowrap rounded-md font-black uppercase tracking-widest ${
                s.small ? 'border-2 px-2 py-0.5 text-[10px]' : 'border-[3px] px-3 py-1 text-sm'
              }`}
              style={{ borderColor: s.def.color, color: s.def.color, opacity: 0.85 }}
            >
              {s.def.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ---------- burst particles from CTAs ---------- */
type Burst = {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  rot: number
  color: string
}

function BurstLayer({ bursts }: { bursts: Burst[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[95]">
      <AnimatePresence>
        {bursts.map((b) => (
          <motion.span
            key={b.id}
            initial={{ x: b.x - 12, y: b.y - 12, scale: 0.3, opacity: 1, rotate: 0 }}
            animate={{ x: b.x + b.dx, y: b.y + b.dy, scale: 1.1, opacity: 0, rotate: b.rot }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.15, 0.8, 0.3, 1] }}
            className="absolute text-xl"
            style={{ color: b.color }}
          >
            ★
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}

function subscribeFinePointer(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia('(pointer: fine)')
  mediaQuery.addEventListener('change', onStoreChange)
  return () => mediaQuery.removeEventListener('change', onStoreChange)
}

function getFinePointerSnapshot() {
  return window.matchMedia('(pointer: fine)').matches
}

export default function InteractiveFX() {
  /* lamp */
  const [lamp, setLamp] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!lamp) return
    const move = (e: MouseEvent) => {
      overlayRef.current?.style.setProperty(
        'background',
        `radial-gradient(circle 340px at ${e.clientX}px ${e.clientY}px, rgba(240,162,2,0.07) 0%, rgba(20,16,6,0.45) 42%, rgba(14,11,4,0.86) 100%)`
      )
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [lamp])

  /* stamps + bursts */
  const [stamps, setStamps] = useState<Stamp[]>([])
  const [bursts, setBursts] = useState<Burst[]>([])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // CTA burst
      const burstEl = target.closest('[data-burst]')
      if (burstEl) {
        const fresh: Burst[] = Array.from({ length: 12 }, () => {
          const angle = Math.random() * Math.PI * 2
          const dist = 60 + Math.random() * 110
          return {
            id: ++stampId,
            x: e.clientX,
            y: e.clientY,
            dx: Math.cos(angle) * dist,
            dy: Math.sin(angle) * dist - 40,
            rot: (Math.random() - 0.5) * 300,
            color: Math.random() > 0.5 ? '#e8890c' : '#17453a',
          }
        })
        setBursts((p) => [...p, ...fresh])
        setTimeout(() => setBursts((p) => p.filter((b) => !fresh.includes(b))), 1000)
        return
      }

      // ignore interactive elements
      if (target.closest('a, button, input, textarea, select, label, summary, [role="button"], [data-nostamp]')) return

      const def = STAMP_DEFS[Math.floor(Math.random() * STAMP_DEFS.length)]
      const s: Stamp = {
        id: ++stampId,
        x: e.clientX,
        y: e.clientY,
        rot: (Math.random() - 0.5) * 24,
        def,
      }
      setStamps((p) => [...p.slice(-6), s])
      setTimeout(() => setStamps((p) => p.filter((x) => x.id !== s.id)), 1600)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  /* scroll pencil */
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      setProgress(h.scrollTop / (h.scrollHeight - h.clientHeight))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* cursor companion (fine pointers only) */
  const finePointer = useSyncExternalStore(
    subscribeFinePointer,
    getFinePointerSnapshot,
    () => false,
  )
  const cx = useMotionValue(-100)
  const cy = useMotionValue(-100)
  const dotX = useSpring(cx, { stiffness: 900, damping: 45 })
  const dotY = useSpring(cy, { stiffness: 900, damping: 45 })
  const ringX = useSpring(cx, { stiffness: 180, damping: 22 })
  const ringY = useSpring(cy, { stiffness: 180, damping: 22 })
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    if (!finePointer) return
    const move = (e: MouseEvent) => {
      cx.set(e.clientX)
      cy.set(e.clientY)
      setHovering(!!(e.target as HTMLElement).closest('a, button, [role="button"]'))
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [finePointer, cx, cy])

  return (
    <>
      {/* scroll pencil */}
      <div className="pointer-events-none fixed left-0 top-0 z-[80] h-[4px] w-full bg-[#171512]/8">
        <div
          className="relative h-full bg-[#171512] transition-[width] duration-100 ease-linear"
          style={{ width: `${progress * 100}%` }}
        >
          <span className="absolute -right-2 -top-[7px] text-sm" style={{ transform: 'rotate(45deg)' }}>✏️</span>
        </div>
      </div>

      {/* cursor companion */}
      {finePointer && (
        <>
          <motion.div
            className="pointer-events-none fixed z-[100] h-2 w-2 rounded-full bg-[#171512]"
            style={{ x: dotX, y: dotY, translateX: '-50%', translateY: '-50%' }}
          />
          <motion.div
            className="pointer-events-none fixed z-[100] rounded-full border-[1.5px] border-[#17453a]/50"
            style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
            animate={{ width: hovering ? 44 : 28, height: hovering ? 44 : 28, opacity: hovering ? 0.9 : 0.5 }}
            transition={{ duration: 0.2 }}
          />
        </>
      )}

      {/* study lamp overlay */}
      <div
        ref={overlayRef}
        className={`pointer-events-none fixed inset-0 z-[70] transition-opacity duration-700 ${
          lamp ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(circle 340px at 50% 40%, rgba(240,162,2,0.07) 0%, rgba(20,16,6,0.45) 42%, rgba(14,11,4,0.86) 100%)',
        }}
      />

      {/* lamp toggle */}
      <button
        onClick={() => setLamp((v) => !v)}
        data-nostamp
        aria-label="Toggle study lamp"
        className={`fixed bottom-4 right-4 z-[96] flex items-center gap-0 rounded-full border-[1.5px] border-[#171512] p-3 font-bold shadow-[3px_3px_0_#171512] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#171512] sm:bottom-6 sm:right-6 sm:gap-2 sm:px-4 sm:py-2.5 ${
          lamp ? 'bg-[#f0a202] text-[#171512]' : 'bg-[#fffdf6] text-[#171512]/70'
        }`}
      >
        <Lightbulb className={`h-4 w-4 ${lamp ? 'fill-[#171512]' : ''}`} />
        <span className="hidden text-xs sm:inline">{lamp ? 'lights on' : 'night study'}</span>
      </button>

      <StampLayer stamps={stamps} />
      <BurstLayer bursts={bursts} />
    </>
  )
}
