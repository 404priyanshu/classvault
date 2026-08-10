const TURNSTILE_TOKEN_MAX_LENGTH = 4096

export function getTurnstileSiteKey() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  return siteKey || null
}

export function isCaptchaEnabled() {
  return getTurnstileSiteKey() !== null
}

export function readCaptchaToken(formData: FormData) {
  if (!isCaptchaEnabled()) {
    return undefined
  }

  const value = formData.get('captchaToken')

  if (typeof value !== 'string') {
    return null
  }

  const token = value.trim()

  if (!token || token.length > TURNSTILE_TOKEN_MAX_LENGTH) {
    return null
  }

  return token
}
