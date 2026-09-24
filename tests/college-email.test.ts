import { describe, expect, it } from 'vitest'
import { isEmailOnDomains } from '@/lib/auth/college-email'

describe('isEmailOnDomains', () => {
  const bennett = ['bennett.edu.in']

  it('accepts the campus domain and its subdomains', () => {
    expect(isEmailOnDomains('riya@bennett.edu.in', bennett)).toBe(true)
    expect(isEmailOnDomains('riya@student.bennett.edu.in', bennett)).toBe(true)
    expect(isEmailOnDomains('Riya@Bennett.EDU.IN', bennett)).toBe(true)
  })

  it('refuses lookalikes and other domains', () => {
    expect(isEmailOnDomains('riya@notbennett.edu.in', bennett)).toBe(false)
    expect(isEmailOnDomains('riya@bennett.edu.in.evil.com', bennett)).toBe(false)
    expect(isEmailOnDomains('riya@gmail.com', bennett)).toBe(false)
    expect(isEmailOnDomains('no-at-sign', bennett)).toBe(false)
  })
})
