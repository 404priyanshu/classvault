import type { Metadata } from "next";
import { CollectionsView } from "@/components/views/collections-view";

export const metadata: Metadata = {
  title: "Collections · ClassVault",
  description: "Your shareable note collections.",
};

export default function CollectionsPage() {
  return <CollectionsView />;
}
