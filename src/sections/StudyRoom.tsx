'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Timer, Lock, Users } from 'lucide-react'
import Image from 'next/image'

import indexTab from '@/assets/stationery/index-tab-saffron.webp'

const CHAT = [
  { name: 'Ananya', msg: 'Pomodoro 3 starting — good luck everyone 🍅', color: 'text-[#f0a202]' },
  { name: 'Rahul', msg: 'Half of unit 4 done, this timer is carrying me', color: 'text-[#7fb5a3]' },
  { name: 'Sneha', msg: 'Can someone explain page replacement after this block?', color: 'text-[#f5c97b]' },
  { name: 'Arjun', msg: 'Sure — dropping my OS notes link after the break', color: 'text-[#a8d5c5]' },
  { name: 'Meera', msg: 'Muted myself, construction outside 😅', color: 'text-[#e8a87c]' },
  { name: 'Karthik', msg: '25 min of pure focus. No phones. Go go go', color: 'text-[#d4b896]' },
]

const PARTICIPANTS = [
  { initials: 'AN', color: 'bg-[#f0a202]' },
  { initials: 'RA', color: 'bg-[#7fb5a3]' },
  { initials: 'SN', color: 'bg-[#e8890c]' },
  { initials: 'AR', color: 'bg-[#fffdf6]' },
  { initials: 'ME', color: 'bg-[#c98f5a]' },
  { initials: 'KA', color: 'bg-[#5a8f7f]' },
]

export default function StudyRoom() {
  const [seconds, setSeconds] = useState(24 * 60 + 47)
  const [chatCount, setChatCount] = useState(3)

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 25 * 60)), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setChatCount((c) => (c >= CHAT.length ? 1 : c + 1)), 3200)
    return () => clearInterval(t)
  }, [])


  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  const progress = 1 - seconds / (25 * 60)

  return (
    <section id="rooms" className="relative border-b-[1.5px] border-[#171512] bg-[#17453a] py-20 md:py-32 text-[#f6f1e5]">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ y: 16 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: '140px' }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-black tracking-tight md:text-5xl">
            Never study <span className="font-display italic text-[#f0a202]">alone</span> again
          </h2>
          <p className="mt-4 text-[#f6f1e5]/70">
            This room is live right now (well, almost). Synced timers keep everyone honest —
            when the host leaves, the room studies on.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 16 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: '140px' }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="relative mx-auto mt-16 max-w-4xl rounded-2xl border border-[#171512]/50 bg-[#0f3229] [box-shadow:var(--elev-surface-lift)]"
        >
          <div className="pointer-events-none absolute -top-14 left-8 z-10 hidden w-36 -rotate-2 md:block">
            <Image
              src={indexTab}
              alt=""
              aria-hidden
              draggable={false}
              className="h-auto w-full select-none [filter:drop-shadow(2px_3px_0_rgba(23,21,18,0.3))]"
              sizes="144px"
              unoptimized
            />
            <span className="font-hand absolute inset-0 grid -translate-y-2 place-items-center text-center text-lg font-bold leading-none text-[#17453a]">
              interactive preview
            </span>
          </div>
          <div className="overflow-hidden rounded-[calc(1rem-2px)]">
          {/* room header */}
          <div className="flex flex-wrap items-center gap-3 border-b-[1.5px] border-[#171512] bg-[#f6f1e5] px-6 py-4 text-[#171512]">
            <span className="flex items-center gap-2 text-sm font-black">
              <span className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-[#e8890c]" />
              OS End-Sem Grind — Live
            </span>
            <span className="rounded-full border-[1.5px] border-[#171512] bg-[#17453a]/10 px-3 py-1 text-[10px] font-bold text-[#17453a]">university-scoped</span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#171512]/55">
              <Lock className="h-3 w-3" /> links never bypass scope
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-xs font-bold">
              <Users className="h-3.5 w-3.5" /> 13 / 20
            </span>
          </div>

          <div className="grid md:grid-cols-[1.3fr_1fr]">
            {/* member roster + timer */}
            <div className="border-b-[1.5px] border-[#f6f1e5]/15 p-6 md:border-b-0 md:border-r-[1.5px]">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f6f1e5]/45">
                In the room
              </p>
              <div className="grid grid-cols-3 gap-3">
                {PARTICIPANTS.map((p) => (
                  <div
                    key={p.initials}
                    className="relative aspect-square overflow-hidden rounded-xl border-[1.5px] border-[#f6f1e5]/15"
                  >
                    <div className={`absolute inset-0 grid place-items-center ${p.color}`}>
                      <span className="font-display text-lg font-black text-[#171512]">
                        {p.initials}
                      </span>
                    </div>
                    <span
                      aria-hidden
                      className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full border border-[#171512]/40 bg-[#7fb5a3]"
                    />
                  </div>
                ))}
              </div>

              {/* synced timer */}
              <div className="mt-5 rounded-xl border-[1.5px] border-[#f6f1e5]/25 bg-[#17453a] p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#f6f1e5]/60">
                    <Timer className="h-4 w-4 text-[#f0a202]" /> Synced focus timer
                  </span>
                  <span className="font-mono text-3xl font-bold tabular-nums text-[#f0a202] drop-shadow-[0_0_14px_rgba(240,162,2,0.45)]">
                    {mm}:{ss}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#0f3229]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#f0a202,#ffd166)] shadow-[0_0_12px_rgba(240,162,2,0.55)] transition-all duration-1000"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-md border border-[#f0a202]/50 bg-[#f0a202]/15 px-3 py-1 text-[10px] font-bold text-[#f0a202]">25 min focus</span>
                  <span className="rounded-md border border-[#f6f1e5]/25 px-3 py-1 text-[10px] font-semibold text-[#f6f1e5]/60">5 min break next</span>
                  <span className="ml-auto rounded-md border border-[#f6f1e5]/25 px-3 py-1 text-[10px] font-semibold text-[#f6f1e5]/60">
                    same clock for everyone
                  </span>
                </div>
              </div>
            </div>

            {/* chat */}
            <div className="flex flex-col p-6">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#f6f1e5]/60">
                <MessageSquare className="h-4 w-4 text-[#f0a202]" /> Room chat
              </p>
              <div className="flex-1 space-y-3 overflow-hidden">
                {CHAT.slice(0, chatCount).map((c, i) => (
                  <motion.div
                    key={`${i}-${c.name}`}
                    initial={{ y: 10, filter: 'blur(4px)' }}
                    animate={{ y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className={`text-[11px] font-black ${c.color}`}>{c.name}</p>
                    <p className="mt-0.5 inline-block rounded-lg rounded-tl-sm border border-[#f6f1e5]/20 bg-[#f6f1e5]/10 px-3 py-1.5 text-xs text-[#f6f1e5]/85">
                      {c.msg}
                    </p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg border-[1.5px] border-[#f6f1e5]/25 bg-[#17453a] px-3 py-2.5">
                <span className="text-xs text-[#f6f1e5]/40">Type a message…</span>
                <span className="ml-auto rounded-md bg-[#f0a202]/20 px-2 py-0.5 text-[10px] font-bold text-[#f0a202]">light chat only</span>
              </div>
            </div>
          </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ y: 10 }}
          whileInView={{ y: 0 }}
          viewport={{ margin: '140px', once: true }}
          transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="font-hand mt-6 text-center text-xl text-[#f6f1e5]/60"
        >
          at launch, Pro hosts get co-hosts, room lock &amp; bigger rooms →
        </motion.p>

        <motion.p
          initial={{ y: 10 }}
          whileInView={{ y: 0 }}
          viewport={{ margin: '140px', once: true }}
          transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="font-hand mt-2 text-center text-xl"
        >
          <a
            href="/auth/sign-up"
            className="font-bold text-[#f0a202] underline decoration-dashed decoration-2 underline-offset-4 transition-colors hover:text-[#f6f1e5]"
          >
            claim a seat in a real room →
          </a>
        </motion.p>
      </div>
    </section>
  )
}
