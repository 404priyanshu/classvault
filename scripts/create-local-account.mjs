#!/usr/bin/env node
/**
 * Creates a signed-in-ready student on the LOCAL Supabase stack.
 *
 * Production accounts do not exist in the local database, and local sign-up
 * means a trip through Mailpit and five onboarding steps before the dashboard
 * appears. This makes a confirmed, onboarded Bennett student in one command,
 * the same way the signed-in suite does: the membership comes out `verified`
 * because the address is a confirmed academic one, via the real onboarding
 * RPC, not by writing the row.
 *
 * Rerunning is safe: an existing account gets its password reset and is
 * onboarded if it is not already.
 *
 * Usage:
 *   npm run local:account
 *   npm run local:account -- --email me@bennett.edu.in --password secret123
 *   npm run local:account -- --admin    also grant platform_admin (Moderation, Usage)
 *
 * Refuses any Supabase URL that is not local.
 */
import { parseArgs } from 'node:util'
import nextEnv from '@next/env'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_EMAIL = 'dev@bennett.edu.in'
const DEFAULT_PASSWORD = 'classvault-dev'

function fail(message) {
  process.stderr.write(`\n${message}\n\n`)
  process.exit(1)
}

const { values: args } = parseArgs({
  options: {
    admin: { type: 'boolean', default: false },
    email: { type: 'string', default: DEFAULT_EMAIL },
    name: { type: 'string', default: 'Dev Student' },
    password: { type: 'string', default: DEFAULT_PASSWORD },
  },
})

nextEnv.loadEnvConfig(process.cwd())

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const host = url ? new URL(url).hostname : ''
if (host !== '127.0.0.1' && host !== 'localhost') {
  fail(
    `Refusing to run: this only creates accounts on the local Supabase stack, not ${host || 'an unset URL'}.\n` +
      'Run npm run local:bootstrap first.',
  )
}
if (!publishableKey || !serviceRoleKey) {
  fail('.env.local is missing the Supabase keys. Run npm run local:bootstrap.')
}
if (args.password.length < 6) fail('The password must be at least 6 characters.')

const clientOptions = { auth: { autoRefreshToken: false, persistSession: false } }
const admin = createClient(url, serviceRoleKey, clientOptions)
const email = args.email.trim().toLowerCase()

async function findUser() {
  // Local stacks hold dozens of users at most, so one large page is enough.
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) fail(`Could not reach local Supabase: ${error.message}. Is the stack running?`)
  return data.users.find((user) => user.email === email) ?? null
}

let user = await findUser()
if (user) {
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email_confirm: true,
    password: args.password,
  })
  if (error) fail(`Could not reset ${email}: ${error.message}`)
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: args.password,
  })
  if (error || !data.user) fail(`Could not create ${email}: ${error?.message}`)
  user = data.user
}

const { data: profile } = await admin
  .from('profiles')
  .select('onboarding_completed_at')
  .eq('id', user.id)
  .maybeSingle()

if (!profile?.onboarding_completed_at) {
  const { data: university } = await admin
    .from('universities')
    .select('id')
    .eq('name', 'Bennett University')
    .single()
  if (!university) fail('The local stack has no Bennett University row. Run npm run db:reset.')

  const student = createClient(url, publishableKey, clientOptions)
  const { error: signInError } = await student.auth.signInWithPassword({
    email,
    password: args.password,
  })
  if (signInError) fail(`Could not sign in ${email}: ${signInError.message}`)

  const { error: onboardingError } = await student.rpc('complete_student_onboarding', {
    p_course: 'B.Tech',
    p_display_name: args.name,
    p_graduation_year: new Date().getFullYear() + 2,
    p_primary_goal: 'ace_exams',
    p_study_preference: 'study_group',
    p_university_id: university.id,
  })
  if (onboardingError) fail(`Could not onboard ${email}: ${onboardingError.message}`)
}

if (args.admin) {
  const { error } = await admin
    .from('platform_roles')
    .upsert({ role: 'platform_admin', user_id: user.id }, { ignoreDuplicates: true })
  if (error) fail(`Could not grant platform_admin: ${error.message}`)
}

const verified = email.endsWith('@bennett.edu.in')
process.stdout.write(
  `\nLocal account ready${args.admin ? ' (platform admin)' : ''}.\n\n` +
    `  Sign in   http://localhost:3000/auth/sign-in\n` +
    `  Email     ${email}\n` +
    `  Password  ${args.password}\n` +
    (verified ? '' : '  Campus    pending (not a bennett.edu.in address)\n') +
    '\n',
)
