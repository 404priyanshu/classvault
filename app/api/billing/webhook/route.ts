import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/server/http";
import { handleStripeWebhook } from "@/lib/server/billing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // Stripe sends the raw body for signature verification.
    // In a real handler we would pass the raw text + stripe-signature header.
    const raw = await request.text();
    const sig = request.headers.get("stripe-signature");
    await handleStripeWebhook(raw, sig);
    return NextResponse.json({ received: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
