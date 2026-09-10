'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Re-renders the room when its shape changes.
 *
 * Membership and the shared timer alter what the page is made of -- who is
 * listed, who may press play, how many seats are left -- so they still go
 * through the server, and both change a handful of times per session.
 *
 * Chat deliberately does not. It is the one event a busy room produces
 * constantly, and `StudyRoomChat` appends it from the realtime payload instead,
 * which is what stops ten people talking from costing ten server renders per
 * message.
 */
export function StudyRoomRealtime({ roomId }: { roomId?: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let refreshTimer: ReturnType<typeof setTimeout> | undefined
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => router.refresh(), 120)
    }
    const suffix = roomId || 'lobby'
    const roomFilter = roomId ? `id=eq.${roomId}` : undefined
    const childFilter = roomId ? `room_id=eq.${roomId}` : undefined
    const channel = supabase
      .channel(`study-room-${suffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          filter: roomFilter,
          schema: 'public',
          table: 'study_rooms',
        },
        scheduleRefresh,
      )

    if (roomId) {
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            filter: childFilter,
            schema: 'public',
            table: 'study_room_members',
          },
          scheduleRefresh,
        )
    }

    channel.subscribe()

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer)
      void supabase.removeChannel(channel)
    }
  }, [roomId, router])

  return null
}
