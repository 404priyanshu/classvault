import type { Metadata } from "next";
import { ProfileView } from "@/components/views/profile-view";

export const metadata: Metadata = {
  title: "Settings · ClassVault",
  description: "Manage your profile, contributions, and account.",
};

export default function SettingsPage() {
  return <ProfileView />;
}
