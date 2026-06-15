import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import {
  deleteCollection,
  getOwnedCollection,
  updateCollection,
} from "@/lib/server/collections";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { updateCollectionSchema } from "@/lib/server/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { collectionId } = await params;
    const collection = await getOwnedCollection(collectionId, user.id);
    if (!collection) return jsonError("NOT_FOUND", "Collection not found.", 404);
    return NextResponse.json(collection);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { collectionId } = await params;
    const input = updateCollectionSchema.parse(await request.json());
    const collection = await updateCollection(user.id, collectionId, input);
    if (!collection) return jsonError("NOT_FOUND", "Collection not found.", 404);
    return NextResponse.json(collection);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { collectionId } = await params;
    const ok = await deleteCollection(user.id, collectionId);
    if (!ok) return jsonError("NOT_FOUND", "Collection not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
