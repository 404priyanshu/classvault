import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Clock3,
  Globe2,
  MessageCircle,
  ShieldCheck,
  TimerReset,
  UsersRound,
} from 'lucide-react'
import { z } from 'zod'
import { StudyRoomChatForm } from '@/components/study-rooms/StudyRoomChatForm'
import { StudyRoomExitControls } from '@/components/study-rooms/StudyRoomExitControls'
import { StudyRoomMembers } from '@/components/study-rooms/StudyRoomMembers'
import { StudyRoomRealtime } from '@/components/study-rooms/StudyRoomRealtime'
import { StudyRoomTimer } from '@/components/study-rooms/StudyRoomTimer'
import { parseStudyRoomSnapshot } from '@/lib/study-rooms/types'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function formatRoomDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatMessageTime(value: string) {
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
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
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

      <header className="border-b border-[#cfc4ae] pb-6">
        <Link
          className="inline-flex items-center gap-2 text-xs font-black text-[#17453a] underline decoration-[#f0a202] decoration-2 underline-offset-4"
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
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#17453a]">
                {room.visibility === 'university' ? (
                  <Building2 aria-hidden className="h-4 w-4" />
                ) : (
                  <Globe2 aria-hidden className="h-4 w-4" />
                )}
                {room.universityName || 'Public room'}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#171512]/55 sm:text-base">
              {room.subjectTag}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#171512]/55">
              <span className="inline-flex items-center gap-1.5">
                <UsersRound aria-hidden className="h-4 w-4 text-[#17453a]" />
                {members.length}/{room.memberCapacity} members
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 aria-hidden className="h-4 w-4 text-[#17453a]" />
                Room expires at {formatRoomDate(room.endsAt)}
              </span>
              <span className="inline-flex items-center gap-1.5 capitalize">
                <ShieldCheck aria-hidden className="h-4 w-4 text-[#17453a]" />
                Your role: {viewerRole === 'cohost' ? 'co-host' : viewerRole}
              </span>
            </div>
          </div>
          <StudyRoomExitControls isHost={isHost} roomId={room.id} />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="space-y-6">
          <section className="bg-ruled overflow-hidden rounded-md border border-[#cfc4ae] bg-[#fffdf6]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8cdb9] px-5 py-4 sm:px-7">
              <div className="flex items-center gap-2">
                <TimerReset aria-hidden className="h-5 w-5 text-[#17453a]" />
                <h2 className="font-display text-xl font-black">Shared Pomodoro</h2>
              </div>
              <p className="text-xs font-semibold text-[#171512]/50">
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

          <section className="rounded-md border border-[#cfc4ae] bg-[#fffdf6] p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[#d8cdb9] pb-5">
              <div>
                <h2 className="font-display text-2xl font-black">Participants</h2>
                <p className="mt-1 text-xs text-[#171512]/50">
                  Hosts can appoint co-hosts to keep timer controls available.
                </p>
              </div>
              <span className="text-xs font-bold text-[#17453a]">
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

        <section className="flex min-h-[640px] flex-col rounded-md border border-[#cfc4ae] bg-[#fffdf6] p-5 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#d8cdb9] pb-4">
            <div className="flex items-center gap-2">
              <MessageCircle aria-hidden className="h-5 w-5 text-[#17453a]" />
              <h2 className="font-display text-2xl font-black">Room chat</h2>
            </div>
            <span className="text-[11px] font-bold text-[#171512]/45">
              Temporary
            </span>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-5 pr-1">
            {messages.length > 0 ? (
              messages.map((message) => {
                const ownMessage = message.authorId === claims.sub
                return (
                  <article
                    className={`max-w-[88%] ${ownMessage ? 'ml-auto' : ''}`}
                    key={message.id}
                  >
                    <div
                      className={
                        ownMessage
                          ? 'rounded-md rounded-br-sm bg-[#17453a] px-3.5 py-3 text-[#fffdf6]'
                          : 'rounded-md rounded-bl-sm border border-[#d8cdb9] bg-[#f6f1e5] px-3.5 py-3'
                      }
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] font-bold">
                        <span className={ownMessage ? 'text-[#fffdf6]/75' : 'text-[#17453a]'}>
                          {message.authorDisplayName}
                        </span>
                        <time className={ownMessage ? 'text-[#fffdf6]/55' : 'text-[#171512]/40'}>
                          {formatMessageTime(message.createdAt)}
                        </time>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {message.body}
                      </p>
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="grid min-h-64 place-items-center text-center">
                <div>
                  <MessageCircle
                    aria-hidden
                    className="mx-auto h-8 w-8 text-[#17453a]/55"
                    strokeWidth={1.5}
                  />
                  <h3 className="font-display mt-3 text-lg font-black">
                    Start the room conversation
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-[#171512]/50">
                    Chat remains private to current members and is deleted when the
                    room ends.
                  </p>
                </div>
              </div>
            )}
          </div>

          <StudyRoomChatForm roomId={room.id} />
        </section>
      </div>
    </div>
  )
}
