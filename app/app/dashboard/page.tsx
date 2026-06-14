import type { Metadata } from "next";
import { DashboardView } from "@/components/views/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard · ClassVault",
  description: "Your study roadmap, saved resources, and progress at a glance.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
