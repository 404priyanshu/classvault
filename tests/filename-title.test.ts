import { describe, expect, it } from 'vitest'

import { titleFromFilename } from '@/components/notes/upload/filename-title'

describe('titleFromFilename', () => {
  it('reads a title out of an ordinary filename', () => {
    expect(titleFromFilename('DBMS Unit 3 Indexing.pdf')).toBe(
      'DBMS Unit 3 Indexing',
    )
  })

  it('treats underscores and hyphens as word separators', () => {
    expect(titleFromFilename('blockchain_engineering-unit-2.pdf')).toBe(
      'blockchain engineering unit 2',
    )
  })

  it('drops the repeat-download suffix', () => {
    expect(titleFromFilename('OS Notes (2).pdf')).toBe('OS Notes')
  })

  it('drops a leading date stamp', () => {
    expect(titleFromFilename('2026-08-25 Thermodynamics recap.pdf')).toBe(
      'Thermodynamics recap',
    )
  })

  it('drops a scanner prefix', () => {
    expect(titleFromFilename('IMG_20260825_Networks.jpg')).toBe('Networks')
  })

  it('returns empty rather than guess when nothing usable is left', () => {
    expect(titleFromFilename('IMG_1234.jpg')).toBe('')
    expect(titleFromFilename('a.pdf')).toBe('')
  })

  it('respects the title length ceiling', () => {
    const long = `${'x'.repeat(400)}.pdf`
    expect(titleFromFilename(long)).toHaveLength(180)
  })

  it('leaves a filename without an extension alone', () => {
    expect(titleFromFilename('Operating Systems revision')).toBe(
      'Operating Systems revision',
    )
  })
})
