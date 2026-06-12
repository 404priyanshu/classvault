type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey?: string;
};

type ResendResponse = {
  id?: string;
  message?: string;
  name?: string;
};

const RESEND_EMAIL_URL = "https://api.resend.com/emails";

function envValue(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export class EmailDeliveryError extends Error {
  constructor(readonly code: "not_configured" | "send_failed") {
    super(code);
  }
}

export function isEmailDeliveryConfigured() {
  return Boolean(envValue("RESEND_API_KEY") && envValue("EMAIL_FROM"));
}

export async function sendTransactionalEmail(input: SendEmailInput) {
  const apiKey = envValue("RESEND_API_KEY");
  const from = envValue("EMAIL_FROM");

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        [
          "[ClassVault email dev fallback]",
          `To: ${input.to}`,
          `Subject: ${input.subject}`,
          input.text,
        ].join("\n"),
      );
      return { id: "dev-console" };
    }
    throw new EmailDeliveryError("not_configured");
  }

  const response = await fetch(RESEND_EMAIL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });
  const body = (await response.json().catch(() => null)) as ResendResponse | null;
  if (!response.ok) {
    console.error("Email delivery failed", body ?? { status: response.status });
    throw new EmailDeliveryError("send_failed");
  }

  return { id: body?.id ?? null };
}
