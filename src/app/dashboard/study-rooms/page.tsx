import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  Clock3,
  DoorOpen,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { CreateStudyRoomForm } from '@/components/study-rooms/CreateStudyRoomForm'
import { JoinStudyRoomForm } from '@/components/study-rooms/JoinStudyRoomForm'
import { StudyRoomListCountdown } from '@/components/study-rooms/StudyRoomListCountdown'
import { StudyRoomRealtime } from '@/components/study-rooms/StudyRoomRealtime'
import type { StudyRoomListItem } from '@/lib/study-rooms/types'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type StudyRoomsPageProps = {
  searchParams: Promise<{ scope?: string; status?: string }>
}

const scopes = [
  { label: 'All rooms', value: 'all' },
  { label: 'Public', value: 'public' },
  { label: 'My university', value: 'university' },
  { label: 'Joined', value: 'joined' },
] as const

function statusMessage(status: string | undefined) {
  if (status === 'left') return 'You left the study room.'
  if (status === 'ended') return 'The study room and its temporary chat were deleted.'
  if (status === 'not-member') return 'Join that room before opening its live workspace.'
  return null
}

function RoomRow({ room }: { room: StudyRoomListItem }) {
  const full = room.member_count >= room.member_capacity
  const scopeLabel = room.university_name || 'Public'

  return (
    <article className="grid gap-5 border-b border-[#d8cdb9] py-6 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="font-display text-xl font-black leading-tight sm:text-2xl">
            {room.room_name}
          </h3>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#17453a]">
            {room.visibility === 'university' ? (
              <Building2 aria-hidden className="h-3.5 w-3.5" />
            ) : (
              <Globe2 aria-hidden className="h-3.5 w-3.5" />
            )}
            {scopeLabel}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-[#171512]/55">
          {room.subject_tag}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#171512]/60">
          <span className="inline-flex items-center gap-1.5">
            <UsersRound aria-hidden className="h-4 w-4 text-[#17453a]" />
            {room.member_count}/{room.member_capacity} members
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden className="h-4 w-4 text-[#17453a]" />
            <span className="capitalize">{room.timer_phase}</span>
            <span aria-hidden>·</span>
            <StudyRoomListCountdown
              initialSeconds={room.timer_remaining_seconds}
              status={room.timer_status}
            />
          </span>
          <span>
            {room.host_display_name
              ? `Hosted by ${room.host_display_name}`
              : 'Continuing without a host'}
          </span>
        </div>
      </div>

      <div className="md:min-w-32">
        {room.current_user_joined ? (
          <Link
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-sm bg-[#17453a] px-4 text-sm font-bold text-[#fffdf6] transition hover:bg-[#10372f] md:w-auto"
            href={`/dashboard/study-rooms/${room.room_id}`}
          >
            Open room
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        ) : full ? (
          <span className="inline-flex min-h-10 w-full items-center justify-center rounded-sm border border-[#c8b9a3] bg-[#eee6d8] px-4 text-sm font-bold text-[#171512]/45 md:w-auto">
            Room full
          </span>
        ) : (
          <JoinStudyRoomForm roomId={room.room_id} />
        )}
      </div>
    </article>
  )
}

export default async function StudyRoomsPage({
  searchParams,
}: StudyRoomsPageProps) {
  const { scope = 'all', status } = await searchParams
  const selectedScope = scopes.some((item) => item.value === scope) ? scope : 'all'
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (!claims) redirect('/auth/sign-in?next=/dashboard/study-rooms')

  const [roomsResult, profileResult, membershipResult] = await Promise.all([
    supabase.rpc('list_study_rooms'),
    supabase
      .from('profiles')
      .select('onboarding_completed_at, university_name')
      .eq('id', claims.sub)
      .maybeSingle(),
    supabase
      .from('university_memberships')
      .select('status')
      .eq('user_id', claims.sub)
      .maybeSingle(),
  ])

  if (!profileResult.data?.onboarding_completed_at) redirect('/onboarding')
  if (roomsResult.error) throw new Error('Study rooms could not be loaded.')

  const rooms = (roomsResult.data || []) as StudyRoomListItem[]
  const visibleRooms = rooms.filter((room) => {
    if (selectedScope === 'joined') return room.current_user_joined
    if (selectedScope === 'public') return room.visibility === 'public'
    if (selectedScope === 'university') return room.visibility === 'university'
    return true
  })
  const joinedRooms = rooms.filter((room) => room.current_user_joined)
  const message = statusMessage(status)
  const universityVerified = membershipResult.data?.status === 'verified'

  return (
    <div className="space-y-7">
      <StudyRoomRealtime />

      {message ? (
        <p
          className="border border-[#17453a]/30 bg-[#e7f0e7] px-4 py-3 text-sm font-semibold text-[#17453a]"
          role="status"
        >
          {message}
        </p>
      ) : null}

      <header className="flex flex-col gap-5 border-b border-[#cfc4ae] pb-7 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="font-display text-4xl font-black leading-[1.04] sm:text-5xl">
            Study together, stay accountable
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#171512]/60 sm:text-base">
            Join a focused session or open a room for your next revision block.
          </p>
        </div>
        <a
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-sm bg-[#f0a202] px-5 text-sm font-black text-[#171512] shadow-[3px_3px_0_#171512] transition hover:-translate-y-0.5"
          href="#create-room"
        >
          <DoorOpen aria-hidden className="h-4 w-4" />
          Create room
        </a>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 rounded-md border border-[#cfc4ae] bg-[#fffdf6] p-5 sm:p-7">
          <div className="flex flex-col gap-4 border-b border-[#d8cdb9] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-black">Rooms you can join</h2>
              <p className="mt-1 text-xs text-[#171512]/50">
                Public rooms plus rooms from your currently verified university.
              </p>
            </div>
            <nav aria-label="Filter study rooms" className="flex flex-wrap gap-1">
              {scopes.map((item) => (
                <Link
                  className={cn(
                    'min-h-9 rounded-sm px-3 py-2 text-xs font-bold transition',
                    selectedScope === item.value
                      ? 'bg-[#17453a] text-[#fffdf6]'
                      : 'text-[#171512]/60 hover:bg-[#eef4ed] hover:text-[#17453a]',
                  )}
                  href={
                    item.value === 'all'
                      ? '/dashboard/study-rooms'
                      : `/dashboard/study-rooms?scope=${item.value}`
                  }
                  key={item.value}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="pt-6">
            {visibleRooms.length > 0 ? (
              visibleRooms.map((room) => <RoomRow key={room.room_id} room={room} />)
            ) : (
              <div className="bg-ruled grid min-h-64 place-items-center border border-dashed border-[#bfb39d] bg-[#f7f1e5] px-6 py-10 text-center">
                <div>
                  <UsersRound
                    aria-hidden
                    className="mx-auto h-9 w-9 text-[#17453a]"
                    strokeWidth={1.5}
                  />
                  <h3 className="font-display mt-3 text-xl font-black">
                    No matching rooms are open
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#171512]/55">
                    Start a focused room and invite classmates who share its access scope.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-md border border-[#cfc4ae] bg-[#fffdf6] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-black">Your rooms</h2>
              <span className="text-xs font-bold text-[#17453a]">
                {joinedRooms.length} joined
              </span>
            </div>
            {joinedRooms.length > 0 ? (
              <div className="mt-4 divide-y divide-[#e2dacb]">
                {joinedRooms.map((room) => (
                  <Link
                    className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    href={`/dashboard/study-rooms/${room.room_id}`}
                    key={room.room_id}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-[#e7f0e7] text-[#17453a]">
                      <UsersRound aria-hidden className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {room.room_name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-[#171512]/50">
                        {room.subject_tag}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden
                      className="h-4 w-4 text-[#171512]/35 transition group-hover:translate-x-0.5 group-hover:text-[#17453a]"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-[#171512]/50">
                Rooms you create or join appear here for quick return.
              </p>
            )}
          </section>

          <section
            className="rounded-md border border-[#cfc4ae] bg-[#fffdf6] p-5"
            id="create-room"
          >
            <h2 className="font-display text-2xl font-black">Create a room</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#171512]/55">
              Set the topic, access boundary, and shared Pomodoro rhythm.
            </p>
            <div className="mt-5">
              <CreateStudyRoomForm
                universityName={profileResult.data.university_name}
                universityVerified={universityVerified}
              />
            </div>
          </section>

          <section className="flex gap-3 border-t border-[#cfc4ae] px-1 pt-5 text-xs leading-relaxed text-[#171512]/55">
            {universityVerified ? (
              <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#17453a]" />
            ) : (
              <LockKeyhole aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#b56d00]" />
            )}
            <p>
              {universityVerified
                ? 'Your verified campus membership permits university-only rooms.'
                : 'Public rooms are available now. Campus rooms require verified university access.'}
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
