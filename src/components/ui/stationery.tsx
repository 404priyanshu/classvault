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
        'pointer-events-none absolute z-10 h-auto w-28 max-w-none select-none',
        className,
      )}
      style={style}
      sizes="112px"
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
        className="pointer-events-none absolute -bottom-[0.03em] -left-[0.08em] z-0 h-[0.64em] w-[calc(100%+0.16em)] max-w-none select-none object-fill opacity-95"
        sizes="320px"
        unoptimized
      />
      <span className="relative z-[1]">{children}</span>
    </span>
  )
}
