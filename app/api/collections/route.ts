import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/server/auth";
import { createCollection, listCollections } from "@/lib/server/collections";
import { handleRouteError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { createCollectionSchema } from "@/lib/server/validation";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    return NextResponse.json({ items: await listCollections(user.id) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    await assertRateLimit({
      key: requestKey(request, "collection-create", user.id),
      limit: 50,
      windowMs: 60 * 60 * 1000,
    });
    const input = createCollectionSchema.parse(await request.json());
    const collection = await createCollection(user.id, input.title, input.isPublic);
    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
