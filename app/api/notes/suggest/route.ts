import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { suggestNotes } from "@/lib/server/notes";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { suggestQuerySchema } from "@/lib/server/validation";

// Typeahead autocomplete: a few best fuzzy matches for the search box. Public
// (PUBLISHED notes only), rate-limited because it fires on each keystroke.
export async function GET(request: NextRequest) {
  try {
    const query = suggestQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    const user = await getCurrentUser();
    await assertRateLimit({
      key: requestKey(request, "note-suggest", user?.id ?? null),
      limit: 240,
      windowMs: 60 * 1000,
    });
    const items = await suggestNotes(query.q, query.limit);
    return NextResponse.json({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
