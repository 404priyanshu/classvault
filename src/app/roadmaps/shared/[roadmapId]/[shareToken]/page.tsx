import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, LockKeyhole, Route } from 'lucide-react'
import { z } from 'zod'
import { RoadmapSections } from '@/components/roadmaps/RoadmapSections'
import { formatRoadmapStudyMode } from '@/lib/roadmaps/foundation'
import { roadmapSnapshotSchema } from '@/lib/roadmaps/snapshot'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// A share link is a capability. Keeping it out of search results does not make
// it secret — revocation does, and `set_roadmap_sharing` owns that — but an
// indexed link would outlive the owner's decision to stop sharing.
export const metadata = {
  robots: { follow: false, index: false },
  title: 'Shared study plan · ClassVault',
}

const uuidSchema = z.string().uuid()
const generatedDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export default async function SharedRoadmapPage({
  params,
}: {
  params: Promise<{ roadmapId: string; shareToken: string }>
}) {
  const { roadmapId: rawRoadmapId, shareToken: rawShareToken } = await params
  const roadmapId = uuidSchema.safeParse(rawRoadmapId)
  const shareToken = uuidSchema.safeParse(rawShareToken)
  if (!roadmapId.success || !shareToken.success) notFound()

  const supabase = await createClient()

  // One call decides everything: the token must match an unrevoked share, and
  // each phase is included only if this viewer may read its source notes. A
  // revoked link and a wrong token are indistinguishable from here — both
  // return null, and both render as not found.
  const { data, error } = await supabase.rpc('get_roadmap_snapshot', {
    p_roadmap_id: roadmapId.data,
    p_share_token: shareToken.data,
  })
  if (error || !data) notFound()

  const parsed = roadmapSnapshotSchema.safeParse(data)
  if (!parsed.success) notFound()
  const roadmap = parsed.data

  const withheldCount = roadmap.sections.filter((section) => !section.available).length

  return (
    <div className="mx-auto max-w-[1120px] space-y-6 px-4 py-8 sm:space-y-8 sm:py-12">
      <header className="rounded-3xl border border-club-line bg-club-paper p-5 [box-shadow:var(--elev-inline)] sm:p-7">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.09em] text-club-purple">
          <span>Shared plan</span>
          <span aria-hidden className="text-club-ink/25">/</span>
          <span>{formatRoadmapStudyMode(roadmap.studyMode)}</span>
        </div>
        <h1 className="app-title mt-3">{roadmap.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-club-muted">
          A source-cited roadmap for {roadmap.topic}, shared read-only by
          the student who made it.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-club-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden className="h-4 w-4 text-[#b56d00]" />
            Generated {generatedDateFormatter.format(new Date(roadmap.generatedAt))}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Route aria-hidden className="h-4 w-4 text-club-purple" />
            {roadmap.sections.length} phases
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole aria-hidden className="h-4 w-4 text-club-purple" />
            Owner&rsquo;s progress stays private
          </span>
        </div>

        {withheldCount > 0 ? (
          <p className="mt-4 rounded-2xl border border-club-line bg-white/70 px-4 py-3 text-xs leading-relaxed text-club-ink/70">
            {withheldCount === 1
              ? 'One phase is hidden because it cites a note you are not allowed to read.'
              : `${withheldCount} phases are hidden because they cite notes you are not allowed to read.`}{' '}
            Signing in with a verified campus account may reveal more.
          </p>
        ) : null}
      </header>

      <RoadmapSections
        roadmapId={roadmap.id}
        sections={roadmap.sections}
        showProgress={false}
      />

      <footer className="rounded-3xl border border-club-line bg-club-lavender p-5 text-sm sm:p-6">
        <p className="font-bold">Want plans like this from your own notes?</p>
        <p className="mt-1 text-club-muted">
          ClassVault builds study plans that cite the notes they came from.
        </p>
        <Link
          className="mt-3 inline-flex items-center gap-1.5 font-black text-club-purple underline decoration-club-yellow decoration-2 underline-offset-4"
          href="/"
        >
          See how it works
        </Link>
      </footer>
    </div>
  )
}
