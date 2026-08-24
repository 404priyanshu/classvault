import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  FileText,
  LockKeyhole,
  Route,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import spotRoadmap from '@/assets/spot-roadmap.webp'
import {
  formatRoadmapStatus,
  formatRoadmapStudyMode,
  type OwnedRoadmapSummary,
  type RoadmapSourceEligibility,
} from '@/lib/roadmaps/foundation'
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
    <article className="grid gap-4 border-b border-[#d9cfbc] px-4 py-5 last:border-b-0 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-center sm:px-5">
      <span className="grid h-14 w-14 place-items-center rounded-full border border-[#171512] bg-[#f0a202] text-[#171512] shadow-[2px_2px_0_#171512]">
        <Route aria-hidden className="h-6 w-6" strokeWidth={1.6} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#17453a]">
          <span>{formatRoadmapStudyMode(roadmap.study_mode)}</span>
          <span aria-hidden className="text-[#171512]/25">/</span>
          <span className="text-[#171512]/55">{formatRoadmapStatus(roadmap.status)}</span>
        </div>
        <h2 className="font-display mt-1 text-xl font-black">{roadmap.title}</h2>
        <p className="mt-2 text-xs text-[#171512]/55">
          {roadmap.source_count} sources · {roadmap.section_count} sections · created{' '}
          {dateFormatter.format(new Date(roadmap.created_at))}
        </p>
      </div>
      <div className="min-w-28 text-left sm:text-right">
        <p className="text-xs font-black text-[#17453a]">{progress}% complete</p>
        <p className="mt-1 text-[11px] text-[#171512]/45">
          {roadmap.sharing_enabled ? 'Sharing enabled' : 'Private'}
        </p>
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

  return (
    <div className="mx-auto max-w-[1320px] space-y-7 sm:space-y-8">
      <section className="relative overflow-hidden border border-[#cfc4ae] bg-[#fffdf6] p-5 shadow-[4px_4px_0_rgba(23,21,18,0.09)] sm:p-7 lg:p-8">
        <div className="relative z-10 max-w-3xl">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#b56d00]">
            <Sparkles aria-hidden className="h-4 w-4" />
            Authorization foundation ready
          </p>
          <h1 className="font-display mt-3 text-4xl font-black leading-none sm:text-5xl">
            Study roadmaps
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#171512]/65 sm:text-base">
            ClassVault can now snapshot only the notes your plan allows, preserve
            private progress, and hide source-derived sections whenever a viewer
            loses access. The AI generation worker is the next integration step.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-11 items-center gap-2 border border-[#171512] bg-[#17453a] px-4 text-sm font-black text-[#fffdf6] shadow-[3px_3px_0_#171512] transition-transform hover:-translate-y-0.5"
              href="/dashboard/notes"
            >
              <FileText aria-hidden className="h-4 w-4" />
              Review eligible notes
            </Link>
            <span className="inline-flex min-h-11 items-center gap-2 border border-[#bfb39d] bg-[#f8f2e5] px-4 text-sm font-bold text-[#171512]/55">
              <LockKeyhole aria-hidden className="h-4 w-4" />
              Generation not connected yet
            </span>
          </div>
        </div>
        <Image
          alt="Illustrated roadmap with checkpoint flags"
          className="absolute -bottom-8 -right-8 hidden h-auto w-[260px] rotate-3 object-contain opacity-90 lg:block"
          src={spotRoadmap}
        />
      </section>

      <section aria-labelledby="source-boundary-heading">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-black" id="source-boundary-heading">
              Current source boundary
            </h2>
            <p className="mt-1 text-xs text-[#171512]/55">
              Automatically derived by the database — there is no browser-supplied source picker.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.08em] text-[#17453a]">
            <ShieldCheck aria-hidden className="h-4 w-4" />
            {eligibility?.generation_plan || 'free'} plan
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="border border-[#cfc4ae] bg-[#fffdf6] p-5">
            <BookOpenCheck aria-hidden className="h-5 w-5 text-[#17453a]" />
            <p className="font-display mt-4 text-3xl font-black">
              {Number(eligibility?.personal_count || 0)}
            </p>
            <h3 className="mt-1 text-sm font-black">Personal uploads</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#171512]/55">
              Includes your active old-campus uploads even after a membership change.
            </p>
          </article>
          <article className="border border-[#cfc4ae] bg-[#fffdf6] p-5">
            <FileText aria-hidden className="h-5 w-5 text-[#17453a]" />
            <p className="font-display mt-4 text-3xl font-black">
              {Number(eligibility?.public_count || 0)}
            </p>
            <h3 className="mt-1 text-sm font-black">Public notes</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#171512]/55">
              Accessible published notes available to every eligible student.
            </p>
          </article>
          <article className="border border-[#cfc4ae] bg-[#fffdf6] p-5">
            <UsersRound aria-hidden className="h-5 w-5 text-[#b56d00]" />
            <p className="font-display mt-4 text-3xl font-black">
              {Number(eligibility?.eligible_university_count || 0)}
            </p>
            <h3 className="mt-1 text-sm font-black">Campus sources now</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#171512]/55">
              Free roadmaps do not use other students&apos; campus-only notes.
            </p>
          </article>
          <article className="border border-dashed border-[#b56d00]/60 bg-[#fff7dc] p-5">
            <Sparkles aria-hidden className="h-5 w-5 text-[#b56d00]" />
            <p className="font-display mt-4 text-3xl font-black">
              {Number(eligibility?.pro_university_count || 0)}
            </p>
            <h3 className="mt-1 text-sm font-black">Pro-ready campus pool</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#171512]/55">
              The entitlement hook exists, but billing is not connected.
            </p>
          </article>
        </div>
      </section>

      <section aria-labelledby="saved-roadmaps-heading">
        <div className="mb-3">
          <h2 className="font-display text-2xl font-black" id="saved-roadmaps-heading">
            Saved roadmaps
          </h2>
          <p className="mt-1 text-xs text-[#171512]/55">
            Static snapshots stay stable while source authorization is rechecked at every view.
          </p>
        </div>
        <div className="overflow-hidden border border-[#cfc4ae] bg-[#fffdf6] shadow-[3px_3px_0_rgba(23,21,18,0.08)]">
          {roadmaps.length ? (
            roadmaps.map((roadmap) => <RoadmapRow key={roadmap.roadmap_id} roadmap={roadmap} />)
          ) : (
            <div className="bg-ruled grid min-h-[300px] place-items-center px-6 py-12 text-center">
              <div className="max-w-md">
                <CheckCircle2 aria-hidden className="mx-auto h-11 w-11 text-[#2d7c58]" strokeWidth={1.4} />
                <h3 className="font-display mt-4 text-2xl font-black">Foundation is ready</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#171512]/60">
                  No real roadmap has been generated yet. The next worker can create a server-owned source snapshot and save cited sections here.
                </p>
                <Link className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-[#17453a] underline decoration-[#f0a202] decoration-2 underline-offset-4" href="/#roadmap">
                  Open the sample demo <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
