import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  UsersRound,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import spotNote from '@/assets/spot-note.webp'
import spotPomodoro from '@/assets/spot-pomodoro.webp'
import { AuthMessage } from '@/components/auth/AuthMessage'
import {
  formatTimerSeconds,
  type StudyRoomListItem,
} from '@/lib/study-rooms/types'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type DashboardPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>
}

type RecentNote = {
  id: string
  note_type: string
  published_at: string | null
  title: string
  visibility: string
  subjects: { code: string | null; name: string } | null
}

function formatNoteType(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function NoteCard({ note }: { note: RecentNote }) {
  return (
    <Link
      className="group flex min-h-[214px] flex-col border border-[#cfc4ae] bg-[#fffdf6] outline-none transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_rgba(23,21,18,0.13)] focus-visible:ring-2 focus-visible:ring-[#17453a]"
      href={`/dashboard/notes/${note.id}`}
    >
      <div className="bg-ruled relative h-24 overflow-hidden border-b border-[#d9cfbc] bg-[#f2ecde] p-4">
        <div className="absolute left-4 top-4 h-2 w-16 rounded-full bg-[#17453a]/15" />
        <div className="absolute left-4 top-9 h-1.5 w-3/4 rounded-full bg-[#171512]/10" />
        <div className="absolute left-4 top-14 h-1.5 w-1/2 rounded-full bg-[#171512]/10" />
        <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-[#17453a] text-[#fffdf6]">
          <ShieldCheck className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#17453a]">
          {note.subjects?.code || note.subjects?.name || 'General notes'}
        </p>
        <h3 className="font-display mt-1 line-clamp-2 text-lg font-bold leading-tight">
          {note.title}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[11px] text-[#171512]/60">
          <span>{formatNoteType(note.note_type)}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-[#17453a]">
            {note.visibility === 'university' ? 'Campus' : 'Public'}
            <CheckCircle2 className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { q = '', status } = await searchParams
  const query = q.trim().slice(0, 80)
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) {
    redirect('/auth/sign-in?next=/dashboard')
  }

  const [profileResult, membershipResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, onboarding_completed_at')
      .eq('id', claims.sub)
      .maybeSingle(),
    supabase
      .from('university_memberships')
      .select('status')
      .eq('user_id', claims.sub)
      .maybeSingle(),
  ])

  const profile = profileResult.data

  if (!profile?.onboarding_completed_at) {
    redirect('/onboarding')
  }

  let notesQuery = supabase
    .from('notes')
    .select('id, title, note_type, published_at, visibility, subjects(code, name)')
    .eq('publication_status', 'published')
    .eq('moderation_status', 'clear')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(4)

  if (query) {
    notesQuery = notesQuery.ilike('title', `%${query}%`)
  }

  const [{ data: recentNotes }, { data: roomRows }] = await Promise.all([
    notesQuery,
    supabase.rpc('list_study_rooms'),
  ])
  const email =
    typeof claims.email === 'string' && claims.email ? claims.email : null
  const phone =
    typeof claims.phone === 'string' && claims.phone ? claims.phone : null
  const displayName =
    profile.display_name || (email ? email.split('@')[0] : phone || 'Student')
  const firstName = displayName.split(/\s+/)[0]
  const notes = (recentNotes || []) as RecentNote[]
  const suggestedRoom = ((roomRows || []) as StudyRoomListItem[])[0] || null

  return (
    <div className="space-y-6 sm:space-y-8">
      <AuthMessage status={status} />

      <section className="grid items-end gap-5 xl:grid-cols-[minmax(520px,0.92fr)_minmax(420px,1.08fr)]">
        <div>
          <h1 className="font-display text-4xl font-black leading-[1.05] sm:text-5xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 text-sm text-[#171512]/60 sm:text-base">
            Your notes-first workspace is ready. Let&apos;s keep the momentum going.
          </p>
        </div>

        <form action="/dashboard/notes" className="relative" role="search">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#171512]/60"
            strokeWidth={1.8}
          />
          <input
            aria-label="Search Notes Library"
            className="h-14 w-full rounded-md border border-[#bfb39d] bg-[#fffdf6] pl-12 pr-24 text-sm outline-none transition-shadow placeholder:text-[#171512]/40 focus:border-[#17453a] focus:shadow-[3px_3px_0_rgba(23,69,58,0.22)]"
            defaultValue={query}
            name="q"
            placeholder="Search notes by title…"
            type="search"
          />
          <button
            className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 rounded-sm bg-[#17453a] px-4 text-xs font-bold text-[#fffdf6] transition-colors hover:bg-[#12372f]"
            type="submit"
          >
            Search
          </button>
        </form>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(310px,0.72fr)_minmax(0,1.28fr)]">
        <article className="relative overflow-hidden rounded-md border border-[#cfc4ae] bg-[#fffdf6] p-5 sm:p-6">
          <div className="relative z-10 max-w-[62%] sm:max-w-[58%] xl:max-w-[64%]">
            <h2 className="font-display text-2xl font-black leading-tight sm:text-3xl">
              Continue building your vault
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#171512]/60">
              Your campus archive starts here. Publish a useful PDF or scan and
              make the next revision session easier.
            </p>
            <Link
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-sm bg-[#17453a] px-4 text-sm font-bold text-[#fffdf6] shadow-[3px_3px_0_#171512] transition-transform hover:-translate-y-0.5"
              href="/dashboard/notes/new"
            >
              <Upload className="h-4 w-4" />
              Upload notes
            </Link>
          </div>
          <Image
            alt="Illustrated stack of trusted study notes"
            className="absolute -bottom-5 -right-8 h-auto w-[48%] max-w-[220px] rotate-[-4deg] object-contain opacity-95"
            priority
            src={spotNote}
          />
        </article>

        <section
          className="rounded-md border border-[#cfc4ae] bg-[#fffdf6] p-5 sm:p-6"
          id="notes"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-black">
                {query ? 'Search results' : 'Recent accessible notes'}
              </h2>
              <p className="mt-1 text-xs text-[#171512]/50">
                RLS-filtered for your public and verified campus access.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#17453a]">
                <ShieldCheck className="h-4 w-4" />
                {membershipResult.data?.status === 'verified'
                  ? 'Campus verified'
                  : 'Public notes only'}
              </span>
              <Link
                className="inline-flex items-center gap-1 text-xs font-black text-[#17453a] underline decoration-[#f0a202] decoration-2 underline-offset-4"
                href="/dashboard/notes"
              >
                View library
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {notes.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="bg-ruled grid min-h-[214px] place-items-center border border-dashed border-[#bfb39d] bg-[#f7f1e5] p-8 text-center">
              <div>
                <FileText className="mx-auto h-8 w-8 text-[#17453a]" strokeWidth={1.6} />
                <h3 className="font-display mt-3 text-xl font-bold">
                  {query ? 'No matching notes yet' : 'The accessible shelf is empty'}
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#171512]/60">
                  {query
                    ? 'Try a broader title search or clear the search to see recent uploads.'
                    : 'Be the first to add a useful note. Published files will appear here after secure verification.'}
                </p>
                <Link
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-[#17453a] underline decoration-[#f0a202] decoration-2 underline-offset-4"
                  href={query ? '/dashboard' : '/dashboard/notes/new'}
                >
                  {query ? 'Clear search' : 'Upload the first note'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </section>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <article
          className="bg-ruled relative overflow-hidden rounded-md border border-[#cfc4ae] bg-[#fffdf6] p-5 sm:p-6"
          id="roadmap-preview"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#d8cdb9] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#f0a202]" />
                <h2 className="font-display text-2xl font-black">AI roadmap preview</h2>
              </div>
              <p className="mt-1 text-xs text-[#171512]/50">
                Source-cited plans generated from notes you may access.
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-xs font-black text-[#b56d00]"
              href="/dashboard/roadmaps"
            >
              Open workspace <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {[
              ['1', 'Data Structures & Algorithms', 'Trees, graphs, DP, greedy', '60%'],
              ['2', 'Database Management Systems', 'ER model, SQL, normalization', 'Next'],
              ['3', 'Operating Systems', 'Processes, scheduling, deadlocks', 'Later'],
            ].map(([number, title, topics, state], index) => (
              <div className="flex items-center gap-3 sm:gap-4" key={title}>
                <span
                  className={
                    index === 0
                      ? 'grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#17453a] font-display text-sm font-black text-[#fffdf6]'
                      : 'grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#bfb39d] bg-[#f6f1e5] font-display text-sm font-black'
                  }
                >
                  {number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-display block truncate text-base font-bold">
                    {title}
                  </span>
                  <span className="block truncate text-xs text-[#171512]/50">{topics}</span>
                </span>
                <span className="min-w-12 text-right text-xs font-bold text-[#17453a]">
                  {state}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article
          className="rounded-md border border-[#cfc4ae] bg-[#fffdf6] p-5 sm:p-6"
          id="room-preview"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-black">Study-room preview</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2d7c58]">
              <span className="h-2 w-2 rounded-full bg-[#2d7c58]" />
              {suggestedRoom ? 'Open now' : 'Ready'}
            </span>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-[120px_1fr]">
            <div className="grid min-h-28 place-items-center overflow-hidden border border-[#cfc4ae] bg-[#f6f1e5]">
              <Image
                alt="Illustration for a focused collaborative study room"
                className="h-auto w-full object-contain"
                src={spotPomodoro}
              />
            </div>
            <div>
              <h3 className="font-display text-xl font-black">
                {suggestedRoom?.room_name || 'Open a focused room'}
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#171512]/60">
                {suggestedRoom?.subject_tag || 'Set a topic and shared Pomodoro rhythm'}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#171512]/60">
                <span className="inline-flex items-center gap-1.5">
                  <UsersRound className="h-3.5 w-3.5" />{' '}
                  {suggestedRoom
                    ? `${suggestedRoom.member_count}/${suggestedRoom.member_capacity} members`
                    : 'Public or campus access'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />{' '}
                  {suggestedRoom
                    ? `${suggestedRoom.timer_phase} ${formatTimerSeconds(suggestedRoom.timer_remaining_seconds)}`
                    : 'Synchronized Pomodoro'}
                </span>
              </div>
              <Link
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-sm bg-[#17453a] px-4 text-xs font-bold text-[#fffdf6]"
                href={
                  suggestedRoom?.current_user_joined
                    ? `/dashboard/study-rooms/${suggestedRoom.room_id}`
                    : '/dashboard/study-rooms'
                }
              >
                {suggestedRoom?.current_user_joined ? 'Return to room' : 'Explore study rooms'}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 border-t border-[#cfc4ae] py-4">
          <BookOpenCheck className="h-5 w-5 text-[#17453a]" />
          <div>
            <p className="text-xs font-black">Secure note pipeline</p>
            <p className="text-[11px] text-[#171512]/50">Signature and checksum verified</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-[#cfc4ae] py-4">
          <ShieldCheck className="h-5 w-5 text-[#17453a]" />
          <div>
            <p className="text-xs font-black">Access scoped</p>
            <p className="text-[11px] text-[#171512]/50">Public and campus RLS boundaries</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-[#cfc4ae] py-4">
          <Star className="h-5 w-5 text-[#f0a202]" />
          <div>
            <p className="text-xs font-black">Vault controls live</p>
            <p className="text-[11px] text-[#171512]/50">Manage, delete, and recover your notes</p>
          </div>
        </div>
      </section>
    </div>
  )
}
