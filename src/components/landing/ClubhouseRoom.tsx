'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './Clubhouse.module.css'

const FOCUS_SECONDS = 25 * 60

export function ClubhouseRoom() {
  const [seconds, setSeconds] = useState(FOCUS_SECONDS)
  const [running, setRunning] = useState(false)
  const deadline = useRef(0)

  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))
      setSeconds(remaining)
      if (remaining === 0) setRunning(false)
    }, 250)
    return () => window.clearInterval(interval)
  }, [running])

  function toggleTimer() {
    if (running) {
      setSeconds(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)))
      setRunning(false)
    } else {
      const remaining = seconds || FOCUS_SECONDS
      setSeconds(remaining)
      deadline.current = Date.now() + remaining * 1000
      setRunning(true)
    }
  }

  return (
    <>
      <div className={styles.roomCard}>
        <div className={styles.roomCardTop}><span>THE REVISION CORNER</span><span>● {running ? 'Focus time' : 'Get comfy'}</span></div>
        <time aria-label={`${Math.floor(seconds / 60)} minutes, ${seconds % 60} seconds remaining`}>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</time>
        <p>A little focus. A little company.</p>
        <div className={styles.roomDemoControls}>
          <button type="button" onClick={toggleTimer}>{running ? 'Pause demo' : 'Start a focus demo'} <span aria-hidden>{running ? 'Ⅱ' : '▶'}</span></button>
          <button type="button" aria-label="Reset focus demo" onClick={() => { setRunning(false); setSeconds(FOCUS_SECONDS) }}>↺</button>
        </div>
        <div className={styles.roomAvatars} aria-label="Example room members"><span>A</span><span>M</span><span>R</span></div>
        <div className={styles.roomMessage}><b>MEERA</b>one more chapter, then chai?</div>
      </div>
      <span className={styles.visualCaption}>Try the timer · example members & chat</span>
    </>
  )
}
