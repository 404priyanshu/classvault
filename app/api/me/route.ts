import { NextResponse } from "next/server";
import { getCurrentUser, requireCurrentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { roleLabelOf } from "@/lib/server/notes";
import { profileUpdateSchema } from "@/lib/server/validation";

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
      role: user.role,
      department: user.department,
      semester: user.semester,
      roleLabel: roleLabelOf(user),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const input = profileUpdateSchema.parse(await request.json());
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: input.name,
        department: input.department ?? null,
        semester: input.semester ?? null,
      },
    });
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      department: updated.department,
      semester: updated.semester,
      roleLabel: roleLabelOf(updated),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
