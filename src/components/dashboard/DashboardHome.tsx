import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Clock3,
  FileText,
  Route,
  Search,
  ShieldCheck,
  Upload,
  UsersRound,
} from 'lucide-react'
import clubhouse from '@/assets/study-clubhouse.webp'
import { formatTimerSeconds, type StudyRoomListItem } from '@/lib/study-rooms/types'

export type DashboardNote = {
  id: string
  note_type: string
  published_at: string | null
  title: string
  visibility: string
  subjects: { code: string | null; name: string } | null
}

export type DashboardHomeProps = {
  firstName: string
  isVerified: boolean
  liveRoomCount: number
  notes: DashboardNote[]
  ownedNoteCount: number
  query: string
  roadmapCount: number
  suggestedRoom: StudyRoomListItem | null
}

function formatNoteType(value: string) {
  // PYQ is what students call it; title-casing turned it into "Pyq".
  if (value === 'pyq') return 'PYQ'

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/**
 * A note as a row of facts rather than a poster.
 *
 * The old card spent its top ninety-six pixels drawing lines that looked like a
 * page but described nothing, and stood 214px tall to do it. What a student is
 * actually scanning for is the subject, the title, and what kind of document it
 * is, so the card is now those three things and roughly half the height, which
 * is what lets a row of four fit where two used to.
 */
function NoteCard({ note }: { note: DashboardNote }) {
  return (
    <Link
      className="group flex flex-col gap-2 rounded-xl border border-club-line bg-club-paper p-4 outline-none transition hover:-translate-y-0.5 hover:border-club-purple/40 hover:[box-shadow:var(--elev-inline)] focus-visible:ring-2 focus-visible:ring-club-purple"
      href={`/dashboard/notes/${note.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-club-purple">
          {note.subjects?.code || note.subjects?.name || 'General'}
        </span>
        <span className="shrink-0 rounded-full bg-club-lavender px-2 py-0.5 text-[10px] font-bold text-club-deep">
          {note.visibility === 'university' ? 'Campus' : 'Public'}
        </span>
      </div>
      <h3 className="font-display line-clamp-2 text-[15px] font-bold leading-snug">
        {note.title}
      </h3>
      <span className="mt-auto inline-flex items-center gap-1.5 text-[11px] text-club-muted">
        <FileText className="h-3.5 w-3.5" />
        {formatNoteType(note.note_type)}
      </span>
    </Link>
  )
}

function StatPill({
  label,
  value,
}: {
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-xl bg-club-paper/70 px-3.5 py-2">
      <strong className="block text-lg font-extrabold leading-none tracking-tight">
        {value}
      </strong>
      <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.07em] text-club-muted">
        {label}
      </span>
    </div>
  )
}

function RailCard({
  accent,
  action,
  children,
  eyebrow,
  href,
  title,
}: {
  accent: string
  action: string
  children?: React.ReactNode
  eyebrow: string
  href: string
  title: string
}) {
  return (
    <section className={`rounded-2xl p-4 ${accent}`}>
      <span className="club-eyebrow text-club-deep">{eyebrow}</span>
      <h2 className="mt-1.5 text-lg font-extrabold leading-tight tracking-tight">
        {title}
      </h2>
      {children}
      <Link
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-club-deep underline decoration-club-deep/30 underline-offset-4 transition hover:decoration-club-deep"
        href={href}
      >
        {action}
        <ArrowRight size={14} />
      </Link>
    </section>
  )
}

/**
 * The clubhouse, laid out as something you work in.
 *
 * The screen used to stack full-width bands -- an illustrated hero, three large
 * action tiles, a panel, then two poster-sized panels -- so on a laptop the
 * library began below the fold and showed two notes. The greeting is now a
 * strip, the actions are a rail, and the library takes the width it needs,
 * which is what a dashboard is for: the work first, the welcome around it.
 */
export function DashboardHome({
  firstName,
  isVerified,
  liveRoomCount,
  notes,
  ownedNoteCount,
  query,
  roadmapCount,
  suggestedRoom,
}: DashboardHomeProps) {
  return (
    <div className="space-y-4">
      <section className="club-home-greet">
        <div className="min-w-0">
          <span className="club-eyebrow text-club-purple">
            Your little corner of campus
          </span>
          <h1 className="mt-1.5 text-2xl font-extrabold leading-tight tracking-[-0.03em] sm:text-[28px]">
            Hey {firstName}, let’s make a little progress.
          </h1>
          <p className="mt-1.5 text-sm text-club-muted">
            A good set of notes, a plan that feels doable, some company along
            the way.
          </p>
        </div>
        <div className="club-home-stats">
          <StatPill label="Your notes" value={ownedNoteCount} />
          <StatPill label="Roadmaps" value={roadmapCount} />
          <StatPill label="Rooms live" value={liveRoomCount} />
        </div>
        <Image
          alt="The ClassVault study crew in their book-filled clubhouse."
          className="club-home-art"
          sizes="(max-width: 1279px) 0px, 20vw"
          src={clubhouse}
        />
      </section>

      <form action="/dashboard/notes" className="relative" role="search">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-club-muted"
        />
        <input
          aria-label="Search Notes Library"
          className="app-field h-11 pl-11 pr-24 text-sm"
          defaultValue={query}
          name="q"
          placeholder="What are we studying today?"
          type="search"
        />
        <button
          className="absolute right-1.5 top-1/2 min-h-8 -translate-y-1/2 rounded-full bg-club-purple px-4 text-xs font-bold text-club-paper"
          type="submit"
        >
          Search
        </button>
      </form>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <section className="app-panel p-4 sm:p-5" id="notes">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                {query ? 'Your search results' : 'Fresh from the library'}
              </h2>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] text-club-muted">
                <ShieldCheck size={13} />
                {isVerified
                  ? 'Public notes and your verified campus collection'
                  : 'Public notes · campus access unlocks after verification'}
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-1.5 text-xs font-bold text-club-purple"
              href="/dashboard/notes"
            >
              Explore the library <ArrowRight size={14} />
            </Link>
          </div>

          {notes.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-club-lavender/60 px-6 py-8 text-center">
              <FileText
                className="mx-auto h-8 w-8 text-club-purple"
                strokeWidth={1.5}
              />
              <h3 className="mt-3 text-lg font-extrabold">
                {query
                  ? 'No matches just yet'
                  : 'A fresh shelf. A good place to start.'}
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-club-muted">
                {query
                  ? 'Try another title or browse the full library.'
                  : 'Your first shared note could make someone’s next revision session a little easier.'}
              </p>
              <Link
                className="btn-ink mt-4 inline-flex min-h-10 items-center gap-2 px-4 text-sm font-bold"
                href={query ? '/dashboard' : '/dashboard/notes/new'}
              >
                {query ? 'Clear search' : 'Share the first note'}
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </section>

        <aside className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-1">
          <nav
            className="club-home-actions md:col-span-2 xl:col-span-1"
            aria-label="Quick study actions"
          >
            <Link href="/dashboard/notes/new" data-cuelume-hover="tick">
              <Upload size={17} />
              <span>Pass the good notes</span>
              <ArrowRight size={14} className="ml-auto shrink-0" />
            </Link>
            <Link href="/dashboard/roadmaps" data-cuelume-hover="tick">
              <Route size={17} />
              <span>Make a little plan</span>
              <ArrowRight size={14} className="ml-auto shrink-0" />
            </Link>
            <Link href="/dashboard/study-rooms" data-cuelume-hover="tick">
              <UsersRound size={17} />
              <span>Find some company</span>
              <ArrowRight size={14} className="ml-auto shrink-0" />
            </Link>
          </nav>

          <RailCard
            accent="bg-club-yellow"
            action="Open your roadmaps"
            eyebrow="Small steps, less overwhelm"
            href="/dashboard/roadmaps"
            title="Big syllabus? Start with one topic."
          >
            <p className="mt-1.5 text-xs leading-relaxed text-club-muted">
              Build a roadmap from notes you can access. Each section points
              back to its sources.
            </p>
          </RailCard>

          <RailCard
            accent="bg-club-mint"
            action={
              suggestedRoom?.current_user_joined
                ? 'Back to your room'
                : 'Explore study rooms'
            }
            eyebrow="A little focus, a little company"
            href={
              suggestedRoom?.current_user_joined
                ? `/dashboard/study-rooms/${suggestedRoom.room_id}`
                : '/dashboard/study-rooms'
            }
            title={suggestedRoom?.room_name || 'Pull up a chair.'}
          >
            <p className="mt-1.5 text-xs leading-relaxed text-club-muted">
              {suggestedRoom?.subject_tag ||
                'Create a room or find a group to study with. Bring your notes; we’ll bring the shared timer.'}
            </p>
            {suggestedRoom ? (
              <div className="mt-2.5 flex flex-wrap gap-3 text-[11px] font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <UsersRound size={13} />
                  {suggestedRoom.member_count}/{suggestedRoom.member_capacity}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 size={13} />
                  {suggestedRoom.timer_phase} ·{' '}
                  {formatTimerSeconds(suggestedRoom.timer_remaining_seconds)}
                </span>
              </div>
            ) : null}
          </RailCard>
        </aside>
      </div>
    </div>
  )
}
