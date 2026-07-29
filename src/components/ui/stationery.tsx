import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'

import tapeGreen from '@/assets/stationery/tape-green-diagonal.webp'
import tapeSaffron from '@/assets/stationery/tape-saffron-horizontal.webp'
import highlighterSwash from '@/assets/stationery/highlighter-swash-saffron.webp'
import { cn } from '@/lib/utils'

type TapeProps = {
  className?: string
  style?: CSSProperties
  variant?: 'saffron' | 'green'
}

export function Tape({ className, style, variant = 'saffron' }: TapeProps) {
  const src = variant === 'green' ? tapeGreen : tapeSaffron

  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      className={cn(
        'pointer-events-none absolute z-10 h-auto max-w-none select-none [filter:drop-shadow(1px_2px_0_rgba(23,21,18,0.16))]',
        // the green asset carries a baked-in diagonal sweep on a tall canvas,
        // so it needs a smaller width to read as the same strip of tape
        variant === 'green' ? '-top-5 w-24' : '-top-3 w-32',
        className,
      )}
      style={style}
      sizes="128px"
      unoptimized
    />
  )
}

export function MarkerHighlight({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn('relative inline-block px-[0.04em]', className)}>
      <Image
        src={highlighterSwash}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute -bottom-[0.06em] -left-[0.1em] z-0 h-[0.78em] w-[calc(100%+0.2em)] max-w-none select-none object-fill saturate-[1.5]"
        sizes="320px"
        unoptimized
      />
      <span className="relative z-[1]">{children}</span>
    </span>
  )
}
