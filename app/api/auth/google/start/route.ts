import { NextResponse, type NextRequest } from "next/server";
import {
  createGoogleAuthorizationUrl,
  createOAuthState,
  getGoogleOAuthConfig,
  GOOGLE_OAUTH_STATE_COOKIE,
  googleOAuthStateCookieOptions,
} from "@/lib/server/google-oauth";

export const runtime = "nodejs";

function signInRedirect(request: NextRequest, error: string) {
  const url = new URL("/sign-in", request.nextUrl.origin);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const config = getGoogleOAuthConfig();
  if (!config) {
    return signInRedirect(request, "google_not_configured");
  }

  const state = createOAuthState();
  const response = NextResponse.redirect(createGoogleAuthorizationUrl(config, state));
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, googleOAuthStateCookieOptions());
  return response;
}
