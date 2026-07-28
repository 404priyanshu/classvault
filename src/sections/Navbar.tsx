'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Menu, X } from 'lucide-react'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Roadmaps', href: '#roadmap' },
  { label: 'Study Rooms', href: '#rooms' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed left-0 right-0 top-0 z-50 border-b-[1.5px] transition-all duration-300 ${
        scrolled
          ? 'border-[#171512] bg-[#f6f1e5]/95 shadow-[0_4px_0_rgba(23,21,18,0.08)] backdrop-blur'
          : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg border-[1.5px] border-[#171512] bg-[#17453a] shadow-[3px_3px_0_#171512]">
            <BookOpen className="h-5 w-5 text-[#f6f1e5]" />
          </span>
          <span className="font-display text-xl font-black tracking-tight">
            Class<span className="text-[#17453a]">Vault</span>
          </span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-[#171512]/70 transition-colors hover:text-[#17453a]"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <a href="/auth/sign-in" className="text-sm font-semibold text-[#171512]/70 transition-colors hover:text-[#171512]">
            Sign in
          </a>
          <a href="/auth/sign-up" className="btn-saffron rounded-full px-5 py-2 text-sm font-bold">
            Get started free
          </a>
        </div>

        <button
          className="text-[#171512] md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="border-t-[1.5px] border-[#171512] bg-[#f6f1e5] px-6 py-4 md:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm font-medium text-[#171512]/80"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/auth/sign-up"
            onClick={() => setOpen(false)}
            className="btn-saffron mt-2 block rounded-full px-5 py-2.5 text-center text-sm font-bold"
          >
            Get started free
          </a>
        </div>
      )}
    </motion.header>
  )
}
