# Product

## Register

brand

## Platform

web

## Users

Indian college students discovering ClassVault before launch. They arrive skeptical — burned by scattered WhatsApp PDFs, dead Google Drive links, and low-quality notes — usually on a mobile device, often between classes or during exam prep. Their job on this page is to decide in under a minute whether ClassVault is worth their email address. Success is a launch-updates signup. The eventual app serves the same students, but this repo's primary surface is the marketing site; app UI work can override the register per task.

## Product Purpose

ClassVault is a study platform for Indian college students: rated notes shared in public and verified university-scoped communities, live study rooms with classmates, and personalized study roadmaps generated from plan-eligible notes. The landing page exists to convert pre-launch visitors into waitlist signups and set accurate expectations about what opens at launch. The full domain model lives in CONTEXT.md and docs/adr/.

## Positioning

Trusted, university-scoped notes. Ratings from real classmates and verified college-email communities are the differentiator every screen reinforces — the study loop and the calm ethos support that claim, they don't replace it.

## Conversion & proof

- Primary CTA: Get launch updates (waitlist signup via /coming-soon). Secondary: contact the team (hello@classvault.in) for anyone not ready to commit an email.
- The line a visitor remembers after 10 seconds: "Notes from my university that classmates actually rated — I can trust these."
- Belief ladder: (1) These notes are actually good — rated by classmates, scoped to verified universities. (2) My university is covered, or will be. (3) Joining the waitlist costs nothing and gets me in first.
- Proof on hand: none yet — pre-launch. Do not fabricate stats, ratings counts, user numbers, or university partnerships. Lean on product clarity, concrete mechanics (how verification and rating work), and design credibility until real proof exists. When real numbers arrive, add them to .impeccable/assets/proof/ and update this section.

## Brand Personality

Warm, trustworthy, studious. The interface should feel like a well-kept notebook owned by the smartest, most organized student in class: cared-for, human, and quietly confident. Serif display type, paper warmth, and hand-touched details (markers, tape, stickers) carry the warmth; precision in layout and honest copy carry the trust. Voice is direct and specific — it explains mechanics rather than making vague promises.

## Anti-references

- Generic SaaS landing: gradient heroes, hero-metric blocks, identical icon-heading-text card grids, corporate stock imagery.
- Ed-tech cliché: graduation caps, chalkboards, primary-color playfulness pitched at children rather than adults in college.
- Social/engagement app: feeds, streaks, likes, FOMO countdowns — anything that reads as attention-farming (the product explicitly rejects these; the marketing must too).
- Sterile note tool: cold gray minimalism of a generic docs utility, no warmth, no identity.

## Design Principles

1. **Practice the calm we promise.** The product's pitch is "no engagement bait" — so the page itself avoids manipulative urgency, fake scarcity, and dark patterns.
2. **Show the mechanics, don't assert the outcome.** Trust is earned by showing how ratings, scoping, and verification work, not by claiming "trusted by thousands."
3. **Honest until proven.** No invented stats, testimonials, or partner logos pre-launch. Concreteness comes from product truth, not fabricated social proof.
4. **Warmth with precision.** Hand-touched details (marker highlights, tape, stickers) are voice; they never come at the cost of alignment, contrast, or readability.
5. **Mobile is the primary reading.** Most visitors arrive on phones between classes; every section must earn its place at 375px first.

## Accessibility & Inclusion

WCAG 2.1 AA. Body text ≥4.5:1 contrast, large text ≥3:1, full keyboard navigation with visible focus, prefers-reduced-motion alternatives for every animation, semantic landmarks and labels for screen readers. Assume mid-range Android devices on inconsistent networks: keep pages fast and functional without JavaScript-heavy dependencies.
