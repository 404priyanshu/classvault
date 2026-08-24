'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpenCheck, Route, Sparkles } from 'lucide-react'
import {
  createRoadmapAction,
  initialRoadmapGenerationState,
} from '@/app/dashboard/roadmaps/actions'
import { Spinner } from '@/components/ui/spinner'

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
      className="border border-[#171512] bg-[#fffdf6] shadow-[4px_4px_0_#171512]"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_290px]">
        <form action={formAction} className="p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#171512] bg-[#f0a202] shadow-[2px_2px_0_#171512]">
              <Sparkles aria-hidden className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#b56d00]">
                Deterministic generator v1
              </p>
              <h2
                className="font-display mt-1 text-2xl font-black sm:text-3xl"
                id="roadmap-request-heading"
              >
                Build a grounded roadmap
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#171512]/60">
                ClassVault snapshots every note your current plan permits. The
                browser cannot choose or replace the source set.
              </p>
            </div>
          </div>

          <label className="mt-6 block text-xs font-black uppercase tracking-[0.08em]" htmlFor="roadmap-topic">
            What are you studying?
          </label>
          <input
            className="mt-2 min-h-12 w-full border border-[#171512] bg-white px-4 text-base font-bold outline-none transition-shadow placeholder:text-[#171512]/35 focus:shadow-[3px_3px_0_#f0a202]"
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
              <label className="cursor-pointer border border-[#cfc4ae] bg-[#f8f2e5] p-4 has-[:checked]:border-[#171512] has-[:checked]:bg-[#fff2bd] has-[:checked]:shadow-[3px_3px_0_#171512]">
                <input
                  className="mr-2 accent-[#17453a]"
                  defaultChecked
                  disabled={pending}
                  name="studyMode"
                  type="radio"
                  value="exam"
                />
                <span className="text-sm font-black">Exam revision</span>
                <span className="mt-1 block pl-6 text-xs leading-relaxed text-[#171512]/55">
                  Recall questions, timed practice, and a final review sheet.
                </span>
              </label>
              <label className="cursor-pointer border border-[#cfc4ae] bg-[#f8f2e5] p-4 has-[:checked]:border-[#171512] has-[:checked]:bg-[#e9f3ea] has-[:checked]:shadow-[3px_3px_0_#171512]">
                <input
                  className="mr-2 accent-[#17453a]"
                  disabled={pending}
                  name="studyMode"
                  type="radio"
                  value="indepth"
                />
                <span className="text-sm font-black">In-depth study</span>
                <span className="mt-1 block pl-6 text-xs leading-relaxed text-[#171512]/55">
                  Concept mapping, explanation, practice, and consolidation.
                </span>
              </label>
            </div>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              className="inline-flex min-h-12 items-center gap-2 border border-[#171512] bg-[#17453a] px-5 text-sm font-black text-[#fffdf6] shadow-[3px_3px_0_#171512] transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
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
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#17453a]">
              <BookOpenCheck aria-hidden className="h-4 w-4" />
              {sourceCount} server-selected source{sourceCount === 1 ? '' : 's'}
            </span>
          </div>

          {!workerConfigured ? (
            <p className="mt-4 border border-[#b56d00]/50 bg-[#fff7dc] p-3 text-xs font-bold text-[#704500]">
              Add the server-only Supabase service-role key to enable generation.
            </p>
          ) : sourceCount === 0 ? (
            <p className="mt-4 border border-[#b56d00]/50 bg-[#fff7dc] p-3 text-xs font-bold text-[#704500]">
              Publish at least one eligible note before generating a roadmap.
            </p>
          ) : null}

          {state.message ? (
            <p
              aria-live="polite"
              className={`mt-4 text-sm font-bold ${state.kind === 'error' ? 'text-[#9a3328]' : 'text-[#17453a]'}`}
            >
              {state.message}
            </p>
          ) : null}
        </form>

        <aside className="border-t border-[#171512] bg-[#17453a] p-5 text-[#fffdf6] lg:border-l lg:border-t-0 lg:p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#f7c65d]">
            Current generator
          </p>
          <h3 className="font-display mt-2 text-2xl font-black">Safe before smart</h3>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            This first provider is deterministic, not AI. It proves the complete
            request, grounding, validation, save, recovery, and authorization
            path before a model vendor is connected.
          </p>
          <ul className="mt-5 space-y-3 text-xs font-bold text-white/85">
            <li>✓ All eligible sources are cited</li>
            <li>✓ Output is schema validated</li>
            <li>✓ Private excerpts stay server-side</li>
            <li>✓ Failed jobs can be retried</li>
          </ul>
        </aside>
      </div>
    </section>
  )
}
