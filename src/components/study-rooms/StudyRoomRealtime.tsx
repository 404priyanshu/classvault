'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
        .on(
          'postgres_changes',
          {
            event: '*',
            filter: childFilter,
            schema: 'public',
            table: 'study_room_messages',
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
