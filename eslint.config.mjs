import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  // supabase/.temp holds files the CLI writes while the local stack runs —
  // among them a bundled edge-runtime entrypoint that trips a hundred style
  // rules. It is gitignored, but ESLint walks it anyway, so `npm run lint`
  // fails for anyone who has started the stack.
  globalIgnores(['.next/**', 'out/**', 'next-env.d.ts', 'supabase/.temp/**']),
])
