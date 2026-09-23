import { randomUUID } from 'node:crypto'
import { loadEnvConfig } from '@next/env'
import { expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../src/lib/supabase/database.types'
import { pdfWithText } from './pdf'

// The signed-in suite drives the app against the LOCAL Supabase stack that
// `npm run local:bootstrap` starts. It refuses anything else: these specs
// create accounts, publish notes, and open rooms, and none of that belongs in
// a hosted project.
loadEnvConfig(process.cwd())

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export function assertLocalStack() {
  const host = url ? new URL(url).hostname : ''
  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new Error(
      `The signed-in suite only runs against the local Supabase stack, not ${host || 'an unset URL'}. Run npm run local:bootstrap.`,
    )
  }
}

export const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324'
export const BENNETT_DOMAIN = 'bennett.edu.in'

export function adminClient() {
  assertLocalStack()
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type Student = {
  displayName: string
  email: string
  id: string
  password: string
}

/** A unique address, so reruns never collide with rows an earlier run left. */
export function uniqueEmail(label: string, domain = BENNETT_DOMAIN) {
  return `e2e-${label}-${randomUUID().slice(0, 8)}@${domain}`
}

/**
 * A confirmed Bennett student who has finished onboarding.
 *
 * Built through the same RPC the onboarding form calls, signed in as the
 * student, so the membership comes out `verified` for the real reason (a
 * confirmed academic address) rather than by writing the row directly.
 */
export async function createStudent(label: string): Promise<Student> {
  const admin = adminClient()
  const email = uniqueEmail(label)
  const password = `E2e-${randomUUID()}`
  const displayName = `E2E ${label} ${randomUUID().slice(0, 4)}`

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
  })
  if (createError || !created.user) {
    throw new Error(`Could not create ${label}: ${createError?.message}`)
  }

  const { data: university } = await admin
    .from('universities')
    .select('id')
    .eq('name', 'Bennett University')
    .single()
  if (!university) throw new Error('The local stack has no Bennett University row.')

  const student = createClient<Database>(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: signInError } = await student.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError) throw new Error(`Could not sign in ${label}: ${signInError.message}`)

  const { error: onboardingError } = await student.rpc('complete_student_onboarding', {
    p_course: 'B.Tech',
    p_display_name: displayName,
    p_graduation_year: new Date().getFullYear() + 2,
    p_primary_goal: 'ace_exams',
    p_study_preference: 'study_group',
    p_university_id: university.id,
  })
  if (onboardingError) {
    throw new Error(`Could not onboard ${label}: ${onboardingError.message}`)
  }

  return { displayName, email, id: created.user.id, password }
}

/**
 * Waits for Cloudflare's always-passes test key to hand the form its token.
 * Submitting before then is refused with "Complete the security check".
 */
export async function passCaptcha(page: Page) {
  // Sign-in shows "Verified"; the sign-up journey says "Browser verified."
  await expect(page.getByText(/^(Browser verified\.|Verified)$/)).toBeVisible({
    timeout: 15_000,
  })
}

/** Signs in through the real form, the way a student does. */
export async function signIn(page: Page, student: Student, next = '/dashboard') {
  await page.goto(`/auth/sign-in?next=${encodeURIComponent(next)}`)
  await page.getByLabel('Email', { exact: true }).fill(student.email)
  await page.getByLabel('Password', { exact: true }).fill(student.password)
  await passCaptcha(page)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${next.replace(/\//g, '\\/')}(\\?|$)`))
}

/** Usage events the app recorded for one student, oldest first. */
export async function usageEventsFor(studentId: string) {
  const { data, error } = await adminClient()
    .from('usage_events' as never)
    .select('event, note_id, found_results')
    .eq('user_id', studentId)
    .order('occurred_at')
  if (error) throw new Error(`Could not read usage events: ${error.message}`)
  return (data ?? []) as unknown as Array<{
    event: string
    found_results: boolean | null
    note_id: string | null
  }>
}

/**
 * The confirmation link from the newest message Mailpit holds for `email`.
 *
 * Polls because GoTrue sends after the sign-up response returns.
 */
export async function confirmationLinkFor(email: string) {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    const search = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`,
    ).then((response) => response.json() as Promise<{ messages: { ID: string }[] }>)
    const id = search.messages?.[0]?.ID
    if (id) {
      const message = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`).then(
        (response) => response.json() as Promise<{ HTML: string }>,
      )
      const link = message.HTML.match(/href="([^"]*\/auth\/v1\/verify[^"]*)"/)?.[1]
      if (link) return link.replace(/&amp;/g, '&')
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`No confirmation email reached Mailpit for ${email}.`)
}

/**
 * Follows a GoTrue verify link to where it sends the browser, on the server
 * under test.
 *
 * Local GoTrue only allows redirects to the dev-server origin in
 * supabase/config.toml (localhost:3000), and the app bakes that origin into
 * the link. The suite serves on its own port, so the redirect is read here and
 * re-pointed. The PKCE verifier stays in the browser's cookie, so the code
 * exchange at /auth/confirm is still the real one.
 */
export async function confirmationTarget(link: string, baseURL: string) {
  const response = await fetch(link, { redirect: 'manual' })
  const location = response.headers.get('location')
  if (!location) {
    throw new Error(`GoTrue did not redirect the confirmation (${response.status}).`)
  }
  return location.replace(/^http:\/\/[^/]+/, baseURL)
}

/** Publishes a one-page PDF note through the real upload form. */
export async function publishNote(
  page: Page,
  { subject, text, title }: { subject: string; text: string; title: string },
) {
  await page.goto('/dashboard/notes/new')
  // A file set before hydration lands in the input but never reaches React's
  // state, so retry until the form shows it has the file.
  await expect(async () => {
    await page.locator('input[type="file"]').setInputFiles({
      buffer: pdfWithText(text),
      mimeType: 'application/pdf',
      name: 'note.pdf',
    })
    await expect(page.getByText('note.pdf', { exact: true })).toBeVisible({
      timeout: 1_000,
    })
  }).toPass({ timeout: 15_000 })
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Subject').fill(subject)
  await page.getByLabel('Note type').selectOption('lecture_notes')
  await page.getByRole('button', { name: 'Publish note' }).click()
  // The dashboard drops its ?status= notice from the address once shown.
  await expect(page).toHaveURL(/\/dashboard(\?|$)/, { timeout: 20_000 })
}
