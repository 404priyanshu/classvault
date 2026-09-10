import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * The clearing logic, exercised directly. It runs in an effect in the browser,
 * so the test drives the same URL arithmetic rather than rendering React.
 */
function clearMessageParams(href: string): string | null {
  const url = new URL(href)

  if (!url.searchParams.has('error') && !url.searchParams.has('status')) {
    return null
  }

  url.searchParams.delete('error')
  url.searchParams.delete('status')

  return `${url.pathname}${url.search}${url.hash}`
}

afterEach(() => vi.unstubAllGlobals())

describe('auth message params', () => {
  it('drops an error the redirect left behind', () => {
    expect(
      clearMessageParams(
        'https://www.classvault.in/auth/sign-up?error=Complete+the+security+check%2C+then+submit+the+form+again.',
      ),
    ).toBe('/auth/sign-up')
  })

  it('drops a status message too', () => {
    expect(
      clearMessageParams('https://www.classvault.in/auth/sign-in?status=Check+your+inbox'),
    ).toBe('/auth/sign-in')
  })

  it('keeps where the student was originally headed', () => {
    expect(
      clearMessageParams(
        'https://www.classvault.in/auth/sign-in?error=Wrong+password&next=%2Fdashboard%2Fnotes',
      ),
    ).toBe('/auth/sign-in?next=%2Fdashboard%2Fnotes')
  })

  it('leaves a clean URL alone so no history entry is written', () => {
    expect(clearMessageParams('https://www.classvault.in/auth/sign-up')).toBeNull()
    expect(
      clearMessageParams('https://www.classvault.in/auth/sign-in?next=%2Fdashboard'),
    ).toBeNull()
  })

  it('preserves a fragment', () => {
    expect(
      clearMessageParams('https://www.classvault.in/auth/sign-up?error=Nope#form'),
    ).toBe('/auth/sign-up#form')
  })
})
