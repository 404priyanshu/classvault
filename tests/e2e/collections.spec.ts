import { expect, test } from "@playwright/test";
import type {
  ApiCollection,
  ApiCollectionSummary,
  ApiNote,
  ApiUser,
  MetaResponse,
} from "@/lib/api-types";

const user = {
  id: "user-1",
  name: "Student User",
  email: "student@classvault.edu",
  role: "STUDENT",
  department: "CSE",
  semester: "5",
  age: null,
  subjectPreferences: [],
  collegeName: "ClassVault University",
  collegeEmail: "student@classvault.edu",
  collegeVerifiedAt: "2026-06-12T00:00:00.000Z",
  isCollegeVerified: true,
  hasCompletedOnboarding: true,
  roleLabel: "CSE, 5th Semester",
} satisfies ApiUser;

const note = {
  id: "note-dbms",
  title: "DBMS Unit 2 Notes",
  description: "Relational model notes for exam prep.",
  subject: "Database Systems",
  semester: "5",
  courseCode: "CS302",
  unit: "Unit 2",
  topic: "Relational Model",
  fileType: "PDF",
  fileSizeBytes: 4096,
  pageCount: 12,
  hasFile: true,
  status: "PUBLISHED",
  rejectionReason: null,
  uploader: { id: "user-1", name: "Student User", roleLabel: "CSE, 5th Semester" },
  tags: ["SQL"],
  ratingAverage: 4.5,
  ratingCount: 2,
  downloadCount: 8,
  savedByMe: false,
  ownedByMe: true,
  myRating: null,
  createdAt: "2026-06-12T00:00:00.000Z",
} satisfies ApiNote;

const meta = {
  subjects: ["Database Systems"],
  semesters: ["5"],
  stats: {
    totalNotes: 1,
    savedCount: 0,
    uploadCount: 1,
    totalDownloads: 8,
    ratingAverage: 4.5,
  },
} satisfies MetaResponse;

function summary(collection: ApiCollection): ApiCollectionSummary {
  return {
    id: collection.id,
    title: collection.title,
    slug: collection.slug,
    isPublic: collection.isPublic,
    noteCount: collection.notes.length,
    ownedByMe: collection.ownedByMe,
    createdAt: collection.createdAt,
  };
}

test("collections can be created, shared, trimmed, and deleted", async ({ page }) => {
  let created = false;
  let deleted = false;
  let collection: ApiCollection = {
    id: "collection-1",
    title: "DBMS End-Sem Sprint",
    slug: "dbms-end-sem-sprint",
    isPublic: false,
    noteCount: 1,
    ownedByMe: true,
    createdAt: "2026-06-16T00:00:00.000Z",
    owner: { id: user.id, name: user.name },
    notes: [note],
  };

  await page.route("**/api/me", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(user) });
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
  await page.route("**/api/collections", async (route) => {
    if (route.request().method() === "POST") {
      created = true;
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(collection) });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ items: created && !deleted ? [summary(collection)] : [] }),
    });
  });
  await page.route("**/api/collections/collection-1", async (route) => {
    const method = route.request().method();
    if (method === "PATCH") {
      collection = { ...collection, isPublic: true };
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(collection) });
      return;
    }
    if (method === "DELETE") {
      deleted = true;
      await route.fulfill({ status: 204 });
      return;
    }
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(collection) });
  });
  await page.route("**/api/collections/collection-1/notes", async (route) => {
    if (route.request().method() === "DELETE") {
      collection = { ...collection, notes: [], noteCount: 0 };
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true }) });
      return;
    }
    await route.continue();
  });

  await page.goto("/app/collections");

  await expect(page.getByRole("heading", { level: 1, name: "Collections" })).toBeVisible();
  await page.getByPlaceholder("New collection name (e.g. DBMS End-Sem Sprint)").fill(collection.title);
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.getByRole("button", { name: /DBMS End-Sem Sprint/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "DBMS End-Sem Sprint" })).toBeVisible();
  await expect(page.getByRole("button", { name: /DBMS Unit 2 Notes/ })).toBeVisible();

  await page.getByRole("button", { name: "Make public" }).click();
  await expect(page.getByText("/c/dbms-end-sem-sprint")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy link" })).toBeVisible();

  await page.getByRole("button", { name: "Remove from collection" }).click();
  await expect(page.getByText("Empty. Open any note and use “Add to collection”.")).toBeVisible();

  await page.getByRole("button", { name: "Delete collection" }).click();
  await expect(page.getByText("No collections yet.")).toBeVisible();
});
