import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/** Types text character by character, token-stream style. Instantly complete under reduced motion. */
export function Typed({
  text,
  delay = 0,
  speed = 11,
  className = '',
  caret = false,
}: {
  text: string
  delay?: number
  speed?: number
  className?: string
  caret?: boolean
}) {
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)

  useEffect(() => {
    if (reduce) return
    let i = 0
    let interval: ReturnType<typeof setInterval> | undefined
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        i += 1
        setN(i)
        if (i >= text.length && interval) clearInterval(interval)
      }, speed)
    }, delay)
    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [text, delay, speed, reduce])

  const shown = reduce ? text : text.slice(0, n)
  const typing = shown.length < text.length
  return (
    <span className={className}>
      {shown}
      {caret && typing && (
        <span aria-hidden className="animate-caret-blink ml-0.5 inline-block h-[1em] w-[7px] translate-y-[2px] rounded-[1px] bg-[#f0a202]" />
      )}
    </span>
  )
}
