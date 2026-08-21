import { motion } from 'framer-motion'
import { BookOpenCheck, Layers3, ShieldCheck } from 'lucide-react'
import { AsciiOrb } from '@/components/ui/ascii-orb'
import { EASE_OUT } from './plans'

export function IdlePreview({ topic }: { topic: string }) {
  return (
    <div className="mx-auto flex min-h-[490px] w-full max-w-md flex-col items-center justify-center text-center">
      <div className="relative grid h-36 w-36 place-items-center">
        <motion.div
          aria-hidden
          className="absolute inset-2 rounded-full border border-[#f0a202]/20"
          animate={{ scale: [0.92, 1.08], opacity: [0.65, 0.18, 0.65] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: EASE_OUT }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full border border-dashed border-white/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        />
        <AsciiOrb cols={26} rows={13} className="relative text-[7px]" />
      </div>

      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#f0a202]/70">
        Previewing your build
      </p>
      <p className="mt-2 max-w-[300px] text-base font-semibold leading-snug text-[#f6f1e5]">
        {topic}
      </p>
      <p className="mt-2 max-w-[310px] text-sm leading-relaxed text-white/55">
        Choose a mode, then watch an access-aware study plan assemble phase by phase.
      </p>

      <div className="mt-7 grid w-full grid-cols-2 gap-2 text-left">
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3.5">
          <Layers3 className="h-4 w-4 text-[#f0a202]" />
          <p className="mt-2 text-sm font-bold text-[#f6f1e5]">4 focused phases</p>
          <p className="mt-1 text-xs leading-relaxed text-white/40">From foundations to final review</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3.5">
          <BookOpenCheck className="h-4 w-4 text-[#8fd6b4]" />
          <p className="mt-2 text-sm font-bold text-[#f6f1e5]">Source-aware</p>
          <p className="mt-1 text-xs leading-relaxed text-white/40">Built around notes you can access</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
        <ShieldCheck className="h-3.5 w-3.5 text-[#8fd6b4]/65" />
        Sample output · no real generation yet
      </div>
    </div>
  )
}
