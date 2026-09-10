# Signup and student setup

A connected account → identity → university → degree/year → goal → rhythm → saved-profile welcome journey. Built on the existing Auth actions, real university directory, and server-owned onboarding RPC. The main checkout's changes through 91d6160 were merged before the final verification, including stale CAPTCHA wording, auth URL cleanup, and request-scoped claims.

## Visual system

Pale lavender canvas, white reading surface, violet campus panel, golden pencil, Inter typography, soft 13–32px corners, and tactile native radio choices. The original SVG pencil shares the existing loader's gold and graphite palette, with welcome, thinking, acknowledgement, help, and celebration poses. It adds no sound and honors reduced motion. The generated campus background is 900px wide WebP, stored at `public/images/journey-campus.webp`.

Concept: `signup-onboarding-concept.webp`. Reviewed desktop and mobile renders: `signup-onboarding-desktop.webp` and `signup-onboarding-mobile.webp`.

## Behavior and boundaries

- Signup errors return inline; fields stay in memory and CAPTCHA gets a new attempt. Passwords are never persisted. Google, GitHub, and phone entry retain their existing server actions and confirmation routes.
- Student setup starts after authentication. OAuth and email confirmation therefore do not carry student answers. A tab-only draft is keyed by authenticated user ID, validated, expires after 24 hours, and is removed on the saved-profile welcome page. Storage failure never prevents in-memory form use.
- All six final values remain persistent hidden controls. Back navigation and reload recovery preserve valid answers; a missing university in the current directory returns the student to campus selection.
- Completion redirects only after the secure RPC succeeds. The welcome page rechecks authenticated claims and saved onboarding completion, reads the actual university and membership status, and lists at most two authorized public notes through the existing library RPC. Empty and unavailable-library states are distinct.
- The only completion actions are real routes: Explore notes and Join a study room. No generated recommendations, invented live counts, or production schema changes.

## Visual review ledger

Reviewed with the in-app browser first. Its mobile capture incorrectly scaled screenshots, so precise captures and repeated checks used Playwright Chromium. Desktop was checked at 1440×1000 and at the concept's native 1505×1045; mobile at 390×844, plus overflow checks at 320, 360, 768, and 1440px. The concept and rendered screenshots were inspected with `view_image`.

| Comparison | Result / intentional adaptation |
| --- | --- |
| Composition | Violet companion panel beside white form retained; mobile uses a compact full-width companion header. |
| Typography | Existing Inter family and ClassVault brand retained; responsive headings 25–35px keep real form text readable. |
| Palette and depth | Lavender canvas, violet edge glow, rounded white surface, yellow/purple pencil, and soft action shadow retained. |
| Character / imagery | One expressive native SVG replaces raster pose swaps; separate generated campus art supplies depth. Decorative text invented inside the concept image was omitted. |
| Controls | Four tactile goal rows and right-aligned primary action retained. Existing Lucide goal icons and product option descriptions intentionally retained. |
| Progress and copy | Current step is lighter than completed steps; 100% appears only after saving. Heading and option labels match the concept; existing option descriptions and dynamic guide feedback are intentional copy adaptations. |
| Responsive recovery | Fixed password toggle positioning, prevented React action resets from visually clearing controlled selections, and fixed narrow CAPTCHA/grid overflow. |

The implementation was visually verified against the concept's intended design, with the adaptations above. No known clipped controls or mobile horizontal overflow remain.

## Asset generation briefs

Built-in Image Gen was used; no external artwork creation was required.

Concept prompt: Create a premium ClassVault desktop student onboarding screen with a pale lavender canvas, split luminous violet companion panel and white form, Inter typography, an original expressive yellow pencil with purple eraser and graphite tip, five-segment progress, “What are you working toward?”, four spacious tactile goal radio rows, Back and Continue. Extend the same system to account signup, name, university, degree/year, study preference, and personalized completion. Keep UI code-native, no invented stats or badges.

Campus asset prompt: A vertical atmospheric violet/periwinkle Indian university courtyard at blue hour, soft stylized miniature architecture, restrained facade on the left and glowing lamp on the right, open upper air for white headings and uncluttered center for a separate pencil character, lavender pool of light in the foreground. No people, pencil, text, signs, logos, or UI.

## Verification limitations

Authenticated UI states were tested using temporary isolated sample props and a deliberately failing local action. Those QA routes and copied components were removed before the production build. Live account creation, OAuth consent, SMS delivery, and production profile writes were not repeated. The local database test command could not connect to Postgres; production was not used as a fallback.

Final checks: 135 Vitest assertions passed; TypeScript, ESLint, and the production build passed; all 27 Playwright browser tests passed. The separate isolated journey check covered keyboard campus selection, degree/goal/style choices, pending lock, failed-save selection retention, Back/reload recovery, long campus names, both membership states, phone/OTP layouts, and reduced motion, with zero browser page errors.
