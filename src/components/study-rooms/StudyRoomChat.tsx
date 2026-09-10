'use client'

import { useEffect, useMemo, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  parseStudyRoomMessageRow,
  type StudyRoomMessage,
} from '@/lib/study-rooms/types'
import { StudyRoomChatForm } from './StudyRoomChatForm'

/**
 * Times are pinned to the room's audience rather than the renderer's clock.
 *
 * This list is server-rendered and then hydrated, so a formatter that reads the
 * ambient zone would print the Vercel region's UTC on the server and the
 * student's IST in the browser, and React would report the mismatch. Naming the
 * zone makes both passes agree -- and prints the time an Indian student
 * actually recognises, which the server-only render never did.
 */
const messageTimeFormat = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
})

/**
 * Room chat that grows from its own realtime feed.
 *
 * Every message used to arrive as `router.refresh()`, so one student typing in
 * a room of ten cost ten snapshot queries and ten full server renders. The
 * insert payload already carries every column this list draws, including the
 * denormalised author name, so the message can simply be appended.
 *
 * Realtime applies the subscriber's own select policy before delivering a row,
 * which is the same boundary `get_study_room_snapshot` renders behind: a
 * student who could not read the message on the server cannot receive it here.
 */
export function StudyRoomChat({
  currentUserId,
  initialMessages,
  roomId,
}: {
  currentUserId: string
  initialMessages: StudyRoomMessage[]
  roomId: string
}) {
  const [liveMessages, setLiveMessages] = useState<StudyRoomMessage[]>([])

  // The snapshot is the base and anything realtime delivered sits on top,
  // deduplicated by id. Merging rather than replacing means a re-render from a
  // member joining cannot drop a message that arrived since the snapshot was
  // built, and a message the snapshot has already caught up on collapses back
  // into a single entry. Identity ordering is insertion ordering, so sorting by
  // id reproduces the `created_at, id` order the snapshot is built with.
  const messages = useMemo(() => {
    if (liveMessages.length === 0) return initialMessages

    const byId = new Map<number, StudyRoomMessage>()
    for (const message of [...initialMessages, ...liveMessages]) {
      byId.set(message.id, message)
    }

    return [...byId.values()].sort((left, right) => left.id - right.id)
  }, [initialMessages, liveMessages])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`study-room-chat-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          filter: `room_id=eq.${roomId}`,
          schema: 'public',
          table: 'study_room_messages',
        },
        (payload) => {
          const message = parseStudyRoomMessageRow(payload.new)
          if (!message) return

          setLiveMessages((current) =>
            // The sender receives their own insert too, and a reconnect can
            // replay one that already landed.
            current.some((existing) => existing.id === message.id)
              ? current
              : [...current, message],
          )
        },
      )

    channel.subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roomId])

  return (
    <section className="flex min-h-[640px] flex-col rounded-3xl border border-club-line bg-club-paper p-5 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between gap-3 border-b border-club-line pb-4">
        <div className="flex items-center gap-2">
          <MessageCircle aria-hidden className="h-5 w-5 text-club-purple" />
          <h2 className="font-display text-2xl font-black">Room chat</h2>
        </div>
        <span className="text-[11px] font-bold text-club-muted">Temporary</span>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-5 pr-1">
        {messages.length > 0 ? (
          messages.map((message) => {
            const ownMessage = message.authorId === currentUserId
            return (
              <article
                className={`max-w-[88%] ${ownMessage ? 'ml-auto' : ''}`}
                key={message.id}
              >
                <div
                  className={
                    ownMessage
                      ? 'rounded-md rounded-br-sm bg-club-purple px-3.5 py-3 text-club-paper'
                      : 'rounded-md rounded-bl-sm border border-club-line bg-club-bg px-3.5 py-3'
                  }
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] font-bold">
                    <span className={ownMessage ? 'text-club-paper/75' : 'text-club-purple'}>
                      {message.authorDisplayName}
                    </span>
                    <time className={ownMessage ? 'text-club-paper/80' : 'text-club-muted'}>
                      {messageTimeFormat.format(new Date(message.createdAt))}
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
                className="mx-auto h-8 w-8 text-club-purple/55"
                strokeWidth={1.5}
              />
              <h3 className="font-display mt-3 text-lg font-black">
                Start the room conversation
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-club-muted">
                Chat remains private to current members and is deleted when the
                room ends.
              </p>
            </div>
          </div>
        )}
      </div>

      <StudyRoomChatForm roomId={roomId} />
    </section>
  )
}
