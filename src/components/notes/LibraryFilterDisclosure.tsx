'use client'

import { useId, useState, type ReactNode } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The library's dropdown filters, folded behind a button on phones.
 *
 * Four full-width selects and an Apply button filled a phone's first screen
 * before any note showed. From `md` up there is room, so the filters are
 * always shown and the button disappears. Filters already in use start open,
 * so a student can see what is narrowing their results.
 */
export function LibraryFilterDisclosure({
  activeCount,
  children,
}: {
  activeCount: number
  children: ReactNode
}) {
  const [open, setOpen] = useState(activeCount > 0)
  const panelId = useId()

  return (
    <>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-club-line bg-club-paper px-4 text-sm font-bold text-club-purple md:hidden"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <SlidersHorizontal aria-hidden className="h-4 w-4" />
        Filters
        {activeCount > 0 ? (
          <span className="rounded-full bg-club-purple px-2 py-0.5 text-[11px] font-black text-club-paper">
            {activeCount}
          </span>
        ) : null}
        <ChevronDown
          aria-hidden
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
        />
      </button>
      <div
        className={cn(
          'mt-3 gap-3 md:grid md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]',
          open ? 'grid' : 'hidden',
        )}
        id={panelId}
      >
        {children}
      </div>
    </>
  )
}
