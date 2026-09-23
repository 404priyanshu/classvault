'use client'

import { MessageCircle } from 'lucide-react'
import { StudyRoomChatForm } from './StudyRoomChatForm'
import { useStudyRoomMessages } from './StudyRoomMessages'

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
 * Room chat. The messages come from StudyRoomMessagesProvider, which keeps
 * them current over realtime for the whole room.
 */
export function StudyRoomChat({
  currentUserId,
  roomId,
  viewerMuted,
}: {
  currentUserId: string
  roomId: string
  viewerMuted: boolean
}) {
  const messages = useStudyRoomMessages()

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

      <StudyRoomChatForm muted={viewerMuted} roomId={roomId} />
    </section>
  )
}
