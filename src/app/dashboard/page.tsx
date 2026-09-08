import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3, FileText, Search, ShieldCheck, Upload, UsersRound, Route } from 'lucide-react'
import { redirect } from 'next/navigation'
import clubhouse from '@/assets/study-clubhouse.webp'
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
      className="group flex min-h-[214px] flex-col overflow-hidden rounded-2xl border border-club-line bg-club-paper outline-none transition-transform hover:-translate-y-1 hover:[box-shadow:var(--elev-inline)] focus-visible:ring-2 focus-visible:ring-club-purple"
      href={`/dashboard/notes/${note.id}`}
    >
      <div className="relative h-24 overflow-hidden border-b border-club-line bg-club-lavender p-4">
        <div className="absolute left-4 top-4 h-2 w-16 rounded-full bg-club-purple/15" />
        <div className="absolute left-4 top-9 h-1.5 w-3/4 rounded-full bg-club-ink/10" />
        <div className="absolute left-4 top-14 h-1.5 w-1/2 rounded-full bg-club-ink/10" />
        <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-club-purple text-club-paper">
          <ShieldCheck className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-club-purple">
          {note.subjects?.code || note.subjects?.name || 'General notes'}
        </p>
        <h3 className="font-display mt-1 line-clamp-2 text-lg font-bold leading-tight">
          {note.title}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[11px] text-club-muted">
          <span>{formatNoteType(note.note_type)}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-club-purple">
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
    <div className="space-y-7">
      <AuthMessage status={status} />
      <section className="club-welcome">
        <div>
          <span className="club-eyebrow text-club-purple">Your little corner of campus</span>
          <h1 className="app-title mt-3">Hey {firstName},<br />let’s make a little progress.</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-club-muted">A good set of notes. A plan that feels doable. Some company along the way. Where shall we start?</p>
        </div>
        <Image src={clubhouse} alt="The ClassVault study crew in their book-filled clubhouse." className="club-welcome-art" sizes="(max-width: 640px) 0px, 30vw" />
      </section>

      <nav className="club-quick-links" aria-label="Quick study actions">
        <Link href="/dashboard/notes/new"><Upload size={24} /><span><strong>Pass the good notes</strong><small>Share something useful</small></span><ArrowRight size={16} className="ml-auto shrink-0" /></Link>
        <Link href="/dashboard/roadmaps"><Route size={24} /><span><strong>Make a little plan</strong><small>One topic at a time</small></span><ArrowRight size={16} className="ml-auto shrink-0" /></Link>
        <Link href="/dashboard/study-rooms"><UsersRound size={24} /><span><strong>Find some company</strong><small>Settle into a study room</small></span><ArrowRight size={16} className="ml-auto shrink-0" /></Link>
      </nav>

      <section className="app-panel p-5 sm:p-7" id="notes">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-2xl font-extrabold tracking-tight">{query ? 'Your search results' : 'Fresh from the library'}</h2><p className="mt-2 text-xs text-club-muted">Notes you can open, from your classmates and beyond.</p></div>
          <Link href="/dashboard/notes" className="inline-flex items-center gap-2 text-sm font-bold text-club-purple">Explore the library <ArrowRight size={16} /></Link>
        </div>
        <form action="/dashboard/notes" className="relative my-6" role="search">
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-club-muted" />
          <input aria-label="Search Notes Library" className="app-field h-14 pl-12 pr-24 text-sm" defaultValue={query} name="q" placeholder="What are we studying today?" type="search" />
          <button className="absolute right-2 top-1/2 min-h-10 -translate-y-1/2 rounded-full bg-club-purple px-4 text-xs font-bold text-club-paper" type="submit">Search</button>
        </form>
        {notes.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">{notes.map(note => <NoteCard key={note.id} note={note} />)}</div> : (
          <div className="rounded-2xl bg-club-lavender/60 px-6 py-10 text-center">
            <FileText className="mx-auto h-9 w-9 text-club-purple" strokeWidth={1.5} />
            <h3 className="mt-4 text-xl font-extrabold">{query ? 'No matches just yet' : 'A fresh shelf. A good place to start.'}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-club-muted">{query ? 'Try another title or browse the full library.' : 'Your first shared note could make someone’s next revision session a little easier.'}</p>
            <Link className="btn-ink mt-5 inline-flex min-h-11 items-center gap-2 px-5 text-sm font-bold" href={query ? '/dashboard' : '/dashboard/notes/new'}>{query ? 'Clear search' : 'Share the first note'}<ArrowRight size={16} /></Link>
          </div>
        )}
        <p className="mt-5 inline-flex items-center gap-2 text-xs text-club-muted"><ShieldCheck size={15} />{membershipResult.data?.status === 'verified' ? 'Public notes and your verified campus collection' : 'Public notes · campus access unlocks after verification'}</p>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl bg-club-yellow p-6 sm:p-7">
          <span className="club-eyebrow">Small steps, less overwhelm</span>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">Big syllabus?<br />Start with one topic.</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-club-muted">Build a roadmap from notes you can access. Each section points back to its sources, and your progress is yours to keep.</p>
          <Link href="/dashboard/roadmaps" className="app-button mt-6 inline-flex items-center gap-2 px-5 text-sm">Open your roadmaps <ArrowRight size={16} /></Link>
        </section>
        <section className="rounded-3xl bg-club-mint p-6 sm:p-7">
          <span className="club-eyebrow">A little focus. A little company.</span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight">{suggestedRoom?.room_name || 'Pull up a chair.'}</h2>
          <p className="mt-3 text-sm text-club-muted">{suggestedRoom?.subject_tag || 'Create a room or find a group to study with. Bring your notes; we’ll bring the shared timer.'}</p>
          {suggestedRoom && <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold"><span className="inline-flex items-center gap-2"><UsersRound size={15} />{suggestedRoom.member_count}/{suggestedRoom.member_capacity} members</span><span className="inline-flex items-center gap-2"><Clock3 size={15} />{suggestedRoom.timer_phase} · {formatTimerSeconds(suggestedRoom.timer_remaining_seconds)}</span></div>}
          <Link className="app-button mt-6 inline-flex items-center gap-2 px-5 text-sm" href={suggestedRoom?.current_user_joined ? `/dashboard/study-rooms/${suggestedRoom.room_id}` : '/dashboard/study-rooms'}>{suggestedRoom?.current_user_joined ? 'Back to your room' : 'Explore study rooms'}<ArrowRight size={16} /></Link>
        </section>
      </div>
    </div>
  )
}
