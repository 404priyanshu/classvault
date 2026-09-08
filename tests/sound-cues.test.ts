import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  SOUND_CUES_EVENT,
  SOUND_CUES_STORAGE_KEY,
  getSoundCuesServerSnapshot,
  getSoundCuesSnapshot,
  readSoundCuesPreference,
  subscribeSoundCues,
  writeSoundCuesPreference,
} from '@/lib/sound-cues'

/**
 * The suite runs in Node, so each test installs the browser globals it needs
 * and strips them afterwards — that also covers the server case, where
 * `window` is genuinely absent.
 */
function installWindow(storage?: Partial<Storage>) {
  const listeners = new Map<string, Set<EventListener>>()

  const win = {
    localStorage: storage,
    addEventListener(type: string, listener: EventListener) {
      const set = listeners.get(type) ?? new Set()
      set.add(listener)
      listeners.set(type, set)
    },
    removeEventListener(type: string, listener: EventListener) {
      listeners.get(type)?.delete(listener)
    },
    dispatchEvent(event: { type: string }) {
      listeners.get(event.type)?.forEach((listener) => listener(event as Event))
      return true
    },
  }

  vi.stubGlobal('window', win)
  vi.stubGlobal('CustomEvent', class {
    type: string
    detail: unknown
    constructor(type: string, init?: { detail?: unknown }) {
      this.type = type
      this.detail = init?.detail
    }
  })

  return { listeners, win }
}

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial))

  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
  } as Partial<Storage>
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('sound cue preference', () => {
  it('stays silent when nothing has been stored', () => {
    installWindow(memoryStorage())
    expect(readSoundCuesPreference()).toBe(false)
  })

  it('stays silent on the server, where there is no window', () => {
    vi.stubGlobal('window', undefined)
    expect(readSoundCuesPreference()).toBe(false)
    expect(getSoundCuesServerSnapshot()).toBe(false)
  })

  it('reads a stored opt-in', () => {
    installWindow(memoryStorage({ [SOUND_CUES_STORAGE_KEY]: 'on' }))
    expect(getSoundCuesSnapshot()).toBe(true)
  })

  it('treats any other stored value as off', () => {
    installWindow(memoryStorage({ [SOUND_CUES_STORAGE_KEY]: 'yes' }))
    expect(readSoundCuesPreference()).toBe(false)
  })

  it('stays silent when storage itself throws', () => {
    installWindow({
      getItem() {
        throw new Error('site data blocked')
      },
    })
    expect(readSoundCuesPreference()).toBe(false)
  })

  it('round-trips a write', () => {
    installWindow(memoryStorage())
    writeSoundCuesPreference(true)
    expect(readSoundCuesPreference()).toBe(true)
    writeSoundCuesPreference(false)
    expect(readSoundCuesPreference()).toBe(false)
  })

  it('still notifies listeners when the write is rejected', () => {
    installWindow({
      getItem: () => null,
      setItem() {
        throw new Error('quota')
      },
    })

    const onChange = vi.fn()
    subscribeSoundCues(onChange)

    expect(() => writeSoundCuesPreference(true)).not.toThrow()
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('notifies on change and stops after unsubscribe', () => {
    installWindow(memoryStorage())

    const onChange = vi.fn()
    const unsubscribe = subscribeSoundCues(onChange)

    writeSoundCuesPreference(true)
    expect(onChange).toHaveBeenCalledTimes(1)

    unsubscribe()
    writeSoundCuesPreference(false)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('also wakes on a storage event from another tab', () => {
    const { win } = installWindow(memoryStorage())

    const onChange = vi.fn()
    subscribeSoundCues(onChange)

    win.dispatchEvent({ type: 'storage' })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('names the event the binder listens for', () => {
    expect(SOUND_CUES_EVENT).toBe('classvault:sound-cues-change')
  })
})
