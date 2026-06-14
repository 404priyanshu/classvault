import { redirect } from "next/navigation";
import { ClassVaultApp } from "@/components/class-vault-app";
import { getCurrentUser } from "@/lib/server/auth";
import { hasCompletedOnboarding } from "@/lib/server/users";

export default async function AppPage() {
  const user = await getCurrentUser();
  if (user && !hasCompletedOnboarding(user)) {
    redirect("/sign-up");
  }
  return <ClassVaultApp />;
}
