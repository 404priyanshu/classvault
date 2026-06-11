import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { checkR2Access, getR2Config } from "@/lib/server/storage";

export async function GET() {
  const checks = {
    database: false,
    r2Configured: false,
    r2Reachable: null as boolean | null,
  };

  try {
    await db.user.count();
    checks.database = true;
  } catch {
    checks.database = false;
  }

  checks.r2Configured = Boolean(getR2Config());
  if (checks.r2Configured) {
    try {
      checks.r2Reachable = Boolean(await checkR2Access());
    } catch {
      checks.r2Reachable = false;
    }
  }

  const ok = checks.database && (!checks.r2Configured || checks.r2Reachable === true);
  return NextResponse.json(
    {
      ok,
      service: "classvault-api",
      checks,
    },
    { status: ok ? 200 : 503 },
  );
}
