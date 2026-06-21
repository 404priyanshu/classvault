import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { handleRouteError, jsonError } from "@/lib/server/http";
import {
  deleteSavedRoadmap,
  getSavedRoadmap,
  updateSavedRoadmapProgress,
} from "@/lib/server/saved-roadmaps";
import { updateSavedRoadmapSchema } from "@/lib/server/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roadmapId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { roadmapId } = await params;
    const roadmap = await getSavedRoadmap(user.id, roadmapId);
    if (!roadmap) {
      return jsonError("NOT_FOUND", "Roadmap not found.", 404);
    }
    return NextResponse.json(roadmap);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roadmapId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { roadmapId } = await params;
    const input = updateSavedRoadmapSchema.parse(await request.json());
    const roadmap = await updateSavedRoadmapProgress(user.id, roadmapId, input.plan);
    if (!roadmap) {
      return jsonError("NOT_FOUND", "Roadmap not found.", 404);
    }
    return NextResponse.json(roadmap);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ roadmapId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { roadmapId } = await params;
    const ok = await deleteSavedRoadmap(user.id, roadmapId);
    if (!ok) {
      return jsonError("NOT_FOUND", "Roadmap not found.", 404);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
