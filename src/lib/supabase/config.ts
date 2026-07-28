const PLACEHOLDER_PROJECT_REF = 'YOUR_PROJECT_REF'
const PLACEHOLDER_PUBLISHABLE_KEY = 'REPLACE_ME'

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (
    !url ||
    !publishableKey ||
    url.includes(PLACEHOLDER_PROJECT_REF) ||
    publishableKey.includes(PLACEHOLDER_PUBLISHABLE_KEY)
  ) {
    throw new Error(
      'Supabase is not configured. Add the project URL and publishable key to .env.local.',
    )
  }

  return { publishableKey, url }
}

export function isSupabaseConfigured() {
  try {
    getSupabaseConfig()
    return true
  } catch {
    return false
  }
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  )
}
