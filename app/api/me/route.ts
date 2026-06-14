import { NextResponse } from "next/server";
import { getCurrentUser, requireCurrentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { serializeUser } from "@/lib/server/users";
import { profileUpdateSchema } from "@/lib/server/validation";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonError("UNAUTHORIZED", "Not signed in.", 401);
    }
    return NextResponse.json(serializeUser(user));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const input = profileUpdateSchema.parse(await request.json());
    const data: {
      name: string;
      department: string | null;
      semester: string | null;
      age?: number | null;
      subjectPreferences?: string[];
      onboardingCompletedAt?: Date;
    } = {
      name: input.name,
      department: input.department ?? null,
      semester: input.semester ?? null,
    };
    if ("age" in input) {
      data.age = input.age ?? null;
    }
    if (input.subjectPreferences) {
      data.subjectPreferences = Array.from(new Set(input.subjectPreferences));
    }
    if (input.completeOnboarding) {
      data.onboardingCompletedAt = new Date();
    }
    const updated = await db.user.update({
      where: { id: user.id },
      data,
    });
    return NextResponse.json(serializeUser(updated));
  } catch (error) {
    return handleRouteError(error);
  }
}
