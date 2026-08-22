import { describe, expect, it } from 'vitest'
import {
  daysUntilPurge,
  formatVaultFileSize,
  formatVaultStatus,
  type OwnedNote,
} from '@/lib/notes/vault'

const baseNote: OwnedNote = {
  average_rating: null,
  byte_size: 1024,
  created_at: '2026-08-23T00:00:00Z',
  deleted_at: null,
  description: null,
  detected_mime_type: 'application/pdf',
  moderation_status: 'clear',
  note_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  note_type: 'summary',
  original_filename: 'notes.pdf',
  processing_status: 'ready',
  publication_status: 'published',
  published_at: '2026-08-23T00:00:00Z',
  purge_after: null,
  rating_count: 0,
  retention_hold: false,
  subject_code: 'OS',
  subject_name: 'Operating Systems',
  title: 'Revision notes',
  updated_at: '2026-08-23T00:00:00Z',
  visibility: 'public',
}

describe('My Vault helpers', () => {
  it('formats private file sizes consistently', () => {
    expect(formatVaultFileSize(null)).toBe('File pending')
    expect(formatVaultFileSize(512)).toBe('1 KB')
    expect(formatVaultFileSize(1024 * 1024 * 2.25)).toBe('2.3 MB')
  })

  it('calculates an inclusive recovery-day label', () => {
    expect(
      daysUntilPurge('2026-08-30T00:00:00Z', new Date('2026-08-23T12:00:00Z')),
    ).toBe(7)
    expect(
      daysUntilPurge('2026-08-22T00:00:00Z', new Date('2026-08-23T00:00:00Z')),
    ).toBe(0)
  })

  it('maps upload states to owner-facing status copy', () => {
    expect(formatVaultStatus(baseNote)).toBe('Published')
    expect(
      formatVaultStatus({ ...baseNote, publication_status: 'draft' }),
    ).toBe('Saved draft')
    expect(
      formatVaultStatus({
        ...baseNote,
        publication_status: 'draft',
        processing_status: 'uploading',
      }),
    ).toBe('Upload in progress')
  })
})
