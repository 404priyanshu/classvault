import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { checkS3Access, getS3Config } from "@/lib/server/storage";

export async function GET() {
  const checks = {
    database: false,
    s3Configured: false,
    s3Reachable: null as boolean | null,
  };

  try {
    await db.user.count();
    checks.database = true;
  } catch {
    checks.database = false;
  }

  checks.s3Configured = Boolean(getS3Config());
  if (checks.s3Configured) {
    try {
      checks.s3Reachable = Boolean(await checkS3Access());
    } catch {
      checks.s3Reachable = false;
    }
  }

  const ok = checks.database && (!checks.s3Configured || checks.s3Reachable === true);
  return NextResponse.json(
    {
      ok,
      service: "classvault-api",
      checks,
    },
    { status: ok ? 200 : 503 },
  );
}
