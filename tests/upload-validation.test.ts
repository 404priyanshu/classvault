import { describe, expect, it } from "vitest";
import { validateUploadMetadata } from "@/lib/server/storage";

describe("upload validation", () => {
  it("accepts supported release file types", () => {
    expect(validateUploadMetadata("application/pdf", 1024)).toEqual({
      ok: true,
      fileType: "PDF",
    });
  });

  it("rejects unsupported file types and oversized uploads", () => {
    expect(validateUploadMetadata("image/png", 1024)).toMatchObject({
      ok: false,
    });
    expect(validateUploadMetadata("application/pdf", 26 * 1024 * 1024)).toMatchObject({
      ok: false,
    });
  });
});
