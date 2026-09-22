#!/usr/bin/env bash
#
# Brings a fresh hosted Supabase staging project up to the repository schema and
# proves it with the pgTAP suites, then restores this laptop's .env.local from
# the Vercel Development environment.
#
# The script is idempotent: re-running it re-links, re-pushes (a no-op when the
# database is current), re-runs the suites, and re-pulls the environment.
#
# Everything here is automatable. The steps that are NOT — creating the project,
# configuring Auth providers, SMTP, Turnstile, and the scheduled workers — are in
# docs/staging.md, because each one needs a dashboard this repository cannot reach.
#
# Usage:
#   scripts/bootstrap-staging.sh <staging-project-ref>
#
set -euo pipefail

cd "$(dirname "$0")/.."

STAGING_REF="${1:-${SUPABASE_PROJECT_REF:-}}"
PRODUCTION_REF="hndgstbutlkjqnrxvqtm"
VERCEL_PROJECT="classvault-g8qx"
VERCEL_TEAM="404priyanshus-projects"

if [ -z "$STAGING_REF" ]; then
  echo "Usage: scripts/bootstrap-staging.sh <staging-project-ref>" >&2
  exit 1
fi

if [ "$STAGING_REF" = "$PRODUCTION_REF" ]; then
  echo "Refusing to bootstrap against the production project ($PRODUCTION_REF)." >&2
  exit 1
fi

step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

step "1/6  Checking the Supabase CLI session"
if ! npx --no-install supabase projects list >/dev/null 2>&1; then
  echo "Not signed in. Run: npx supabase login" >&2
  exit 1
fi

step "2/6  Linking this repository to $STAGING_REF"
npx --no-install supabase link --project-ref "$STAGING_REF"
node scripts/supabase-target.mjs --require-staging >/dev/null

step "3/6  Applying repository migrations to staging"
npx --no-install supabase db push
npx --no-install supabase migration list --linked

step "4/6  Running the pgTAP suites against staging"
python3 scripts/run-pgtap-hosted.py --all

step "5/6  Pulling the Development environment into .env.local"
if [ ! -f .vercel/project.json ]; then
  npx vercel link --yes --team "$VERCEL_TEAM" --project "$VERCEL_PROJECT"
fi
npx vercel env pull .env.local --environment development --yes

step "6/6  Verifying .env.local has every variable the app needs"
node scripts/check-env.mjs

printf '\n\033[1mStaging is ready.\033[0m Run `npm run dev` and work through docs/staging.md §Acceptance.\n'
