import { describe, expect, it } from 'vitest'
import { detectNoteFileMimeType } from '@/lib/notes/storage/file-signature'

describe('note file signature detection', () => {
  it.each([
    [[0x25, 0x50, 0x44, 0x46, 0x2d], 'application/pdf'],
    [[0xff, 0xd8, 0xff, 0xe0], 'image/jpeg'],
    [
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      'image/png',
    ],
    [
      [
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42,
        0x50,
      ],
      'image/webp',
    ],
  ])('detects %s as %s', (signature, expected) => {
    expect(detectNoteFileMimeType(new Uint8Array(signature))).toBe(expected)
  })

  it('rejects browser-declared types without a supported file signature', () => {
    expect(
      detectNoteFileMimeType(
        new TextEncoder().encode('<html><script>alert(1)</script></html>'),
      ),
    ).toBeNull()
  })
})
