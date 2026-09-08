'use client'

import { useSyncExternalStore } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { play, setEnabled } from 'cuelume'
import {
  getSoundCuesServerSnapshot,
  getSoundCuesSnapshot,
  subscribeSoundCues,
  writeSoundCuesPreference,
} from '@/lib/sound-cues'

export function SoundCuesToggle() {
  // Hydrates from `false` — the server cannot know the device's choice — then
  // re-renders with the stored value on the client.
  const enabled = useSyncExternalStore(
    subscribeSoundCues,
    getSoundCuesSnapshot,
    getSoundCuesServerSnapshot,
  )

  const toggle = () => {
    const next = !enabled

    // Ahead of the write so the confirmation below is audible immediately.
    setEnabled(next)
    writeSoundCuesPreference(next)

    // Turning it on is the one moment an unprompted sound is the right answer:
    // it is the reply to "what will this sound like?".
    if (next) {
      play('success')
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-bold">
          {enabled ? (
            <Volume2 aria-hidden className="h-4 w-4 text-club-purple" />
          ) : (
            <VolumeX aria-hidden className="h-4 w-4 text-club-muted" />
          )}
          Interaction sounds
        </span>
        <span className="mt-1 block max-w-md text-xs leading-relaxed text-club-muted">
          Quiet cues on buttons, tabs and uploads. Off by default, and saved on
          this device only — leave it off if you study somewhere shared.
        </span>
      </div>

      <button
        aria-checked={enabled}
        className={`inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors ${
          enabled
            ? 'border-club-purple bg-club-purple'
            : 'border-club-line bg-club-lavender'
        }`}
        onClick={toggle}
        role="switch"
        type="button"
      >
        <span className="sr-only">
          {enabled ? 'Turn interaction sounds off' : 'Turn interaction sounds on'}
        </span>
        <span
          aria-hidden
          className={`h-6 w-6 rounded-full bg-club-paper shadow-sm transition-transform ${
            enabled ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
