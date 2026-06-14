import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";

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

type EmailProvider = "console" | "resend" | "ses";

const RESEND_EMAIL_URL = "https://api.resend.com/emails";

function envValue(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function sesRegion() {
  return envValue("AWS_SES_REGION") ?? envValue("AWS_REGION") ?? envValue("AWS_DEFAULT_REGION");
}

function selectedProvider(): EmailProvider {
  const configured = envValue("EMAIL_PROVIDER")?.toLowerCase();
  if (configured === "resend" || configured === "ses" || configured === "console") {
    return configured;
  }
  if (envValue("RESEND_API_KEY") && envValue("EMAIL_FROM")) return "resend";
  if (envValue("EMAIL_FROM") && sesRegion()) return "ses";
  return "console";
}

export class EmailDeliveryError extends Error {
  constructor(readonly code: "not_configured" | "send_failed") {
    super(code);
  }
}

export function isEmailDeliveryConfigured() {
  const provider = selectedProvider();
  if (provider === "console") return process.env.NODE_ENV !== "production";
  if (provider === "resend") return Boolean(envValue("RESEND_API_KEY") && envValue("EMAIL_FROM"));
  return Boolean(envValue("EMAIL_FROM") && sesRegion());
}

function sendConsoleEmail(input: SendEmailInput) {
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

async function sendResendEmail(input: SendEmailInput) {
  const apiKey = envValue("RESEND_API_KEY");
  const from = envValue("EMAIL_FROM");

  if (!apiKey || !from) {
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

async function sendSesEmail(input: SendEmailInput) {
  const from = envValue("EMAIL_FROM");
  const region = sesRegion();
  const replyTo = envValue("EMAIL_REPLY_TO");
  if (!from || !region) {
    throw new EmailDeliveryError("not_configured");
  }

  try {
    const client = new SESv2Client({ region });
    const response = await client.send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: {
          ToAddresses: [input.to],
        },
        ReplyToAddresses: replyTo ? [replyTo] : undefined,
        Content: {
          Simple: {
            Subject: { Data: input.subject, Charset: "UTF-8" },
            Body: {
              Text: { Data: input.text, Charset: "UTF-8" },
              Html: { Data: input.html, Charset: "UTF-8" },
            },
          },
        },
      }),
    );
    return { id: response.MessageId ?? null };
  } catch (error) {
    console.error("SES email delivery failed", error);
    throw new EmailDeliveryError("send_failed");
  }
}

export async function sendTransactionalEmail(input: SendEmailInput) {
  const provider = selectedProvider();
  if (provider === "resend") return sendResendEmail(input);
  if (provider === "ses") return sendSesEmail(input);
  if (process.env.NODE_ENV !== "production") return sendConsoleEmail(input);
  throw new EmailDeliveryError("not_configured");
}
