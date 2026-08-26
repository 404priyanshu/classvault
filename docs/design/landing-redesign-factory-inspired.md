# ClassVault landing redesign

Status: implementation specification  
Reference captured from the live Factory.ai site on 2026-08-27.

## Direction

Rebuild the marketing page as a precise study operating system: warm industrial neutrals, near-black product surfaces, a strict technical grid, Geist-like sans typography, mono UI labels, thin borders, low radii, and restrained signal orange. The product UI is the imagery. Do not reuse the previous paper, stationery, doodle, serif, cursive, sticker, or particle language.

Factory.ai supplies the pacing and discipline, not the identity. ClassVault keeps an original vault-aperture mark and an accurate student workflow: course file to permission-safe discovery to source-cited roadmap to synchronized focus room.

## Tokens

- Page: `#f5f5f5`
- Sunken surface: `#ebebeb`
- Raised surface: `#ffffff`
- Ink: `#020202`
- Dark surface: `#101010`
- Warm dark surface: `#1f1d1c`
- Light ink: `#f7f7f5`
- Border: `#b8b3b0`
- Muted: `#6d6865`
- Signal orange: `#ee6018`
- Max width: `1440px`
- Desktop gutter: `36px`; mobile gutter: `16px`
- Grid: 12 columns desktop, 4 columns mobile; 24px / 16px gaps
- Radius: 3px controls, 8px media, 12px major dark surfaces
- Section rhythm: 112-160px, reduced where the story needs continuity

Typography is landing-scoped: the existing Inter variable acts as the grotesk; system monospace is used for labels, state, numerals, and buttons. Display headings use 500 weight, one-line-height, and roughly `-0.04em` tracking.

## Above-the-fold copy lock

- Brand: `CLASSVAULT / STUDY SYSTEM`
- Navigation: `Product`, `Notes`, `Roadmaps`, `Study rooms`, `Access`
- Actions: `SIGN IN`, `CREATE ACCOUNT`
- H1: `THE STUDY INFRASTRUCTURE` / `FOR COLLEGE`
- Support: `TRUSTED NOTES. CITED PLANS. SHARED FOCUS.`
- CTAs: `CREATE YOUR VAULT`, `SEE THE SYSTEM`
- Hero canvas labels: `NOTE / READY`, `SEARCH / INDEXED`, `ROADMAP / CITED`, `ROOM / 24:59`

No hero eyebrow, badge, metric, testimonial, or invented proof claim.

## Page sequence

1. Fixed utilitarian header.
2. Centered manifesto hero over a large interactive study-system canvas.
3. Capability rail replacing a fake customer-logo wall.
4. Interactive product walkthrough with `01 NOTES`, `02 ROADMAP`, `03 ROOM`, and `04 ACCESS` states.
5. Permission-aware pipeline: `UPLOAD → PROCESS → AUTHORIZE → DISCOVER → CITE → FOCUS`.
6. Four product chapters: knowledge, planning, focus, and lifecycle.
7. Dark access matrix with real viewer/surface permissions.
8. Three-step account setup.
9. Dark final conversion block and compact legal footer.

## Product copy

- Product walkthrough heading: `FROM SCATTERED FILES TO A WORKING STUDY SESSION.`
- Capability line: `PERMISSION-SAFE SEARCH · PRIVATE FILE PREVIEWS · SOURCE-CITED ROADMAPS · REALTIME TIMER + CHAT`
- Pipeline heading: `FILES IN. FOCUS OUT.`
- Notes: `FIND WHAT YOU NEED. KNOW WHAT YOU'RE OPENING.`
- Roadmaps: `A STUDY PLAN THAT SHOWS ITS SOURCES.`
- Rooms: `START TOGETHER. STAY IN SYNC.`
- Access: `ACCESS IS NOT AN AFTERTHOUGHT.`
- Account: `SET UP ONCE. STUDY ACROSS THE SYSTEM.`
- Final CTA: `BUILD YOUR NEXT STUDY SESSION ON SOMETHING BETTER.`

Copy may describe only implemented behavior. Avoid live-model claims, video/audio, OCR, billing, adoption metrics, university logos, compliance badges, and verified-note claims.

## Components and states

- `VaultMark`: original interlocking-page aperture; outline and reversed variants.
- `LandingHeader`: fixed 72px shell, scroll border, mobile disclosure.
- `StudySystemCanvas`: cursor spotlight, scan line, cycling active nodes, reduced-motion fallback.
- `ProductWalkthrough`: accessible tab list; state-specific notes, roadmap, room, and access mockups.
- `Pipeline`: six real authorization and processing steps.
- `ProductChapters`: open four-column visual chapters; no default rounded card grid.
- `AccessMatrix`: viewer-by-surface permissions with explicit allowed, scoped, and denied states.
- `AccountSteps`: three numbered setup rows.
- `LandingFooter`: dark CTA plus real auth and legal links.

## Motion

- Page/UI transitions: 320-520ms, `cubic-bezier(.22,1,.36,1)`.
- Header and hero enter with transform only; server-rendered content remains visible.
- Hero canvas scan: 6-8 seconds; node state advances every 3.2 seconds.
- Buttons use a one-pixel diagonal hatch on hover and a 1px pressed translation.
- Product tabs change with a short Y translation and no hidden server content.
- All continuous and entrance motion stops under `prefers-reduced-motion`.

## Responsive

- Desktop hero keeps the heading, both CTAs, and top of the system canvas in the first 768px.
- Mobile header reduces to brand, account action, and menu.
- Hero type scales to 42-48px with balanced wrapping.
- Product walkthrough becomes tabs above a full-width panel.
- Pipeline becomes a vertically connected sequence.
- Product chapters become one column; no horizontal overflow.
- Access matrix remains readable through compact labels rather than horizontal scrolling.

## Reference evidence

The reference captures this document was written against were untracked working
files and are no longer on disk. This specification is therefore the concept
source of record. Recapture from the live reference site if a future revision
needs the visual comparison; nothing below depends on them.
