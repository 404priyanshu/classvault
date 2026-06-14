import type { Metadata } from "next";
import { AIRoadmapsView } from "@/components/views/ai-roadmaps-view";

export const metadata: Metadata = {
  title: "AI Study Roadmaps · ClassVault",
  description: "Generate a customized subject study schedule from your files, community notes, and syllabus.",
};

export default function RoadmapsPage() {
  return <AIRoadmapsView />;
}
