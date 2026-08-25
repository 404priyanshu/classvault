/**
 * Shared scroll-reveal timing.
 *
 * Sections previously each carried their own numbers, mostly a 0.8-0.9s fade
 * with `margin: '-80px'`. That margin shrinks the observer root, so a section
 * only began animating once it was already 80px inside the viewport, and then
 * took most of a second to finish. At ordinary scroll speed the reader was
 * always looking at half-faded content, which is what made the page feel
 * unsettled rather than deliberate.
 *
 * The rule now: a reveal starts before its section is on screen and is over by
 * the time the reader gets there. Positive viewport margin expands the root, so
 * the trigger fires early.
 */

export const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** Fires ~140px before the element scrolls into view. */
export const REVEAL_VIEWPORT = { margin: '140px', once: true } as const

/** Section headers and other large blocks. */
export const revealUp = {
  initial: { opacity: 0, y: 14 },
  transition: { duration: 0.45, ease: EASE_OUT },
  viewport: REVEAL_VIEWPORT,
  whileInView: { opacity: 1, y: 0 },
} as const

/** A single panel or figure that should feel like one object arriving. */
export const revealPanel = {
  initial: { opacity: 0, y: 20 },
  transition: { duration: 0.5, ease: EASE_OUT },
  viewport: REVEAL_VIEWPORT,
  whileInView: { opacity: 1, y: 0 },
} as const

/**
 * Items within one list. Staggering a group is legitimate; the same entrance
 * applied to every section is not, which is why the delay is capped low and
 * only used inside a grid.
 */
export function revealItem(index: number) {
  return {
    initial: { opacity: 0, y: 16 },
    transition: {
      delay: Math.min(index, 3) * 0.06,
      duration: 0.45,
      ease: EASE_OUT,
    },
    viewport: REVEAL_VIEWPORT,
    whileInView: { opacity: 1, y: 0 },
  } as const
}
