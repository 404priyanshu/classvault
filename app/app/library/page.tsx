import type { Metadata } from "next";
import { NotesBrowser } from "@/components/views/notes-browser";

export const metadata: Metadata = {
  title: "Library · ClassVault",
  description: "Browse shared class notes, PYQs, and resources.",
};

export default function LibraryPage() {
  return <NotesBrowser scope="library" />;
}
