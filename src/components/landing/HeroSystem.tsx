'use client'

import { useEffect, useRef, useState } from 'react'
import { VaultMark } from './VaultMark'
import styles from './Landing.module.css'

const heroNodes = [
  { code: 'NOTE', state: 'READY', detail: 'Operating Systems — Unit 03' },
  { code: 'SEARCH', state: 'INDEXED', detail: 'metadata + PDF text' },
  { code: 'ROADMAP', state: 'CITED', detail: '04 sections · sources attached' },
  { code: 'ROOM', state: 'LIVE', detail: 'synchronized focus session' },
]

function formatTimer(total: number) {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function HeroSystem() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [activeNode, setActiveNode] = useState(0)
  const [seconds, setSeconds] = useState(24 * 60 + 59)

  useEffect(() => {
    const cycle = window.setInterval(() => {
      setActiveNode((current) => (current + 1) % heroNodes.length)
    }, 3200)
    return () => window.clearInterval(cycle)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((current) => (current > 0 ? current - 1 : 25 * 60))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    canvas.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
    canvas.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
  }

  return (
    <section id="top" className={styles.hero}>
      <div className={styles.heroCopy}>
        <VaultMark className={styles.heroMark} title="ClassVault" />
        <h1 className={styles.heroTitle}>
          <span>THE STUDY INFRASTRUCTURE</span>
          <span>FOR COLLEGE</span>
        </h1>
        <p className={styles.heroSignal}>TRUSTED NOTES. CITED PLANS. SHARED FOCUS.</p>
        <div className={styles.heroActions}>
          <a className={`${styles.button} ${styles.buttonDark} ${styles.heroButton}`} href="/auth/sign-up">
            CREATE YOUR VAULT
          </a>
          <a className={`${styles.button} ${styles.buttonOutline} ${styles.heroButton}`} href="#product">
            SEE THE SYSTEM <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      <div
        ref={canvasRef}
        className={styles.systemCanvas}
        onPointerMove={onPointerMove}
        aria-label="ClassVault workflow from notes to search, roadmaps, and study rooms"
      >
        <div className={styles.canvasNoise} aria-hidden />
        <div className={styles.scanLine} aria-hidden />
        <svg className={styles.connectorMap} viewBox="0 0 1200 520" aria-hidden>
          <path d="M600 260 C470 260 430 130 275 130" />
          <path d="M600 260 C730 260 770 130 925 130" />
          <path d="M600 260 C475 260 430 400 275 400" />
          <path d="M600 260 C725 260 770 400 925 400" />
        </svg>

        <div className={styles.centralNode}>
          <VaultMark className={styles.centralNodeMark} inverted />
          <span className={styles.centralPulse} aria-hidden />
        </div>

        {heroNodes.map((node, index) => (
          <button
            key={node.code}
            type="button"
            className={`${styles.heroNode} ${styles[`heroNode${index + 1}`]} ${activeNode === index ? styles.heroNodeActive : ''}`}
            onClick={() => setActiveNode(index)}
            aria-pressed={activeNode === index}
          >
            <span className={styles.heroNodeTopline}>
              <span>{node.code}</span>
              <span>{node.code === 'ROOM' ? formatTimer(seconds) : node.state}</span>
            </span>
            <span className={styles.heroNodeDetail}>{node.detail}</span>
            <span className={styles.heroNodeBar} aria-hidden><i /></span>
          </button>
        ))}

        <div className={styles.canvasStatus}>
          <span><i className={styles.statusDot} /> SYSTEM / CONNECTED</span>
          <span>ACTIVE / {heroNodes[activeNode].code}</span>
          <span className={styles.canvasStatusDesktop}>ACCESS / RECHECKED ON VIEW</span>
        </div>
      </div>
    </section>
  )
}
