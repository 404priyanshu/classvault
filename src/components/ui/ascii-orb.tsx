'use client'

import { useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const RAMP = ' .·:;=+*#%@'
const TILT = 0.42
const CHAR_ASPECT = 0.58 // mono glyph width / line height
const LIGHT = (() => {
  const v = [-0.45, -0.78, 0.55]
  const len = Math.hypot(v[0], v[1], v[2])
  return [v[0] / len, v[1] / len, v[2] / len]
})()

/** Renders one frame of a lit, rotating sphere as ASCII characters. */
function orbFrame(t: number, cols: number, rows: number): string {
  const aspect = (cols * CHAR_ASPECT) / rows
  const cosT = Math.cos(t)
  const sinT = Math.sin(t)
  const cosX = Math.cos(TILT)
  const sinX = Math.sin(TILT)
  let out = ''
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const nx = ((i / (cols - 1)) * 2 - 1) * aspect
      const ny = (j / (rows - 1)) * 2 - 1
      const r2 = nx * nx + ny * ny
      if (r2 > 1) {
        out += ' '
        continue
      }
      const nz = Math.sqrt(1 - r2)
      // spin around Y, then tilt around X
      const x1 = nx * cosT + nz * sinT
      const z1 = -nx * sinT + nz * cosT
      const y2 = ny * cosX - z1 * sinX
      const z2 = ny * sinX + z1 * cosX
      let lum = x1 * LIGHT[0] + y2 * LIGHT[1] + z2 * LIGHT[2]
      // subtle surface texture so the spin reads as a rotating globe
      lum *= 0.86 + 0.14 * Math.sin(x1 * 5 + y2 * 3 + t * 0.7)
      const v = Math.max(0, Math.min(1, (lum + 0.34) / 1.34))
      out += RAMP[Math.round(v * (RAMP.length - 1))]
    }
    if (j < rows - 1) out += '\n'
  }
  return out
}

export function AsciiOrb({
  active = false,
  cols = 22,
  rows = 11,
  className = '',
}: {
  active?: boolean
  cols?: number
  rows?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const [t, setT] = useState(0.6)

  useEffect(() => {
    if (reduce) return
    const iv = setInterval(() => setT((v) => v + (active ? 0.16 : 0.05)), 66)
    return () => clearInterval(iv)
  }, [active, reduce])

  const frame = useMemo(() => orbFrame(t, cols, rows), [t, cols, rows])

  return (
    <pre
      aria-hidden
      className={`select-none whitespace-pre bg-[linear-gradient(140deg,#ffd166_0%,#f0a202_45%,#8fd6b4_100%)] bg-clip-text font-mono leading-[1em] text-transparent drop-shadow-[0_0_10px_rgba(240,162,2,0.35)] ${className}`}
    >
      {frame}
    </pre>
  )
}
