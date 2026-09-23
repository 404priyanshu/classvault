import { beforeEach, describe, expect, it, vi } from 'vitest'

const { afterMock } = vi.hoisted(() => ({ afterMock: vi.fn() }))

vi.mock('server-only', () => ({}))
vi.mock('next/server', () => ({ after: afterMock }))

import { recordUsageEvent } from '@/lib/usage'

function clientReturning(error: { message: string } | null) {
  const rpc = vi.fn().mockResolvedValue({ data: error ? null : true, error })
  return { client: { rpc } as never, rpc }
}

async function flushAfter() {
  const callback = afterMock.mock.calls.at(-1)?.[0] as () => Promise<void>
  await callback()
}

describe('recordUsageEvent', () => {
  beforeEach(() => {
    afterMock.mockReset()
  })

  it('defers the write until after the response', () => {
    const { client, rpc } = clientReturning(null)

    recordUsageEvent(client, { event: 'roadmap_generated' })

    expect(afterMock).toHaveBeenCalledOnce()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('sends only the event fields each kind allows', async () => {
    const { client, rpc } = clientReturning(null)

    recordUsageEvent(client, { event: 'notes_searched', foundResults: false })
    await flushAfter()
    recordUsageEvent(client, {
      event: 'note_opened',
      noteId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    })
    await flushAfter()

    expect(rpc).toHaveBeenNthCalledWith(1, 'record_usage_event', {
      p_event: 'notes_searched',
      p_found_results: false,
      p_note_id: undefined,
    })
    expect(rpc).toHaveBeenNthCalledWith(2, 'record_usage_event', {
      p_event: 'note_opened',
      p_found_results: undefined,
      p_note_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    })
  })

  it('swallows a failed write instead of failing the request', async () => {
    const { client } = clientReturning({ message: 'boom' })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    recordUsageEvent(client, { event: 'study_room_joined' })
    await expect(flushAfter()).resolves.toBeUndefined()
    expect(consoleError).toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
