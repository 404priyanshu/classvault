import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET() {
  const noteCount = await db.note.count();
  return NextResponse.json({ ok: true, service: "classvault-api", noteCount });
}
