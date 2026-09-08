import Link from 'next/link'
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  FileText,
  Route,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { RoadmapRequestForm } from '@/components/roadmaps/RoadmapRequestForm'
import {
  RetryRoadmapButton,
  RoadmapGenerationWatcher,
} from '@/components/roadmaps/RoadmapStatusControls'
import {
  formatRoadmapStatus,
  formatRoadmapStudyMode,
  type OwnedRoadmapSummary,
  type RoadmapSourceEligibility,
} from '@/lib/roadmaps/foundation'
import { isRoadmapWorkerConfigured } from '@/lib/roadmaps/worker'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function RoadmapRow({ roadmap }: { roadmap: OwnedRoadmapSummary }) {
  const progress = roadmap.total_task_count
    ? Math.round((roadmap.completed_task_count / roadmap.total_task_count) * 100)
    : 0

  return (
    <article className="grid gap-4 border-b border-club-line px-4 py-5 last:border-b-0 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-center sm:px-5">
      <span className="grid h-14 w-14 place-items-center rounded-full border border-club-ink bg-club-yellow text-club-ink [box-shadow:var(--elev-inline)]">
        <Route aria-hidden className="h-6 w-6" strokeWidth={1.6} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-black uppercase tracking-[0.08em] text-club-purple">
          <span>{formatRoadmapStudyMode(roadmap.study_mode)}</span>
          <span aria-hidden className="text-club-ink/25">/</span>
          <span className="text-club-muted">{formatRoadmapStatus(roadmap.status)}</span>
        </div>
        {roadmap.status === 'ready' ? (
          <Link
            className="font-display mt-1 block text-xl font-black underline decoration-club-yellow decoration-2 underline-offset-4"
            href={`/dashboard/roadmaps/${roadmap.roadmap_id}`}
          >
            {roadmap.title}
          </Link>
        ) : (
          <h2 className="font-display mt-1 text-xl font-black">{roadmap.title}</h2>
        )}
        <p className="mt-2 text-xs text-club-muted">
          {roadmap.source_count} sources · {roadmap.section_count} sections · created{' '}
          {dateFormatter.format(new Date(roadmap.created_at))}
        </p>
      </div>
      <div className="min-w-28 text-left sm:text-right">
        <p className="text-xs font-black text-club-purple">{progress}% complete</p>
        <p className="mt-1 text-[11px] text-club-muted">
          {roadmap.sharing_enabled ? 'Sharing enabled' : 'Private'}
        </p>
        {roadmap.status === 'failed' || roadmap.status === 'draft' ? (
          <RetryRoadmapButton roadmapId={roadmap.roadmap_id} />
        ) : null}
      </div>
    </article>
  )
}

export default async function RoadmapsPage() {
  const supabase = await createClient()
  const [eligibilityResult, roadmapsResult] = await Promise.all([
    supabase.rpc('preview_roadmap_source_eligibility'),
    supabase.rpc('list_owned_roadmaps'),
  ])

  if (eligibilityResult.error || roadmapsResult.error) {
    throw new Error('Your roadmap workspace could not be loaded.')
  }

  const eligibility = eligibilityResult.data?.[0] as
    | RoadmapSourceEligibility
    | undefined
  const roadmaps = (roadmapsResult.data || []) as OwnedRoadmapSummary[]
  const hasActiveGeneration = roadmaps.some(
    (roadmap) => roadmap.status === 'generating',
  )
  const workerConfigured = isRoadmapWorkerConfigured()

  return (
    <div className="mx-auto max-w-[1320px] space-y-7 sm:space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-club-line bg-club-paper p-5 [box-shadow:var(--elev-inline)] sm:p-7 lg:p-8">
        <div className="relative z-10 max-w-3xl">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#b56d00]">
            <Sparkles aria-hidden className="h-4 w-4" />
            One topic at a time
          </p>
          <h1 className="app-title mt-3">
            Study roadmaps
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-club-muted sm:text-base">
            Turn the notes you can access into a plan you can actually follow.
            Take it one section at a time, follow the sources, and keep your
            progress private.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-club-purple bg-club-purple px-4 text-sm font-black text-club-paper [box-shadow:var(--elev-inline)] transition-transform hover:-translate-y-0.5"
              href="#generate-roadmap"
            >
              <Sparkles aria-hidden className="h-4 w-4" />
              Build a roadmap
            </Link>
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-club-line bg-club-lavender px-4 text-sm font-bold text-club-muted"
              href="/dashboard/notes"
            >
              <FileText aria-hidden className="h-4 w-4" />
              Review eligible notes
            </Link>
          </div>
        </div>
      </section>

      <div id="generate-roadmap">
        <RoadmapRequestForm
          sourceCount={Number(eligibility?.total_eligible_count || 0)}
          workerConfigured={workerConfigured}
        />
      </div>

      <section aria-labelledby="source-boundary-heading">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-black" id="source-boundary-heading">
              Your starting material
            </h2>
            <p className="mt-1 text-xs text-club-muted">
              We’ll select from the notes you can open. Your campus access determines what’s available.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.08em] text-club-purple">
            <ShieldCheck aria-hidden className="h-4 w-4" />
            {eligibility?.generation_plan || 'free'} plan
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-club-line bg-club-paper p-5">
            <BookOpenCheck aria-hidden className="h-5 w-5 text-club-purple" />
            <p className="font-display mt-4 text-3xl font-black">
              {Number(eligibility?.personal_count || 0)}
            </p>
            <h3 className="mt-1 text-sm font-black">Personal uploads</h3>
            <p className="mt-2 text-xs leading-relaxed text-club-muted">
              Includes your active old-campus uploads even after a membership change.
            </p>
          </article>
          <article className="rounded-3xl border border-club-line bg-club-paper p-5">
            <FileText aria-hidden className="h-5 w-5 text-club-purple" />
            <p className="font-display mt-4 text-3xl font-black">
              {Number(eligibility?.public_count || 0)}
            </p>
            <h3 className="mt-1 text-sm font-black">Public notes</h3>
            <p className="mt-2 text-xs leading-relaxed text-club-muted">
              Accessible published notes available to every eligible student.
            </p>
          </article>
          <article className="rounded-3xl border border-club-line bg-club-paper p-5">
            <UsersRound aria-hidden className="h-5 w-5 text-[#b56d00]" />
            <p className="font-display mt-4 text-3xl font-black">
              {Number(eligibility?.eligible_university_count || 0)}
            </p>
            <h3 className="mt-1 text-sm font-black">Campus sources now</h3>
            <p className="mt-2 text-xs leading-relaxed text-club-muted">
              Free roadmaps do not use other students&apos; campus-only notes.
            </p>
          </article>
          <article className="rounded-3xl border border-dashed border-[#b56d00]/60 bg-club-yellow p-5">
            <Sparkles aria-hidden className="h-5 w-5 text-[#b56d00]" />
            <p className="font-display mt-4 text-3xl font-black">
              {Number(eligibility?.pro_university_count || 0)}
            </p>
            <h3 className="mt-1 text-sm font-black">Pro-ready campus pool</h3>
            <p className="mt-2 text-xs leading-relaxed text-club-muted">
              Campus sources for a future Pro plan. Upgrades aren’t available yet.
            </p>
          </article>
        </div>
      </section>

      <section aria-labelledby="saved-roadmaps-heading">
        <div className="mb-3">
          <h2 className="font-display text-2xl font-black" id="saved-roadmaps-heading">
            Saved roadmaps
          </h2>
          <p className="mt-1 text-xs text-club-muted">
            Your saved plans, source notes, and progress—all in one place.
          </p>
        </div>
        <div className="rounded-3xl overflow-hidden border border-club-line bg-club-paper [box-shadow:var(--elev-inline)]">
          {roadmaps.length ? (
            roadmaps.map((roadmap) => <RoadmapRow key={roadmap.roadmap_id} roadmap={roadmap} />)
          ) : (
            <div className="grid min-h-[300px] place-items-center px-6 py-12 text-center">
              <div className="max-w-md">
                <CheckCircle2 aria-hidden className="mx-auto h-11 w-11 text-[#2d7c58]" strokeWidth={1.4} />
                <h3 className="font-display mt-4 text-2xl font-black">Ready for your first roadmap</h3>
                <p className="mt-2 text-sm leading-relaxed text-club-muted">
                  Make a plan above, then come back here whenever you’re ready for your next study session.
                </p>
                <Link className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-club-purple underline decoration-club-yellow decoration-2 underline-offset-4" href="#generate-roadmap">
                  Build your roadmap <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
      <RoadmapGenerationWatcher active={hasActiveGeneration} />
    </div>
  )
}
