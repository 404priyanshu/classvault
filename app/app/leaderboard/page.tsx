import type { Metadata } from "next";
import { LeaderboardView } from "@/components/views/leaderboard-view";

export const metadata: Metadata = {
  title: "Leaderboard · ClassVault",
  description: "Top contributors ranked by reputation.",
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
