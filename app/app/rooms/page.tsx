import type { Metadata } from "next";
import { StudyRoomsView } from "@/components/views/study-rooms-view";

export const metadata: Metadata = {
  title: "Silent Study Rooms · ClassVault",
  description: "Join focused, distraction-free study rooms with your peers.",
};

export default function RoomsPage() {
  return <StudyRoomsView />;
}
