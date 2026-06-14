import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReviewView } from "@/components/views/review-view";
import { getCurrentUser } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "Review queue · ClassVault",
  description: "Moderate pending uploads and reports.",
};

export default async function ReviewPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/app/dashboard");
  }
  return <ReviewView />;
}
