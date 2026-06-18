// Billing stubs for institutional (B2B) checkout and webhooks.
// Real Stripe integration is intentionally left as TODOs.
// The code here is safe to call in dev/prod even without keys — it returns a stub URL.

export type CheckoutPlan = "starter" | "pro" | "enterprise";

export async function createCheckoutSession(params: {
  institutionId: string;
  plan: CheckoutPlan;
  userId?: string | null;
}): Promise<{ checkoutUrl: string; sessionId?: string }> {
  const secret = envValue("STRIPE_SECRET_KEY");
  const publishable = envValue("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");

  // No real keys configured → return a deterministic stub URL (safe for pilots/dev).
  if (!secret || !publishable) {
    const url = `/billing/stub?plan=${params.plan}&institutionId=${encodeURIComponent(params.institutionId)}`;
    return { checkoutUrl: url };
  }

  // TODO(real): integrate Stripe
  // import Stripe from "stripe";
  // const stripe = new Stripe(secret, { apiVersion: "2024-06-20" });
  // const session = await stripe.checkout.sessions.create({
  //   mode: "subscription",
  //   line_items: [{ price: priceForPlan(params.plan), quantity: 1 }],
  //   success_url: `${envValue("APP_ORIGIN")}/app/review?success=1`,
  //   cancel_url: `${envValue("APP_ORIGIN")}/app/review?canceled=1`,
  //   metadata: { institutionId: params.institutionId, plan: params.plan },
  //   customer_email: /* lookup billing email from Institution */,
  // });
  // return { checkoutUrl: session.url!, sessionId: session.id };

  // Until wired, always fall back to the safe stub even if keys are present.
  const url = `/billing/stub?plan=${params.plan}&institutionId=${encodeURIComponent(params.institutionId)}`;
  return { checkoutUrl: url };
}

export async function handleStripeWebhook(
  rawBody: string,
  signature: string | null,
): Promise<{ received: true }> {
  void rawBody;
  void signature;

  const secret = envValue("STRIPE_WEBHOOK_SECRET");

  if (!secret) {
    // No webhook secret configured → reject all calls in production so that
    // deploying real Stripe logic cannot accidentally ship without verification.
    if (process.env.NODE_ENV === "production") {
      throw new WebhookNotConfiguredError(
        "STRIPE_WEBHOOK_SECRET is required to process webhook events.",
      );
    }
    // Dev/test: log and accept stub calls so local testing is unblocked.
    console.info("[billing stub] Webhook received (signature check skipped in non-production)");
    return { received: true };
  }

  // TODO(real): verify signature before processing any events
  // const stripe = new Stripe(envValue("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
  // const event = stripe.webhooks.constructEvent(rawBody, signature ?? "", secret);
  // switch (event.type) {
  //   case "checkout.session.completed": { /* update Institution.plan + status */ break; }
  //   case "invoice.paid":              { /* extend quota window */              break; }
  // }

  // Signature check is not yet implemented — reject even with a key present
  // so the TODO above cannot be silently skipped when wiring real events.
  throw new WebhookNotConfiguredError(
    "Stripe webhook handler is not yet implemented. Add signature verification before processing events.",
  );
}

export class WebhookNotConfiguredError extends Error {}

// Tiny env reader (mirrors the pattern used in storage.ts, google-oauth.ts, etc.)
// We avoid importing a broad env module to keep this file self-contained.
function envValue(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}
