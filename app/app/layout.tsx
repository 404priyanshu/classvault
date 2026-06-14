import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { getCurrentUser } from "@/lib/server/auth";
import { hasCompletedOnboarding } from "@/lib/server/users";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user && !hasCompletedOnboarding(user)) {
    redirect("/sign-up");
  }
  return <AppShell>{children}</AppShell>;
}
