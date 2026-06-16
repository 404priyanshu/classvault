import { expect, test, type Page } from "@playwright/test";
import type { ApiNote, MetaResponse } from "@/lib/api-types";

const recentNote = {
  id: "note-recent",
  title: "Fresh Compiler Notes",
  description: "A recent upload for compiler design.",
  subject: "Compiler Design",
  semester: "6",
  courseCode: "CS401",
  unit: "Unit 1",
  topic: "Lexical Analysis",
  fileType: "PDF",
  fileSizeBytes: 2048,
  pageCount: 8,
  hasFile: true,
  status: "PUBLISHED",
  rejectionReason: null,
  uploader: { id: "user-1", name: "Student User", roleLabel: "CSE, 6th Semester" },
  tags: ["Compiler"],
  ratingAverage: 4,
  ratingCount: 1,
  downloadCount: 1,
  savedByMe: false,
  ownedByMe: false,
  myRating: null,
  createdAt: "2026-06-16T00:00:00.000Z",
} satisfies ApiNote;

const trendingNote = {
  ...recentNote,
  id: "note-trending",
  title: "DBMS Hot PYQs",
  subject: "Database Systems",
  semester: "5",
  courseCode: "CS302",
  unit: "Exam Pack",
  topic: "Normalization",
  tags: ["DBMS", "PYQ"],
  ratingAverage: 4.8,
  ratingCount: 5,
  downloadCount: 42,
  createdAt: "2026-06-12T00:00:00.000Z",
} satisfies ApiNote;

const meta = {
  subjects: ["Compiler Design", "Database Systems"],
  semesters: ["5", "6"],
  stats: {
    totalNotes: 2,
    savedCount: 0,
    uploadCount: 0,
    totalDownloads: 43,
    ratingAverage: 4.4,
  },
} satisfies MetaResponse;

async function stubShell(page: Page) {
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
  await page.route("**/api/notifications", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ items: [], unreadCount: 0 }),
    });
  });
}

test("library trending sort requests and renders trending notes", async ({ page }) => {
  const noteQueries: string[] = [];
  await stubShell(page);
  await page.route("**/api/notes**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname !== "/api/notes") {
      await route.continue();
      return;
    }
    noteQueries.push(url.search);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        items: url.searchParams.get("sort") === "trending" ? [trendingNote] : [recentNote],
        nextCursor: null,
      }),
    });
  });

  await page.goto("/app/library");
  await expect(page.getByRole("button", { name: /Fresh Compiler Notes/ })).toBeVisible();

  await page.getByRole("button", { name: "Trending" }).click();

  await expect(page.getByRole("button", { name: /DBMS Hot PYQs/ })).toBeVisible();
  expect(noteQueries.some((query) => query.includes("sort=trending"))).toBe(true);
});

test("dashboard shows a trending-this-week strip", async ({ page }) => {
  const noteQueries: string[] = [];
  await stubShell(page);
  await page.route("**/api/notes**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname !== "/api/notes") {
      await route.continue();
      return;
    }
    noteQueries.push(url.search);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ items: [trendingNote], nextCursor: null }),
    });
  });

  await page.goto("/app/dashboard");

  await expect(page.getByText("Trending this week")).toBeVisible();
  await expect(page.getByRole("button", { name: /DBMS Hot PYQs/ })).toBeVisible();
  expect(noteQueries.some((query) => query.includes("sort=trending") && query.includes("limit=3"))).toBe(true);
});
