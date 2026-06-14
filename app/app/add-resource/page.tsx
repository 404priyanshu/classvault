import type { Metadata } from "next";
import { AddResourceView } from "@/components/views/add-resource-view";

export const metadata: Metadata = {
  title: "Add Resource · ClassVault",
  description: "Ingest new study materials by uploading files or pasting educational links.",
};

export default function AddResourcePage() {
  return <AddResourceView />;
}
