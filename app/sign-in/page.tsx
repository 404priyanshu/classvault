import { SignInForm } from "./sign-in-form";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google sign-in is not configured yet.",
  google_denied: "Google sign-in was cancelled.",
  google_state: "Google sign-in expired. Try again.",
  google_profile: "Google did not return a verified email.",
  google_domain: "Use your campus Google account to sign in.",
  google_callback: "Google sign-in failed. Try again.",
};

type SignInPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const code = Array.isArray(params.error) ? params.error[0] : params.error;
  const initialError = code
    ? (AUTH_ERROR_MESSAGES[code] ?? "Google sign-in failed. Try again.")
    : null;

  return <SignInForm initialError={initialError} />;
}
