import type { Metadata } from "next";
import { ExamModeView } from "@/components/views/exam-mode-view";

export const metadata: Metadata = {
  title: "Exam Mode · ClassVault",
  description: "Build a focused exam-day plan and countdown.",
};

export default function ExamPage() {
  return <ExamModeView />;
}
