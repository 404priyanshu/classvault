import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/auth";
import { hasCompletedOnboarding, serializeUser } from "@/lib/server/users";
import { SignUpForm } from "./sign-up-form";

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user && hasCompletedOnboarding(user)) {
    redirect("/app");
  }

  return <SignUpForm initialUser={user ? serializeUser(user) : null} />;
}
