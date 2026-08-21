'use client'

import { Star } from 'lucide-react'
import { useState, useTransition } from 'react'
import {
  submitNoteRatingAction,
} from '@/app/dashboard/notes/[noteId]/actions'
import { Spinner } from '@/components/ui/spinner'

const STAR_VALUES = [1, 2, 3, 4, 5] as const

export function RatingStars({
  canRate,
  initialAverage,
  initialCount,
  initialUserRating,
  noteId,
}: {
  canRate: boolean
  initialAverage: number | null
  initialCount: number
  initialUserRating: number | null
  noteId: string
}) {
  const [userRating, setUserRating] = useState(initialUserRating)
  const [average, setAverage] = useState(initialAverage)
  const [ratingCount, setRatingCount] = useState(initialCount)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function rate(value: number) {
    if (!canRate || isPending || value === userRating) return

    const previous = { average, ratingCount, userRating }
    setError(null)
    setUserRating(value)

    startTransition(async () => {
      const result = await submitNoteRatingAction({ noteId, rating: value })

      if (result.ok) {
        setAverage(result.averageRating)
        setRatingCount(result.ratingCount)
      } else {
        setUserRating(previous.userRating)
        setError(result.error)
      }
    })
  }

  const summary =
    average === null
      ? 'Unrated'
      : `${average.toFixed(1)} · ${ratingCount} ${
          ratingCount === 1 ? 'rating' : 'ratings'
        }`

  return (
    <section
      aria-label="Rate this note"
      className="border border-[#cfc4ae] bg-[#fffdf6] p-5"
    >
      <h2 className="font-display text-xl font-black">Rate this note</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#171512]/60">
        Ratings weight recent feedback and rating volume, so honest stars help
        every student.
      </p>

      {canRate ? (
        <div className="mt-4 flex items-center gap-1" role="group">
          {STAR_VALUES.map((value) => {
            const filled = (userRating ?? 0) >= value

            return (
              <button
                aria-label={`Rate ${value} out of 5 stars`}
                aria-pressed={userRating === value}
                className="rounded-sm p-1 outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-[#f0a202] hover:-translate-y-0.5 disabled:cursor-wait"
                disabled={isPending}
                key={value}
                onClick={() => rate(value)}
                type="button"
              >
                <Star
                  aria-hidden
                  className={
                    filled
                      ? 'h-6 w-6 fill-[#f0a202] text-[#b56d00]'
                      : 'h-6 w-6 text-[#bfb39d]'
                  }
                  strokeWidth={1.8}
                />
              </button>
            )
          })}
          {isPending ? (
            <Spinner className="ml-2" decorative size={18} />
          ) : null}
        </div>
      ) : (
        <p className="mt-4 flex items-center gap-1.5 text-sm font-bold text-[#171512]/55">
          <Star aria-hidden className="h-4 w-4 fill-[#f0a202] text-[#b56d00]" />
          Only readers can rate this note.
        </p>
      )}

      <p aria-live="polite" className="mt-3 text-sm font-bold text-[#17453a]">
        {summary}
        {userRating ? (
          <span className="ml-2 font-semibold text-[#171512]/55">
            You rated {userRating}/5
          </span>
        ) : null}
      </p>

      {error ? (
        <p className="mt-2 border border-red-900/40 bg-red-50 px-3 py-2 text-xs font-semibold text-red-900" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}
