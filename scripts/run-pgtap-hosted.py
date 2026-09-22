#!/usr/bin/env python3
"""Run pgTAP suites against the linked hosted project and print full TAP output.

The Supabase query API returns only the final statement's rows, so this
wrapper redirects every assertion's text into a temp table and aggregates
it into one result set.

The target project is whichever ref the Supabase CLI is linked to
(supabase/.temp/project-ref), overridable with SUPABASE_PROJECT_REF. It is
deliberately not hard-coded: these suites belong on staging, and running them
against production would create and roll back rows in live tables. Production
requires ALLOW_PRODUCTION_DB_WRITE=1.

Auth comes from SUPABASE_ACCESS_TOKEN, else the Supabase CLI's macOS keychain
entry (service "Supabase CLI").

Usage:
    python3 scripts/run-pgtap-hosted.py supabase/tests/notes_rls.sql [more.sql ...]
    python3 scripts/run-pgtap-hosted.py --all
"""
import json
import os
import pathlib
import re
import subprocess
import sys
import urllib.error
import urllib.request

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
TESTS_DIR = REPO_ROOT / "supabase" / "tests"
LINKED_REF_FILE = REPO_ROOT / "supabase" / ".temp" / "project-ref"

# Kept in sync with PRODUCTION_PROJECT_REF in scripts/supabase-target.mjs.
PRODUCTION_PROJECT_REF = "hndgstbutlkjqnrxvqtm"
PRODUCTION_OPT_IN = "ALLOW_PRODUCTION_DB_WRITE"


def resolve_project_ref() -> str:
    ref = os.environ.get("SUPABASE_PROJECT_REF", "").strip()
    if not ref:
        try:
            ref = LINKED_REF_FILE.read_text().strip()
        except OSError:
            raise SystemExit(
                "No Supabase project is linked.\n"
                "Run `npm run db:link -- <staging-project-ref>` first, "
                "or set SUPABASE_PROJECT_REF.\n"
                "See docs/staging.md."
            )

    if ref == PRODUCTION_PROJECT_REF and os.environ.get(PRODUCTION_OPT_IN) != "1":
        raise SystemExit(
            f"Refusing to run: the linked project is production ({ref}).\n"
            "These suites create and roll back rows; run them on staging.\n"
            f"Override deliberately with {PRODUCTION_OPT_IN}=1."
        )

    return ref


def read_token() -> str:
    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip()
    if token:
        return token

    result = subprocess.run(
        ["security", "find-generic-password", "-s", "Supabase CLI", "-w"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0 or not result.stdout.strip():
        raise SystemExit(
            "No Supabase access token. Run `npx supabase login`, "
            "or set SUPABASE_ACCESS_TOKEN."
        )
    return result.stdout.strip()


def transform(sql: str) -> str:
    marker = "create extension if not exists pgtap with schema extensions;"
    if marker not in sql:
        raise SystemExit("suite is missing the pgtap extension marker")
    sql = sql.replace(
        marker,
        marker
        + "\ncreate temp table tap_log (ord serial primary key, line text);"
        + "\ngrant all on tap_log to authenticated, anon, service_role;"
        + "\ngrant all on sequence tap_log_ord_seq to authenticated, anon, service_role;",
        1,
    )
    sql = re.sub(
        r"(?m)^select extensions\.",
        "insert into tap_log (line) select extensions.",
        sql,
    )
    sql = sql.replace(
        "select * from extensions.finish();",
        "insert into tap_log (line)\n"
        "select * from extensions.finish();\n\n"
        "select string_agg(line, chr(10) order by ord) as tap_output\n"
        "from tap_log;",
    )
    return sql


def run_suite(path: pathlib.Path, api_url: str, token: str) -> bool:
    sql = transform(path.read_text())
    req = urllib.request.Request(
        api_url,
        data=json.dumps({"query": sql}).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "SupabaseCLI/2.110.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as res:
            payload = json.load(res)
    except urllib.error.HTTPError as err:
        print(f"HTTP {err.code}: {err.read().decode()[:1200]}")
        return False

    rows = payload if isinstance(payload, list) else [payload]
    output = ""
    for row in rows:
        if isinstance(row, dict) and "tap_output" in row:
            output = row["tap_output"] or ""
    print(output)
    return "# Looks like you failed" not in output and output.strip() != ""


def main() -> None:
    args = sys.argv[1:]
    if not args:
        raise SystemExit(__doc__)

    if args == ["--all"]:
        paths = sorted(TESTS_DIR.glob("*.sql"))
    else:
        paths = [pathlib.Path(arg) for arg in args]

    ref = resolve_project_ref()
    api_url = f"https://api.supabase.com/v1/projects/{ref}/database/query"
    token = read_token()

    print(f"# project: {ref}")
    failures = []
    for path in paths:
        print(f"\n# suite: {path}")
        if not run_suite(path, api_url, token):
            failures.append(path.name)

    if failures:
        print(f"\n# FAILED suites: {', '.join(failures)}")
        sys.exit(1)
    print(f"\n# all {len(paths)} suite(s) passed")


if __name__ == "__main__":
    main()
