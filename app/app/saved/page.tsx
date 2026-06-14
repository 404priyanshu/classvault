import type { Metadata } from "next";
import { NotesBrowser } from "@/components/views/notes-browser";

export const metadata: Metadata = {
  title: "Saved · ClassVault",
  description: "Resources you have bookmarked.",
};

export default function SavedPage() {
  return <NotesBrowser scope="saved" />;
}
