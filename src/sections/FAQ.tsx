'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import owl from '@/assets/owl.webp'
import pattern from '@/assets/pattern.webp'
import { MarkerHighlight } from '@/components/ui/stationery'

const faqs = [
  {
    q: 'How do I join my university community?',
    a: 'Sign up with Gmail or email, then verify with your college email address. Each approved email domain maps to exactly one university, so your community is always the real deal. If your university or domain is missing, you can request it and our admins review it before adding.',
  },
  {
    q: 'What counts as a note on ClassVault?',
    a: 'A note is an uploaded PDF or image with a title, scope (public or your university), and at least one subject tag. Notes are rated 1–5 stars by students, and rankings are weighted so a couple of ratings never beat genuine community trust.',
  },
  {
    q: 'Is my identity public?',
    a: 'You control a pseudonymous display name — no follower counts, no social graph, no profile-centric discovery. Your account identity stays private and is only visible to platform administrators for support and moderation.',
  },
  {
    q: 'How do study roadmaps actually work?',
    a: 'Pick a topic and a mode — in-depth or exam revision — and ClassVault generates a phased plan with checklists, tasks and source-note links, automatically built from the notes your plan allows. Free uses your notes plus public notes; Pro adds top university notes.',
  },
  {
    q: 'What happens if I delete a note by accident?',
    a: 'Deleted notes go into a 30-day recovery window: hidden from everyone, but restorable by you with ratings intact. After 30 days they are permanently removed.',
  },
  {
    q: 'Can I share my roadmap with friends?',
    a: 'Yes — every saved roadmap has a revocable share link. Public-note content is visible to anyone with the link; university-derived sections stay access-gated, so viewers only see what they are allowed to see.',
  },
]

export default function FAQ() {
  return (
    <section
      id="faq"
      className="relative px-6 py-24"
      style={{ backgroundImage: `url(${pattern.src})`, backgroundSize: '768px' }}
    >
      <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8 }}
        className="relative text-center"
      >
        <Image
          src={owl}
          alt="The ClassVault archivist owl, here to answer questions"
          className="animate-float pointer-events-none mx-auto mb-2 h-28 w-auto select-none"
          style={{ ['--rot' as string]: '-2deg' }}
          draggable={false}
        />
        <h2 className="font-display text-3xl font-black tracking-tight md:text-4xl">
          Questions? <MarkerHighlight>Answered.</MarkerHighlight>
        </h2>
        <p className="font-hand mt-2 text-xl text-[#171512]/55">the archivist has seen it all ↓</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="mt-10"
      >
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="paper-card-sm rounded-xl px-5 transition-all data-[state=open]:shadow-[5px_5px_0_#171512]"
            >
              <AccordionTrigger className="py-4 text-left text-sm font-bold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-[#171512]/70">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
      </div>
    </section>
  )
}
