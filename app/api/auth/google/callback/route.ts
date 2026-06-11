import { NextResponse, type NextRequest } from "next/server";
import { createSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/server/auth";
import {
  exchangeGoogleCodeForProfile,
  expiredGoogleOAuthStateCookieOptions,
  findOrCreateGoogleUser,
  getGoogleOAuthConfig,
  GoogleOAuthError,
  GOOGLE_OAUTH_STATE_COOKIE,
  oauthStatesMatch,
} from "@/lib/server/google-oauth";

export const runtime = "nodejs";

function appRedirect(request: NextRequest, pathname: string) {
  return new URL(pathname, request.nextUrl.origin);
}

function signInRedirect(request: NextRequest, error: string) {
  const url = appRedirect(request, "/sign-in");
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", expiredGoogleOAuthStateCookieOptions());
  return response;
}

export async function GET(request: NextRequest) {
  const config = getGoogleOAuthConfig();
  if (!config) {
    return signInRedirect(request, "google_not_configured");
  }

  const googleError = request.nextUrl.searchParams.get("error");
  if (googleError) {
    return signInRedirect(request, "google_denied");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  if (!code || !oauthStatesMatch(expectedState, state)) {
    return signInRedirect(request, "google_state");
  }

  try {
    const profile = await exchangeGoogleCodeForProfile(code, config);
    const user = await findOrCreateGoogleUser(profile);
    const { token, expiresAt } = await createSession(user.id);
    const response = NextResponse.redirect(appRedirect(request, "/app"));
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", expiredGoogleOAuthStateCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof GoogleOAuthError && error.code === "domain_not_allowed") {
      return signInRedirect(request, "google_domain");
    }
    if (error instanceof GoogleOAuthError && error.code === "invalid_profile") {
      return signInRedirect(request, "google_profile");
    }
    console.error(error);
    return signInRedirect(request, "google_callback");
  }
}
