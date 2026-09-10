import { describe, expect, it } from 'vitest'
import { parseStudyRoomMessageRow } from '@/lib/study-rooms/types'

const row = {
  author_display_name: 'Aarav',
  author_id: '2f1b7e2a-6a1e-4d4c-8f3f-3f1d2c4b5a60',
  body: 'Starting the next cycle in five.',
  created_at: '2026-09-11T04:15:00.000Z',
  id: 42,
  room_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
}

describe('study room realtime message rows', () => {
  it('reshapes a realtime row the way the snapshot builds one', () => {
    expect(parseStudyRoomMessageRow(row)).toEqual({
      authorDisplayName: 'Aarav',
      authorId: '2f1b7e2a-6a1e-4d4c-8f3f-3f1d2c4b5a60',
      body: 'Starting the next cycle in five.',
      createdAt: '2026-09-11T04:15:00.000Z',
      id: 42,
    })
  })

  it('keeps a message whose author has deleted their account', () => {
    // author_id is `on delete set null`, and the display name is denormalised
    // precisely so the message survives the profile going away.
    expect(parseStudyRoomMessageRow({ ...row, author_id: null })).toMatchObject({
      authorDisplayName: 'Aarav',
      authorId: null,
    })
  })

  it('rejects a row missing the column the list renders', () => {
    // Dropping a message beats rendering `undefined` into the chat if the
    // table and this parser ever drift apart.
    const withoutBody: Record<string, unknown> = { ...row }
    delete withoutBody.body
    expect(parseStudyRoomMessageRow(withoutBody)).toBeNull()
  })

  it('rejects a payload that is not a row at all', () => {
    expect(parseStudyRoomMessageRow(null)).toBeNull()
    expect(parseStudyRoomMessageRow({})).toBeNull()
  })
})
