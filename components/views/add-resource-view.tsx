"use client";

import { FileUp } from "lucide-react";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { Button, Card } from "@/components/ui";

export function AddResourceView() {
  const { openUpload } = useAppShell();

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <p className="text-sm text-ink-soft">
        Upload notes, slides, documents, and PYQ archives for moderator review before they appear in the shared library.
      </p>

      <Card padded className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-paper text-ink-soft">
            <FileUp className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <h3 className="text-sm font-semibold text-ink">Submit a file</h3>
            <p className="text-xs leading-relaxed text-ink-soft">
              Accepted formats: PDF, DOCX, PPTX, and ZIP up to 25 MB.
            </p>
          </div>
        </div>

        <Button onClick={openUpload} className="h-10 w-full sm:w-auto">
          Choose document file
        </Button>
      </Card>
    </div>
  );
}
