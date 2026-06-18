import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { handleStripeWebhook, WebhookNotConfiguredError } from "@/lib/server/billing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const sig = request.headers.get("stripe-signature");
    await handleStripeWebhook(raw, sig);
    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof WebhookNotConfiguredError) {
      // Return 400 so Stripe retries are not silently swallowed as successes.
      return jsonError("WEBHOOK_NOT_CONFIGURED", error.message, 400);
    }
    return handleRouteError(error);
  }
}
