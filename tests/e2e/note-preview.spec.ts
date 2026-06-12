import { expect, test } from "@playwright/test";
import type { ApiNote, MetaResponse } from "@/lib/api-types";

const pdfNote = {
  id: "note-pdf",
  title: "Uploaded PDF Notes",
  description: "A PDF resource with an inline preview.",
  subject: "Database Systems",
  semester: "5",
  courseCode: "CS302",
  unit: "Unit 2",
  topic: "Relational Model",
  fileType: "PDF",
  fileSizeBytes: 2048,
  pageCount: 3,
  hasFile: true,
  status: "PUBLISHED",
  rejectionReason: null,
  uploader: { id: "user-1", name: "Student User", roleLabel: "CSE, 5th Semester" },
  tags: ["SQL"],
  ratingAverage: 0,
  ratingCount: 0,
  downloadCount: 0,
  savedByMe: false,
  ownedByMe: false,
  myRating: null,
  createdAt: "2026-06-12T00:00:00.000Z",
} satisfies ApiNote;

const meta = {
  subjects: ["Database Systems"],
  semesters: ["5"],
  stats: {
    totalNotes: 1,
    savedCount: 0,
    uploadCount: 0,
    totalDownloads: 0,
    ratingAverage: 0,
  },
} satisfies MetaResponse;

test("clicking a PDF note opens a detail drawer with an inline preview", async ({ page }) => {
  await page.route("**/api/me", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Not signed in." } }),
    });
  });
  await page.route("**/api/meta", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(meta) });
  });
  await page.route("**/api/notes/note-pdf/file**", async (route) => {
    await route.fulfill({
      contentType: "application/pdf",
      body: "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n%%EOF",
    });
  });
  await page.route("**/api/notes**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname !== "/api/notes") {
      await route.continue();
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ items: [pdfNote], nextCursor: null }),
    });
  });

  await page.goto("/app");
  await page.getByText("Uploaded PDF Notes", { exact: true }).click();

  await expect(page.getByRole("heading", { name: "Uploaded PDF Notes" })).toBeVisible();
  await expect(page.getByText("Preview", { exact: true })).toBeVisible();
  await expect(page.locator('iframe[title="Uploaded PDF Notes preview"]')).toBeVisible();
});
