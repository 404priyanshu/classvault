import Link from 'next/link'
import { BookOpenCheck, Circle, FileWarning, Route } from 'lucide-react'
import { RoadmapTaskToggle } from '@/components/roadmaps/RoadmapTaskToggle'
import type { RoadmapSnapshot } from '@/lib/roadmaps/snapshot'

/**
 * The phase list, rendered identically for the owner and for anyone holding a
 * share link.
 *
 * Only one thing differs: the owner gets the progress toggle. Everything else —
 * which phases are visible, whether a cited note is linkable — is already
 * decided by `get_roadmap_snapshot` for the caller, so this component never
 * makes an access decision of its own. A withheld phase arrives as
 * `available: false` with its title and tasks already stripped.
 */
export function RoadmapSections({
  roadmapId,
  sections,
  showProgress,
}: {
  roadmapId: string
  sections: RoadmapSnapshot['sections']
  showProgress: boolean
}) {
  return (
    <div className="space-y-5">
      {sections.map((section) =>
        section.available ? (
          <section
            className="border border-club-line bg-club-paper [box-shadow:var(--elev-inline)]"
            key={section.id}
          >
            <div className="border-b border-club-line p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.09em] text-[#b56d00]">
                  <Route aria-hidden className="h-4 w-4" />
                  Phase {section.position}
                </span>
                <span className="rounded-full border border-club-line bg-club-lavender px-2.5 py-1 text-[11px] font-black">
                  {section.timeframe}
                </span>
              </div>
              <h2 className="font-display mt-3 text-2xl font-black sm:text-3xl">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-club-muted">
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
                      {showProgress ? (
                        <RoadmapTaskToggle
                          completed={Boolean(task.completed)}
                          roadmapId={roadmapId}
                          taskId={task.id}
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-club-line bg-white"
                        >
                          <Circle className="h-3.5 w-3.5 text-club-ink/25" />
                        </span>
                      )}
                      <span
                        className={`pt-1 text-sm leading-relaxed ${task.completed ? 'text-club-muted line-through' : 'text-club-ink/80'}`}
                      >
                        {task.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <aside className="border-t border-club-line bg-club-lavender p-5 lg:border-l lg:border-t-0">
                <h3 className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.08em]">
                  <BookOpenCheck aria-hidden className="h-4 w-4 text-club-purple" />
                  Cited sources
                </h3>
                <ul className="mt-3 space-y-2">
                  {section.sources.map((source, sourceIndex) => (
                    <li
                      className="text-xs leading-relaxed"
                      key={`${section.id}-${source.noteId || sourceIndex}`}
                    >
                      {source.linkAvailable && source.noteId ? (
                        <Link
                          className="font-bold text-club-purple underline decoration-club-yellow decoration-2 underline-offset-2"
                          href={`/dashboard/notes/${source.noteId}`}
                        >
                          {source.title}
                        </Link>
                      ) : (
                        <span className="font-bold text-club-muted">
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
            <p className="mt-2 text-sm text-club-muted">
              At least one cited source is no longer authorized, so the entire
              derived section has been withheld.
            </p>
          </section>
        ),
      )}
    </div>
  )
}
