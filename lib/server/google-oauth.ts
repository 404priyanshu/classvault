import { randomBytes, timingSafeEqual } from "node:crypto";
import { isAllowedCampusEmail, roleForEmail } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const GOOGLE_PROVIDER = "google";
export const GOOGLE_OAUTH_STATE_COOKIE = "classvault_google_oauth_state";
export const GOOGLE_OAUTH_STATE_TTL_SECONDS = 10 * 60;

export class GoogleOAuthError extends Error {
  constructor(
    readonly code:
      | "token_exchange_failed"
      | "profile_fetch_failed"
      | "invalid_profile"
      | "domain_not_allowed",
  ) {
    super(code);
  }
}

type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean | "true" | "false";
  name?: string;
};

export type GoogleProfile = {
  providerAccountId: string;
  email: string;
  name: string;
};

function envValue(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const appOrigin = envValue("APP_ORIGIN")?.replace(/\/+$/, "");
  const clientId = envValue("GOOGLE_CLIENT_ID");
  const clientSecret = envValue("GOOGLE_CLIENT_SECRET");

  if (!appOrigin || !clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    redirectUri: `${appOrigin}/api/auth/google/callback`,
  };
}

export function createOAuthState() {
  return randomBytes(32).toString("base64url");
}

export function oauthStatesMatch(expected: string | undefined, actual: string | null) {
  if (!expected || !actual) return false;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export function createGoogleAuthorizationUrl(config: GoogleOAuthConfig, state: string) {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url;
}

export function googleOAuthStateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/google",
    maxAge: GOOGLE_OAUTH_STATE_TTL_SECONDS,
  };
}

export function expiredGoogleOAuthStateCookieOptions() {
  return {
    ...googleOAuthStateCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  };
}

function verifiedEmail(value: GoogleUserInfo["email_verified"]) {
  return value === true || value === "true";
}

export async function exchangeGoogleCodeForProfile(code: string, config: GoogleOAuthConfig) {
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenBody = (await tokenResponse.json().catch(() => null)) as GoogleTokenResponse | null;
  if (!tokenResponse.ok || !tokenBody?.access_token) {
    throw new GoogleOAuthError("token_exchange_failed");
  }

  const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenBody.access_token}` },
  });
  const profile = (await profileResponse.json().catch(() => null)) as GoogleUserInfo | null;
  if (!profileResponse.ok || !profile) {
    throw new GoogleOAuthError("profile_fetch_failed");
  }

  if (!profile.sub || !profile.email || !verifiedEmail(profile.email_verified)) {
    throw new GoogleOAuthError("invalid_profile");
  }

  const email = profile.email.trim().toLowerCase();
  if (!isAllowedCampusEmail(email)) {
    throw new GoogleOAuthError("domain_not_allowed");
  }
  const name = profile.name?.trim() || email.split("@")[0];
  return { providerAccountId: profile.sub, email, name } satisfies GoogleProfile;
}

export async function findOrCreateGoogleUser(profile: GoogleProfile) {
  return db.$transaction(async (tx) => {
    const account = await tx.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: GOOGLE_PROVIDER,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: true },
    });
    if (account) return account.user;

    const user = await tx.user.upsert({
      where: { email: profile.email },
      update: {},
      create: {
        email: profile.email,
        name: profile.name,
        role: roleForEmail(profile.email),
      },
    });

    await tx.oAuthAccount.create({
      data: {
        provider: GOOGLE_PROVIDER,
        providerAccountId: profile.providerAccountId,
        userId: user.id,
        email: profile.email,
      },
    });

    return user;
  });
}
