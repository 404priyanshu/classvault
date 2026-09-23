'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  parseStudyRoomMessageRow,
  type StudyRoomMessage,
} from '@/lib/study-rooms/types'

const StudyRoomMessagesContext = createContext<StudyRoomMessage[] | null>(null)

/**
 * The room's chat, grown from its own realtime feed and shared by every part
 * of the room that reads it.
 *
 * The chat list and the participant report form both need the messages: a
 * report cites what someone said, because the chat is deleted with the room.
 * When the feed lived inside the chat list alone, a message that arrived live
 * showed in the chat but not in the report form, so the host could not cite
 * the very message they were reporting without reloading.
 *
 * Every message used to arrive as `router.refresh()`, so one student typing in
 * a room of ten cost ten snapshot queries and ten full server renders. The
 * insert payload already carries every column the room draws, including the
 * denormalised author name, so the message can simply be appended.
 *
 * Realtime applies the subscriber's own select policy before delivering a row,
 * which is the same boundary `get_study_room_snapshot` renders behind: a
 * student who could not read the message on the server cannot receive it here.
 */
export function StudyRoomMessagesProvider({
  children,
  initialMessages,
  roomId,
}: {
  children: ReactNode
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
    <StudyRoomMessagesContext.Provider value={messages}>
      {children}
    </StudyRoomMessagesContext.Provider>
  )
}

export function useStudyRoomMessages() {
  const messages = useContext(StudyRoomMessagesContext)
  if (!messages) {
    throw new Error('useStudyRoomMessages needs a StudyRoomMessagesProvider.')
  }
  return messages
}
