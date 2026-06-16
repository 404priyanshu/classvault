import { NextResponse, type NextRequest } from "next/server";
import { AuthError, requireRole } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import { createCheckoutSession } from "@/lib/server/billing";
import { createCheckoutSessionSchema } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("ADMIN", "MODERATOR");
    const institutionIdFromUser = (user as { institution?: { id: string } | null }).institution?.id ?? null;

    await assertRateLimit({
      key: requestKey(request, "billing-checkout", user.id, institutionIdFromUser),
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });

    const input = createCheckoutSessionSchema.parse(await request.json());
    if (user.role !== "ADMIN" && input.institutionId !== institutionIdFromUser) {
      throw new AuthError("You do not have access to this institution.");
    }

    const result = await createCheckoutSession({
      institutionId: input.institutionId,
      plan: input.plan,
      userId: user.id,
    });

    return NextResponse.json({ checkoutUrl: result.checkoutUrl }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
