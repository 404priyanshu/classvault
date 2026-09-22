#!/usr/bin/env node
/**
 * Checks .env.local against .env.example before `npm run dev` wastes an hour.
 *
 * A missing or still-placeholder variable does not crash the app; it surfaces
 * later as a sign-in that fails, a roadmap form that disables itself, or a
 * cron route that 401s. This reports all of it at once, and refuses to let a
 * laptop point at the production Supabase project by mistake.
 *
 * It never prints a value.
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const PRODUCTION_PROJECT_REF = 'hndgstbutlkjqnrxvqtm'
const PLACEHOLDERS = ['YOUR_PROJECT_REF', 'REPLACE_ME', 'REPLACE_WITH_A_LONG_RANDOM_SECRET']

function parse(file) {
  const values = new Map()
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    values.set(line.slice(0, eq).trim(), line.slice(eq + 1).trim().replace(/^["']|["']$/g, ''))
  }
  return values
}

const examplePath = join(repoRoot, '.env.example')
const localPath = join(repoRoot, '.env.local')

if (!existsSync(localPath)) {
  console.error(
    '\n.env.local is missing.\n' +
      'Run: vercel env pull .env.local --environment development\n' +
      'See docs/staging.md.\n',
  )
  process.exit(1)
}

const required = [...parse(examplePath).keys()]
const actual = parse(localPath)
const problems = []

for (const key of required) {
  const value = actual.get(key)
  if (value === undefined) {
    problems.push(`${key} is missing`)
  } else if (value === '') {
    problems.push(`${key} is empty`)
  } else if (PLACEHOLDERS.some((p) => value.includes(p))) {
    problems.push(`${key} still holds the .env.example placeholder`)
  }
}

const url = actual.get('NEXT_PUBLIC_SUPABASE_URL') ?? ''
if (url.includes(PRODUCTION_PROJECT_REF)) {
  problems.push(
    `NEXT_PUBLIC_SUPABASE_URL points at the PRODUCTION project (${PRODUCTION_PROJECT_REF}). ` +
      'Local development must use staging.',
  )
}

const siteUrl = actual.get('NEXT_PUBLIC_SITE_URL') ?? ''
if (siteUrl && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(siteUrl)) {
  problems.push(`NEXT_PUBLIC_SITE_URL is "${siteUrl}"; local development expects http://localhost:3000`)
}

for (const key of ['SUPABASE_SERVICE_ROLE_KEY', 'CRON_SECRET']) {
  if ([...actual.keys()].includes(`NEXT_PUBLIC_${key}`)) {
    problems.push(`NEXT_PUBLIC_${key} exists; server-only secrets must never be public`)
  }
}

if (problems.length > 0) {
  console.error('\n.env.local is not ready:\n')
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error('\nSee docs/staging.md.\n')
  process.exit(1)
}

console.log(`.env.local: ${required.length} variables present, pointing at ${url}`)
