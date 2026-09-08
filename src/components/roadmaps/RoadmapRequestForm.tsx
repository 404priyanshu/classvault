'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpenCheck, Route, Sparkles } from 'lucide-react'
import { createRoadmapAction } from '@/app/dashboard/roadmaps/actions'
import { Spinner } from '@/components/ui/spinner'
import { initialRoadmapGenerationState } from '@/lib/roadmaps/action-state'

type RoadmapRequestFormProps = {
  sourceCount: number
  workerConfigured: boolean
}

export function RoadmapRequestForm({
  sourceCount,
  workerConfigured,
}: RoadmapRequestFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(
    createRoadmapAction,
    initialRoadmapGenerationState,
  )
  const canGenerate = workerConfigured && sourceCount > 0

  useEffect(() => {
    if (state.kind === 'success' && state.roadmapId) {
      router.push(`/dashboard/roadmaps/${state.roadmapId}`)
    }
  }, [router, state.kind, state.roadmapId])

  return (
    <section
      aria-labelledby="roadmap-request-heading"
      className="app-panel overflow-hidden"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_290px]">
        <form action={formAction} className="p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-club-ink bg-club-yellow [box-shadow:var(--elev-inline)]">
              <Sparkles aria-hidden className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#b56d00]">
                A little direction
              </p>
              <h2
                className="font-display mt-1 text-2xl font-black sm:text-3xl"
                id="roadmap-request-heading"
              >
                Make your next study plan
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-club-muted">
                Start with a topic and a study style. We’ll build a structured plan from the notes available to you.
              </p>
            </div>
          </div>

          <label className="mt-6 block text-xs font-black uppercase tracking-[0.08em]" htmlFor="roadmap-topic">
            What are you studying?
          </label>
          <input
            className="app-field mt-2 min-h-12 bg-white px-4 text-base font-bold outline-none transition-shadow placeholder:text-club-ink/35 "
            disabled={pending}
            id="roadmap-topic"
            maxLength={160}
            minLength={3}
            name="topic"
            placeholder="e.g. Operating Systems final exam"
            required
          />

          <fieldset className="mt-5">
            <legend className="text-xs font-black uppercase tracking-[0.08em]">
              Study mode
            </legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="cursor-pointer rounded-2xl border border-club-line bg-club-lavender p-4 has-[:checked]:border-club-ink has-[:checked]:bg-club-yellow has-[:checked]:[box-shadow:var(--elev-inline)]">
                <input
                  className="mr-2 accent-club-purple"
                  defaultChecked
                  disabled={pending}
                  name="studyMode"
                  type="radio"
                  value="exam"
                />
                <span className="text-sm font-black">Exam revision</span>
                <span className="mt-1 block pl-6 text-xs leading-relaxed text-club-muted">
                  Recall questions, timed practice, and a final review sheet.
                </span>
              </label>
              <label className="cursor-pointer rounded-2xl border border-club-line bg-club-lavender p-4 has-[:checked]:border-club-ink has-[:checked]:bg-club-mint has-[:checked]:[box-shadow:var(--elev-inline)]">
                <input
                  className="mr-2 accent-club-purple"
                  disabled={pending}
                  name="studyMode"
                  type="radio"
                  value="indepth"
                />
                <span className="text-sm font-black">In-depth study</span>
                <span className="mt-1 block pl-6 text-xs leading-relaxed text-club-muted">
                  Concept mapping, explanation, practice, and consolidation.
                </span>
              </label>
            </div>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-club-purple bg-club-purple px-5 text-sm font-black text-club-paper [box-shadow:var(--elev-inline)] transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canGenerate || pending}
              type="submit"
            >
              {pending ? (
                <Spinner decorative size={20} />
              ) : (
                <Route aria-hidden className="h-4 w-4" />
              )}
              {pending ? 'Building roadmap…' : 'Generate roadmap'}
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-club-purple">
              <BookOpenCheck aria-hidden className="h-4 w-4" />
              {sourceCount} available source{sourceCount === 1 ? '' : 's'}
            </span>
          </div>

          {!workerConfigured ? (
            <p className="mt-4 border border-[#b56d00]/50 bg-club-yellow p-3 text-xs font-bold text-[#704500]">
              Roadmap generation is unavailable right now. Please try again later.
            </p>
          ) : sourceCount === 0 ? (
            <p className="mt-4 border border-[#b56d00]/50 bg-club-yellow p-3 text-xs font-bold text-[#704500]">
              Publish at least one eligible note before generating a roadmap.
            </p>
          ) : null}

          {state.message ? (
            <p
              aria-live="polite"
              className={`mt-4 text-sm font-bold ${state.kind === 'error' ? 'text-[#9a3328]' : 'text-club-purple'}`}
            >
              {state.message}
            </p>
          ) : null}
        </form>

        <aside className="border-t border-club-ink bg-club-purple p-5 text-club-paper lg:border-l lg:border-t-0 lg:p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#f7c65d]">
            Made for steady progress
          </p>
          <h3 className="font-display mt-2 text-2xl font-black">A plan you can trace</h3>
          <p className="mt-3 text-sm leading-relaxed text-white/85">
            Each plan uses a structured template and cites your source notes. AI generation is coming later; you can start studying with this version today.
          </p>
          <ul className="mt-5 space-y-3 text-xs font-bold text-white/85">
            <li>✓ All eligible sources are cited</li>
            <li>✓ Check off tasks as you go</li>
            <li>✓ Your progress stays private</li>
            <li>✓ Pick up where you left off</li>
          </ul>
        </aside>
      </div>
    </section>
  )
}
