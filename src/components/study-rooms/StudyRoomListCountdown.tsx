'use client'

import { useEffect, useState } from 'react'
import { formatTimerSeconds } from '@/lib/study-rooms/types'

export function StudyRoomListCountdown({
  initialSeconds,
  status,
}: {
  initialSeconds: number
  status: string
}) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    if (status !== 'running') return
    const interval = window.setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [status])

  return <span className="tabular-nums">{formatTimerSeconds(seconds)}</span>
}
