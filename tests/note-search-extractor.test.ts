import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { extractNoteText } from '@/lib/notes/search/extractor'

describe('note text extraction', () => {
  it('marks image notes as unsupported without pretending text was indexed', async () => {
    await expect(
      extractNoteText('image/png', new Uint8Array([0x89, 0x50, 0x4e, 0x47])),
    ).resolves.toEqual({ status: 'unsupported', text: null })
  })

  it('fails safely for malformed PDFs', async () => {
    await expect(
      extractNoteText('application/pdf', new Uint8Array([0x25, 0x50, 0x44, 0x46])),
    ).resolves.toEqual({ status: 'failed', text: null })
  })
})
