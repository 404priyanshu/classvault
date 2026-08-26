import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  FileWarning,
  LockKeyhole,
  Route,
} from 'lucide-react'
import { z } from 'zod'
import { RoadmapTaskToggle } from '@/components/roadmaps/RoadmapTaskToggle'
import { formatRoadmapStudyMode } from '@/lib/roadmaps/foundation'
import { roadmapSnapshotSchema } from '@/lib/roadmaps/snapshot'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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

  return (
    <div className="mx-auto max-w-[1120px] space-y-6 sm:space-y-8">
      <Link
        className="inline-flex items-center gap-1.5 text-sm font-black text-[#17453a] underline decoration-[#f0a202] decoration-2 underline-offset-4"
        href="/dashboard/roadmaps"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        All roadmaps
      </Link>

      <header className="border border-[#171512] bg-[#fffdf6] p-5 [box-shadow:var(--elev-inline)] sm:p-7">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.09em] text-[#17453a]">
          <span>{formatRoadmapStudyMode(roadmap.studyMode)}</span>
          <span aria-hidden className="text-[#171512]/25">/</span>
          <span>{roadmap.generationPlan} plan snapshot</span>
        </div>
        <h1 className="app-title mt-3">
          {roadmap.title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[#171512]/60">
          A static, source-cited roadmap for {roadmap.topic}. Source access is
          rechecked every time this page opens.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-[#171512]/60">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden className="h-4 w-4 text-[#b56d00]" />
            Generated {generatedDateFormatter.format(new Date(roadmap.generatedAt))}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 aria-hidden className="h-4 w-4 text-[#2d7c58]" />
            {completedTasks} of {tasks.length} tasks complete
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole aria-hidden className="h-4 w-4 text-[#17453a]" />
            Private progress
          </span>
        </div>
      </header>

      <div className="space-y-5">
        {roadmap.sections.map((section) =>
          section.available ? (
            <section
              className="border border-[#cfc4ae] bg-[#fffdf6] [box-shadow:var(--elev-inline)]"
              key={section.id}
            >
              <div className="border-b border-[#d9cfbc] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.09em] text-[#b56d00]">
                    <Route aria-hidden className="h-4 w-4" />
                    Phase {section.position}
                  </span>
                  <span className="border border-[#bfb39d] bg-[#f8f2e5] px-2.5 py-1 text-[11px] font-black">
                    {section.timeframe}
                  </span>
                </div>
                <h2 className="font-display mt-3 text-2xl font-black sm:text-3xl">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#171512]/65">
                  {section.summary}
                </p>
              </div>

              <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="p-5 sm:p-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.08em]">
                    Tasks
                  </h3>
                  <ul className="mt-3 space-y-3">
                    {section.tasks.map((task) => (
                      <li className="flex items-start gap-3" key={task.id}>
                        <RoadmapTaskToggle
                          completed={Boolean(task.completed)}
                          roadmapId={roadmap.id}
                          taskId={task.id}
                        />
                        <span
                          className={`pt-1 text-sm leading-relaxed ${task.completed ? 'text-[#171512]/45 line-through' : 'text-[#171512]/80'}`}
                        >
                          {task.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <aside className="border-t border-[#d9cfbc] bg-[#f8f2e5] p-5 lg:border-l lg:border-t-0">
                  <h3 className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.08em]">
                    <BookOpenCheck aria-hidden className="h-4 w-4 text-[#17453a]" />
                    Cited sources
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {section.sources.map((source, sourceIndex) => (
                      <li className="text-xs leading-relaxed" key={`${section.id}-${source.noteId || sourceIndex}`}>
                        {source.linkAvailable && source.noteId ? (
                          <Link
                            className="font-bold text-[#17453a] underline decoration-[#f0a202] decoration-2 underline-offset-2"
                            href={`/dashboard/notes/${source.noteId}`}
                          >
                            {source.title}
                          </Link>
                        ) : (
                          <span className="font-bold text-[#171512]/45">
                            {source.title} · unavailable
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>
            </section>
          ) : (
            <section
              className="border border-dashed border-[#9a3328]/50 bg-[#fff2ef] p-6"
              key={section.id}
            >
              <FileWarning aria-hidden className="h-6 w-6 text-[#9a3328]" />
              <h2 className="font-display mt-3 text-2xl font-black">
                Phase {section.position} is unavailable
              </h2>
              <p className="mt-2 text-sm text-[#171512]/60">
                At least one cited source is no longer authorized, so the entire
                derived section has been withheld.
              </p>
            </section>
          ),
        )}
      </div>
    </div>
  )
}
