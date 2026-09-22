import { spawnSync } from 'node:child_process'
import { mkdtempSync, copyFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

// check-env.mjs reads .env.local relative to its own location, so each case runs
// against a throwaway copy of the repository's script and template rather than
// the developer's real environment file.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const PRODUCTION_REF = 'hndgstbutlkjqnrxvqtm'

const created: string[] = []

afterEach(() => {
  while (created.length > 0) rmSync(created.pop()!, { force: true, recursive: true })
})

function runWith(envLocal: string) {
  const sandbox = mkdtempSync(join(tmpdir(), 'classvault-env-'))
  created.push(sandbox)
  mkdirSync(join(sandbox, 'scripts'))
  copyFileSync(join(repoRoot, 'scripts/check-env.mjs'), join(sandbox, 'scripts/check-env.mjs'))
  copyFileSync(join(repoRoot, '.env.example'), join(sandbox, '.env.example'))
  writeFileSync(join(sandbox, '.env.local'), envLocal)

  const result = spawnSync(process.execPath, [join(sandbox, 'scripts/check-env.mjs')], {
    encoding: 'utf8',
  })
  return { code: result.status, stdout: result.stdout, stderr: result.stderr }
}

function envFile(overrides: Record<string, string> = {}) {
  const base: Record<string, string> = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://stagingrefabcdefghij.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_staging',
    SUPABASE_SERVICE_ROLE_KEY: 'service_role_staging',
    CRON_SECRET: 'a-long-random-staging-secret',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
  }
  return Object.entries({ ...base, ...overrides })
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

describe('check-env', () => {
  it('accepts a complete staging environment', () => {
    const result = runWith(envFile())

    expect(result.code).toBe(0)
  })

  it('rejects an environment pointing at the production project', () => {
    const result = runWith(
      envFile({ NEXT_PUBLIC_SUPABASE_URL: `https://${PRODUCTION_REF}.supabase.co` }),
    )

    expect(result.code).toBe(1)
    expect(result.stderr).toContain('PRODUCTION')
  })

  it('names every missing variable at once rather than the first', () => {
    const result = runWith('NEXT_PUBLIC_SUPABASE_URL=https://stagingrefabcdefghij.supabase.co')

    expect(result.code).toBe(1)
    expect(result.stderr).toContain('CRON_SECRET is missing')
    expect(result.stderr).toContain('SUPABASE_SERVICE_ROLE_KEY is missing')
  })

  it('rejects a variable still holding its .env.example placeholder', () => {
    const result = runWith(envFile({ CRON_SECRET: 'REPLACE_WITH_A_LONG_RANDOM_SECRET' }))

    expect(result.code).toBe(1)
    expect(result.stderr).toContain('placeholder')
  })

  it('rejects a server-only secret exposed through NEXT_PUBLIC_', () => {
    const result = runWith(`${envFile()}\nNEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=leaked`)

    expect(result.code).toBe(1)
    expect(result.stderr).toContain('never be public')
  })

  it('rejects a production site URL in a local environment file', () => {
    const result = runWith(envFile({ NEXT_PUBLIC_SITE_URL: 'https://www.classvault.in' }))

    expect(result.code).toBe(1)
    expect(result.stderr).toContain('NEXT_PUBLIC_SITE_URL')
  })

  it('reports a missing .env.local instead of passing silently', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'classvault-env-'))
    created.push(sandbox)
    mkdirSync(join(sandbox, 'scripts'))
    copyFileSync(join(repoRoot, 'scripts/check-env.mjs'), join(sandbox, 'scripts/check-env.mjs'))
    copyFileSync(join(repoRoot, '.env.example'), join(sandbox, '.env.example'))

    const result = spawnSync(process.execPath, [join(sandbox, 'scripts/check-env.mjs')], {
      encoding: 'utf8',
    })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('.env.local is missing')
  })
})
