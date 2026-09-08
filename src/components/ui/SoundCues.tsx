'use client'

import { useEffect } from 'react'
import { bind, setEnabled, setVolume } from 'cuelume'
import { readSoundCuesPreference, subscribeSoundCues } from '@/lib/sound-cues'

/**
 * Wires cuelume's delegated listeners once for the authenticated app.
 *
 * `bind()` is idempotent and resolves `data-cuelume-*` attributes when each
 * event fires, so it survives route changes and re-rendered subtrees without
 * being called again. Nothing plays until the student opts in from Settings.
 */
export function SoundCues() {
  useEffect(() => {
    bind()
    // Cuelume's own scale is loud for an interface people sit inside all
    // evening; these are meant to sit under the room, not announce themselves.
    setVolume(0.35)
    setEnabled(readSoundCuesPreference())

    // Covers the settings toggle in this tab and a change made in another one.
    return subscribeSoundCues(() => setEnabled(readSoundCuesPreference()))
  }, [])

  return null
}
