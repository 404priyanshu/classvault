import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { roleLabelOf } from "@/lib/server/notes";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonError("UNAUTHORIZED", "Not signed in.", 401);
    }
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      roleLabel: roleLabelOf(user),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
