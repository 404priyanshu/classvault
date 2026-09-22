import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

// The guard is the only thing standing between `npm run db:push` and live
// student data, so it is tested as it is actually invoked: as a process whose
// exit code decides whether the Supabase CLI runs at all.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const script = join(repoRoot, 'scripts/supabase-target.mjs')
const PRODUCTION_REF = 'hndgstbutlkjqnrxvqtm'
const STAGING_REF = 'stagingrefabcdefghij'

function run(args: string[], env: Record<string, string | undefined> = {}) {
  const result = spawnSync(process.execPath, [script, ...args], {
    env: { ...process.env, SUPABASE_PROJECT_REF: undefined, ...env },
    encoding: 'utf8',
  })

  return { code: result.status, stdout: result.stdout, stderr: result.stderr }
}

describe('supabase-target guard', () => {
  it('refuses a staging-only command when production is linked', () => {
    const result = run(['--require-staging'], { SUPABASE_PROJECT_REF: PRODUCTION_REF })

    expect(result.code).toBe(1)
    expect(result.stderr).toContain('production')
  })

  it('allows a staging-only command when staging is linked', () => {
    const result = run(['--require-staging'], { SUPABASE_PROJECT_REF: STAGING_REF })

    expect(result.code).toBe(0)
    expect(result.stdout.trim()).toBe(STAGING_REF)
  })

  it('refuses rather than guessing when no project is linked', () => {
    const result = run(['--require-staging'], { SUPABASE_PROJECT_REF: '' })

    expect(result.code).toBe(1)
    expect(result.stderr).toContain('No Supabase project is linked')
  })

  // The opt-in exists so a reviewed migration can be promoted; it has to be
  // explicit, and it has to say so on the way past.
  it('permits production only with the explicit opt-in, and warns', () => {
    const result = run(['--require-staging'], {
      SUPABASE_PROJECT_REF: PRODUCTION_REF,
      ALLOW_PRODUCTION_DB_WRITE: '1',
    })

    expect(result.code).toBe(0)
    expect(result.stderr).toContain('PRODUCTION')
  })

  it('keeps the production-only script from running against staging', () => {
    const result = run(['--require-production'], { SUPABASE_PROJECT_REF: STAGING_REF })

    expect(result.code).toBe(1)
  })
})
