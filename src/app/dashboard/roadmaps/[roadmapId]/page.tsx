import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  LockKeyhole,
} from 'lucide-react'
import { z } from 'zod'
import { RoadmapSections } from '@/components/roadmaps/RoadmapSections'
import { RoadmapShareControls } from '@/components/roadmaps/RoadmapShareControls'
import { formatRoadmapStudyMode } from '@/lib/roadmaps/foundation'
import { roadmapSnapshotSchema } from '@/lib/roadmaps/snapshot'
import { getSiteUrl } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
// Roadmap generation runs inside this route's server actions and can wait on
// a model for tens of seconds.
export const maxDuration = 60

const roadmapIdSchema = z.string().uuid()
const generatedDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ roadmapId: string }>
}) {
  const { roadmapId: rawRoadmapId } = await params
  const roadmapId = roadmapIdSchema.safeParse(rawRoadmapId)
  if (!roadmapId.success) notFound()

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_roadmap_snapshot', {
    p_roadmap_id: roadmapId.data,
  })
  if (error || !data) notFound()

  const parsed = roadmapSnapshotSchema.safeParse(data)
  if (!parsed.success || !parsed.data.isOwner) notFound()
  const roadmap = parsed.data
  const tasks = roadmap.sections.flatMap((section) => section.tasks)
  const completedTasks = tasks.filter((task) => task.completed).length

  // Owner-only, and separate from the snapshot on purpose: the snapshot is the
  // same shape a share viewer receives, so the token never belongs in it.
  const { data: shareRows } = await supabase.rpc('get_roadmap_share_state', {
    p_roadmap_id: roadmapId.data,
  })
  const shareState = shareRows?.[0]
  const sharingEnabled = shareState?.sharing_enabled ?? false
  const shareUrl =
    sharingEnabled && shareState?.share_token
      ? `${getSiteUrl()}/roadmaps/shared/${roadmap.id}/${shareState.share_token}`
      : null

  return (
    <div className="mx-auto max-w-[1120px] space-y-6 sm:space-y-8">
      <Link
        className="inline-flex items-center gap-1.5 text-sm font-black text-club-purple underline decoration-club-yellow decoration-2 underline-offset-4"
        href="/dashboard/roadmaps"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        All roadmaps
      </Link>

      <header className="rounded-3xl border border-club-line bg-club-paper p-5 [box-shadow:var(--elev-inline)] sm:p-7">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.09em] text-club-purple">
          <span>{formatRoadmapStudyMode(roadmap.studyMode)}</span>
          <span aria-hidden className="text-club-ink/25">/</span>
          <span>{roadmap.generationPlan} plan snapshot</span>
        </div>
        <h1 className="app-title mt-3">
          {roadmap.title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-club-muted">
          A static, source-cited roadmap for {roadmap.topic}. Source access is
          rechecked every time this page opens.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-club-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden className="h-4 w-4 text-[#b56d00]" />
            Generated {generatedDateFormatter.format(new Date(roadmap.generatedAt))}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 aria-hidden className="h-4 w-4 text-[#2d7c58]" />
            {completedTasks} of {tasks.length} tasks complete
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole aria-hidden className="h-4 w-4 text-club-purple" />
            Private progress
          </span>
        </div>

        <RoadmapShareControls
          roadmapId={roadmap.id}
          shareUrl={shareUrl}
          sharingEnabled={sharingEnabled}
        />
      </header>

      <RoadmapSections
        roadmapId={roadmap.id}
        sections={roadmap.sections}
        showProgress
      />
    </div>
  )
}
