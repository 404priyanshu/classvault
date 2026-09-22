#!/usr/bin/env node
/**
 * Resolves which hosted Supabase project the CLI is currently linked to and
 * refuses to let a destructive command run against production by accident.
 *
 * One hosted project used to back both local development and the deployment,
 * so `supabase db push` from a laptop changed production data. Every schema
 * command now goes through this guard instead of trusting whoever is at the
 * keyboard to remember which ref is linked.
 *
 * Usage:
 *   node scripts/supabase-target.mjs                      print the linked ref
 *   node scripts/supabase-target.mjs --require-linked     fail when unlinked
 *   node scripts/supabase-target.mjs --require-staging    fail on production
 *   node scripts/supabase-target.mjs --require-production fail off production
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

// The shared production database. Nothing in this repository may push, reset,
// or seed against it without an explicit opt-in.
export const PRODUCTION_PROJECT_REF = 'hndgstbutlkjqnrxvqtm'

// Set when a reviewed production migration is being promoted deliberately.
const PRODUCTION_OPT_IN = 'ALLOW_PRODUCTION_DB_WRITE'

export function readLinkedRef() {
  const fromEnv = process.env.SUPABASE_PROJECT_REF?.trim()
  if (fromEnv) return fromEnv

  try {
    return readFileSync(join(repoRoot, 'supabase/.temp/project-ref'), 'utf8').trim()
  } catch {
    return null
  }
}

export function isProduction(ref) {
  return ref === PRODUCTION_PROJECT_REF
}

function fail(message) {
  process.stderr.write(`\n${message}\n\n`)
  process.exit(1)
}

function main() {
  const flags = new Set(process.argv.slice(2))
  const ref = readLinkedRef()

  if (!ref) {
    if (flags.has('--require-linked') || flags.has('--require-staging') || flags.has('--require-production')) {
      fail(
        'No Supabase project is linked.\n' +
          'Run `npm run db:link -- <project-ref>` first, or set SUPABASE_PROJECT_REF.\n' +
          'See docs/staging.md.',
      )
    }
    process.stdout.write('unlinked\n')
    return
  }

  if (flags.has('--require-staging') && isProduction(ref)) {
    if (process.env[PRODUCTION_OPT_IN] === '1') {
      process.stderr.write(
        `\nWARNING: running against PRODUCTION (${ref}) because ${PRODUCTION_OPT_IN}=1.\n\n`,
      )
    } else {
      fail(
        `Refusing to run: the linked project is production (${ref}).\n` +
          'Link the staging project instead:\n' +
          '  npm run db:link -- <staging-project-ref>\n\n' +
          `To promote a reviewed migration to production on purpose, re-run with ${PRODUCTION_OPT_IN}=1.`,
      )
    }
  }

  if (flags.has('--require-production') && !isProduction(ref)) {
    fail(`Refusing to run: expected production (${PRODUCTION_PROJECT_REF}) but the linked project is ${ref}.`)
  }

  process.stdout.write(`${ref}\n`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
