import { describe, expect, it } from 'vitest'
import {
  emailMatchesUniversity,
  normalizeCourse,
} from '@/components/onboarding/helpers'

describe('normalizeCourse', () => {
  it('maps common spellings onto the supported degrees', () => {
    expect(normalizeCourse('MCA')).toBe('MCA')
    expect(normalizeCourse(' bca ')).toBe('BCA')
    expect(normalizeCourse('B.Tech')).toBe('B.Tech')
    expect(normalizeCourse('btech')).toBe('B.Tech')
    expect(normalizeCourse('M Tech')).toBe('M.Tech')
  })

  it('returns empty for unsupported courses', () => {
    expect(normalizeCourse('PhD')).toBe('')
    expect(normalizeCourse('')).toBe('')
  })
})

describe('emailMatchesUniversity', () => {
  const university = {
    city: 'Greater Noida',
    domains: ['bennett.edu.in'],
    id: 1,
    name: 'Bennett University',
    shortName: 'Bennett',
    state: 'Uttar Pradesh',
  }

  it('matches exact and subdomain academic emails', () => {
    expect(emailMatchesUniversity('a@bennett.edu.in', university)).toBe(true)
    expect(emailMatchesUniversity('a@mail.bennett.edu.in', university)).toBe(
      true,
    )
  })

  it('rejects lookalike domains and non-academic email', () => {
    expect(emailMatchesUniversity('a@notbennett.edu.in', university)).toBe(
      false,
    )
    expect(emailMatchesUniversity('a@gmail.com', university)).toBe(false)
  })

  it('requires a selected university', () => {
    expect(emailMatchesUniversity('a@bennett.edu.in', undefined)).toBe(false)
  })
})
