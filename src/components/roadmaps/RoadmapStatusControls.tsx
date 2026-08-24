'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { retryRoadmapAction } from '@/app/dashboard/roadmaps/actions'
import { Spinner } from '@/components/ui/spinner'
import { initialRoadmapGenerationState } from '@/lib/roadmaps/action-state'

export function RoadmapGenerationWatcher({ active }: { active: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (!active) return

    const interval = window.setInterval(() => router.refresh(), 2500)
    const timeout = window.setTimeout(() => window.clearInterval(interval), 120000)
    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [active, router])

  return null
}

export function RetryRoadmapButton({ roadmapId }: { roadmapId: string }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(
    retryRoadmapAction,
    initialRoadmapGenerationState,
  )

  useEffect(() => {
    if (state.kind === 'success' && state.roadmapId) {
      router.push(`/dashboard/roadmaps/${state.roadmapId}`)
    } else if (state.kind === 'pending') {
      router.refresh()
    }
  }, [router, state.kind, state.roadmapId])

  return (
    <div className="mt-2 sm:flex sm:flex-col sm:items-end">
      <form action={formAction}>
        <input name="roadmapId" type="hidden" value={roadmapId} />
        <button
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#9a3328] underline decoration-[#f0a202] decoration-2 underline-offset-4 disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <Spinner decorative size={16} />
          ) : (
            <RefreshCw aria-hidden className="h-3.5 w-3.5" />
          )}
          {pending ? 'Retrying…' : 'Retry generation'}
        </button>
      </form>
      {state.kind === 'error' ? (
        <p className="mt-1 max-w-56 text-[11px] leading-relaxed text-[#9a3328]">
          {state.message}
        </p>
      ) : null}
    </div>
  )
}
