'use client'

import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Github, Instagram, Twitter } from 'lucide-react'
import Image from 'next/image'
import doodleGlasses from '@/assets/doodle-glasses.webp'
import doodleHighlighter from '@/assets/doodle-highlighter.webp'
import stampBlankGreen from '@/assets/stationery/stamp-blank-green.webp'

const CONTACT_EMAIL = 'hello@priyanshu.co'

export default function Footer() {
  return (
    <>
      {/* CTA */}
      <section id="cta" className="paper-grain relative overflow-hidden border-y-[1.5px] border-[#171512] bg-[#f0a202] py-28">
        <div className="bg-dotgrid pointer-events-none absolute inset-0" />
        <Image src={doodleGlasses} alt="" aria-hidden draggable={false}
          className="animate-float pointer-events-none absolute left-[6%] top-16 hidden w-32 rotate-[-10deg] select-none opacity-90 lg:block" style={{ ['--rot' as string]: '-10deg' }} />
        <Image src={doodleHighlighter} alt="" aria-hidden draggable={false}
          className="animate-float-slow pointer-events-none absolute bottom-16 right-[6%] hidden w-36 rotate-[8deg] select-none opacity-90 lg:block" style={{ ['--rot' as string]: '8deg' }} />
        <div className="pointer-events-none absolute right-[9%] top-12 hidden h-32 w-32 rotate-[10deg] place-items-center xl:grid">
          <Image
            src={stampBlankGreen}
            alt=""
            aria-hidden
            fill
            draggable={false}
            className="select-none object-contain opacity-85 mix-blend-multiply"
            sizes="128px"
            unoptimized
          />
          <span className="font-hand relative z-[1] rotate-[-4deg] text-center text-lg font-bold uppercase leading-[0.95] text-[#17453a]">
            join<br />free
          </span>
        </div>
        <motion.div
          initial={{ y: 16 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: '140px' }}
          transition={{ duration: 0.45 }}
          className="relative mx-auto max-w-3xl px-6 text-center"
        >
          <h2 className="font-display text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Your semester called.<br />
            <span className="font-display italic">It wants a comeback arc.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-medium text-[#171512]/75">
            Share rated notes, study live with classmates, and follow roadmaps
            built from your own material. Opening at Bennett University first.
            Free to start.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="/auth/sign-up" data-burst className="btn-ink group flex items-center gap-2 rounded-full px-9 py-4 font-bold">
              Create your vault
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <span className="font-hand text-xl text-[#171512]/70">no credit card · verify anytime ✎</span>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-[#171512] text-[#f6f1e5]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg border-[1.5px] border-[#f6f1e5]/30 bg-[#17453a]">
                <BookOpen className="h-5 w-5 text-[#f6f1e5]" />
              </span>
              <span className="font-display text-xl font-black">
                Class<span className="text-[#f0a202]">Vault</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#f6f1e5]/55">
              The study platform where Indian college students share rated notes,
              join verified university communities, study together live, and follow
              personalized roadmaps.
            </p>
            <div className="mt-5 flex gap-3">
              {[Twitter, Instagram, Github].map((Icon, i) => (
                <a key={i} href="#top" className="grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-[#f6f1e5]/25 text-[#f6f1e5]/60 transition-all hover:border-[#f0a202] hover:text-[#f0a202]">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: 'Product',
              links: [
                { href: '#features', label: 'Notes & ratings' },
                { href: '#features', label: 'University communities' },
                { href: '#rooms', label: 'Study rooms' },
                { href: '#roadmap', label: 'Study roadmaps' },
              ],
            },
            {
              title: 'Plans',
              links: [
                { href: '#pricing', label: 'Free tier' },
                { href: '#pricing', label: 'Pro tier' },
                { href: '#faq', label: 'Common questions' },
              ],
            },
            {
              title: 'Trust',
              links: [
                { href: '/legal/terms', label: 'Terms of use' },
                { href: '/legal/privacy', label: 'Privacy policy' },
                { href: '/legal/takedown', label: 'Report content' },
                { href: `mailto:${CONTACT_EMAIL}`, label: 'Contact us' },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f0a202]">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm font-medium text-[#f6f1e5]/55 transition-colors hover:text-[#f6f1e5]">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[#f6f1e5]/10 py-6 text-center text-xs font-medium text-[#f6f1e5]/40">
          © 2026 ClassVault · Made with ☕ and last-minute motivation in India
        </div>
      </footer>
    </>
  )
}
