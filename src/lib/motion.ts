/**
 * Shared scroll-reveal timing.
 *
 * Two rules, both learned the hard way.
 *
 * A reveal starts before its section is on screen and is over by the time the
 * reader gets there. Sections used to run 0.8-0.9s behind `margin: '-80px'`,
 * which shrinks the observer root, so a section only began animating once it
 * was already eighty pixels inside the viewport. At ordinary scroll speed the
 * reader was permanently looking at half-faded content.
 *
 * A reveal never decides whether content is visible. Framer serializes the
 * `initial` state into the server-rendered HTML, so animating opacity from 0
 * shipped forty-six elements at `opacity:0` in the markup. Anything that does
 * not run the animation -- a crawler, a social preview renderer, a hidden tab,
 * a reader whose JavaScript failed -- got a blank page below the hero. These
 * move on transform only. Content is legible before a single frame runs; the
 * motion is the enhancement, not the gate.
 */

export const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** Fires ~140px before the element scrolls into view. */
export const REVEAL_VIEWPORT = { margin: '140px', once: true } as const

/** Section headers and other large blocks. */
export const revealUp = {
  initial: { y: 14 },
  transition: { duration: 0.45, ease: EASE_OUT },
  viewport: REVEAL_VIEWPORT,
  whileInView: { y: 0 },
} as const

/** A single panel or figure that should feel like one object arriving. */
export const revealPanel = {
  initial: { y: 20 },
  transition: { duration: 0.5, ease: EASE_OUT },
  viewport: REVEAL_VIEWPORT,
  whileInView: { y: 0 },
} as const

/**
 * Items within one list. Staggering a group is legitimate; the same entrance
 * applied to every section is not, which is why the delay is capped low and
 * only used inside a grid.
 */
export function revealItem(index: number) {
  return {
    initial: { y: 16 },
    transition: {
      delay: Math.min(index, 3) * 0.06,
      duration: 0.45,
      ease: EASE_OUT,
    },
    viewport: REVEAL_VIEWPORT,
    whileInView: { y: 0 },
  } as const
}
