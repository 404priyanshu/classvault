/**
 * Interaction-sound preference.
 *
 * Sound is off until a student turns it on. ClassVault is used in lectures,
 * libraries and shared rooms, so a page that makes noise on first load is a
 * problem in the exact places this product is opened. The setting lives in
 * `localStorage` rather than the profile because it belongs to the device
 * making the noise, not the account.
 */

export const SOUND_CUES_STORAGE_KEY = 'classvault:sound-cues'

/** Fired on the window when the preference changes, so open tabs stay in sync. */
export const SOUND_CUES_EVENT = 'classvault:sound-cues-change'

export function readSoundCuesPreference(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(SOUND_CUES_STORAGE_KEY) === 'on'
  } catch {
    // Private windows and blocked site data both throw on access.
    return false
  }
}

/**
 * `useSyncExternalStore` parts. The preference lives outside React — in
 * `localStorage`, changed by another tab as easily as by this one — so the
 * store subscribes rather than mirroring it into component state.
 */
export function subscribeSoundCues(onChange: () => void): () => void {
  window.addEventListener(SOUND_CUES_EVENT, onChange)
  window.addEventListener('storage', onChange)

  return () => {
    window.removeEventListener(SOUND_CUES_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function getSoundCuesSnapshot(): boolean {
  return readSoundCuesPreference()
}

/** The server cannot read the device's choice, and silence is the safe guess. */
export function getSoundCuesServerSnapshot(): boolean {
  return false
}

export function writeSoundCuesPreference(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(SOUND_CUES_STORAGE_KEY, enabled ? 'on' : 'off')
  } catch {
    // A rejected write still leaves the in-page setting applied for this visit.
  }

  window.dispatchEvent(
    new CustomEvent<boolean>(SOUND_CUES_EVENT, { detail: enabled }),
  )
}
