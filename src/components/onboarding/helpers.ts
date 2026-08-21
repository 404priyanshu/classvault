import type { University } from './types'

export function getEmailDomain(email: string) {
  return email.toLowerCase().split('@')[1] || ''
}

export function emailMatchesUniversity(email: string, university?: University) {
  if (!university) {
    return false
  }

  const emailDomain = getEmailDomain(email)
  return university.domains.some(
    (domain) => emailDomain === domain || emailDomain.endsWith(`.${domain}`),
  )
}

export function normalizeCourse(course: string) {
  const normalized = course.trim().toLowerCase().replaceAll(' ', '')

  if (normalized.startsWith('mca')) return 'MCA'
  if (normalized.startsWith('bca')) return 'BCA'
  if (normalized.startsWith('b.tech') || normalized.startsWith('btech')) {
    return 'B.Tech'
  }
  if (normalized.startsWith('m.tech') || normalized.startsWith('mtech')) {
    return 'M.Tech'
  }

  return ''
}
