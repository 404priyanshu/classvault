import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Clock3,
  Globe2,
  ShieldCheck,
  TimerReset,
  UsersRound,
} from 'lucide-react'
import { z } from 'zod'
import { StudyRoomChat } from '@/components/study-rooms/StudyRoomChat'
import { StudyRoomExitControls } from '@/components/study-rooms/StudyRoomExitControls'
import { StudyRoomMembers } from '@/components/study-rooms/StudyRoomMembers'
import { StudyRoomRealtime } from '@/components/study-rooms/StudyRoomRealtime'
import { StudyRoomTimer } from '@/components/study-rooms/StudyRoomTimer'
import { parseStudyRoomSnapshot } from '@/lib/study-rooms/types'
import { getRequestClaims } from '@/lib/supabase/claims'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function formatRoomDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export default async function StudyRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId: rawRoomId } = await params
  const roomId = z.string().uuid().safeParse(rawRoomId)
  if (!roomId.success) redirect('/dashboard/study-rooms')

  const supabase = await createClient()
  const claims = await getRequestClaims()
  if (!claims) {
    redirect(`/auth/sign-in?next=/dashboard/study-rooms/${roomId.data}`)
  }

  const { data, error } = await supabase.rpc('get_study_room_snapshot', {
    p_room_id: roomId.data,
  })
  if (error) throw new Error('The study room could not be loaded.')

  const snapshot = data ? parseStudyRoomSnapshot(data) : null
  if (!snapshot) redirect('/dashboard/study-rooms?status=not-member')

  const { room, members, messages, viewerRole } = snapshot
  const canControl = viewerRole === 'host' || viewerRole === 'cohost'
  const isHost = viewerRole === 'host'

  return (
    <div className="space-y-6">
      <StudyRoomRealtime roomId={room.id} />

      <header className="border-b border-club-line pb-6">
        <Link
          className="inline-flex items-center gap-2 text-xs font-black text-club-purple underline decoration-club-yellow decoration-2 underline-offset-4"
          href="/dashboard/study-rooms"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Back to rooms
        </Link>
        <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="app-title">
                {room.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-club-purple">
                {room.visibility === 'university' ? (
                  <Building2 aria-hidden className="h-4 w-4" />
                ) : (
                  <Globe2 aria-hidden className="h-4 w-4" />
                )}
                {room.universityName || 'Public room'}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-club-muted sm:text-base">
              {room.subjectTag}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-club-muted">
              <span className="inline-flex items-center gap-1.5">
                <UsersRound aria-hidden className="h-4 w-4 text-club-purple" />
                {members.length}/{room.memberCapacity} members
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 aria-hidden className="h-4 w-4 text-club-purple" />
                Room expires at {formatRoomDate(room.endsAt)}
              </span>
              <span className="inline-flex items-center gap-1.5 capitalize">
                <ShieldCheck aria-hidden className="h-4 w-4 text-club-purple" />
                Your role: {viewerRole === 'cohost' ? 'co-host' : viewerRole}
              </span>
            </div>
          </div>
          <StudyRoomExitControls isHost={isHost} roomId={room.id} />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-md border border-club-line bg-club-paper">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-club-line px-5 py-4 sm:px-7">
              <div className="flex items-center gap-2">
                <TimerReset aria-hidden className="h-5 w-5 text-club-purple" />
                <h2 className="font-display text-xl font-black">Shared Pomodoro</h2>
              </div>
              <p className="text-xs font-semibold text-club-muted">
                {room.focusMinutes} min focus · {room.breakMinutes} min break ·{' '}
                {room.cyclesCompleted} cycles
              </p>
            </div>
            <div className="px-5 py-10 sm:px-8 sm:py-14">
              <StudyRoomTimer
                canControl={canControl}
                initialRemainingSeconds={room.timerRemainingSeconds}
                key={room.timerRevision}
                roomId={room.id}
                timerPhase={room.timerPhase}
                timerRevision={room.timerRevision}
                timerStatus={room.timerStatus}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-club-line bg-club-paper p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-club-line pb-5">
              <div>
                <h2 className="font-display text-2xl font-black">Participants</h2>
                <p className="mt-1 text-xs text-club-muted">
                  Hosts can appoint co-hosts to keep timer controls available.
                </p>
              </div>
              <span className="text-xs font-bold text-club-purple">
                {members.length} joined
              </span>
            </div>
            <StudyRoomMembers
              currentUserId={String(claims.sub)}
              members={members}
              roomId={room.id}
              viewerRole={viewerRole}
            />
          </section>
        </div>

        <StudyRoomChat
          currentUserId={String(claims.sub)}
          initialMessages={messages}
          roomId={room.id}
        />
      </div>
    </div>
  )
}
