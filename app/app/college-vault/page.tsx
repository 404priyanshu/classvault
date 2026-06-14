import type { Metadata } from "next";
import { CollegeVaultView } from "@/components/views/college-vault-view";

export const metadata: Metadata = {
  title: "College Vault Verification · ClassVault",
  description: "Verify your college to unlock your community's private resource vault.",
};

export default function CollegeVaultPage() {
  return <CollegeVaultView />;
}
