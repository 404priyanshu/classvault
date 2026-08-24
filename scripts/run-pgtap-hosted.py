#!/usr/bin/env python3
"""Run a pgTAP suite against the linked hosted project and print full TAP output.

The Supabase query API returns only the final statement's rows, so this
wrapper redirects every assertion's text into a temp table and aggregates
it into one result set. Requires the Supabase CLI access token in the
macOS keychain (service "Supabase CLI").
"""
import json
import re
import subprocess
import sys
import urllib.request

PROJECT_REF = "hndgstbutlkjqnrxvqtm"
API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"


def read_token() -> str:
    return subprocess.run(
        ["security", "find-generic-password", "-s", "Supabase CLI", "-w"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()


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


def main() -> None:
    path = sys.argv[1]
    sql = transform(open(path).read())
    req = urllib.request.Request(
        API_URL,
        data=json.dumps({"query": sql}).encode(),
        headers={
            "Authorization": f"Bearer {read_token()}",
            "Content-Type": "application/json",
            "User-Agent": "SupabaseCLI/2.110.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            payload = json.load(res)
    except urllib.error.HTTPError as err:
        print(f"HTTP {err.code}: {err.read().decode()[:1200]}")
        sys.exit(1)

    rows = payload if isinstance(payload, list) else [payload]
    output = ""
    for row in rows:
        if isinstance(row, dict) and "tap_output" in row:
            output = row["tap_output"] or ""
    print(output)
    failed = "# Looks like you failed" in output
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
