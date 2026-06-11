import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { currentUser, initialNotes } from "../lib/classvault-data";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const db = new PrismaClient({ adapter });

function parseSizeBytes(label: string) {
  const match = label.match(/([\d.]+)\s*(MB|KB)/i);
  if (!match) return 0;
  const value = Number(match[1]);
  return Math.round(match[2].toUpperCase() === "MB" ? value * 1_000_000 : value * 1_000);
}

function parseRole(roleLabel: string) {
  // "CSE, 5th Semester" -> { department: "CSE", semester: "5" }
  const match = roleLabel.match(/^([A-Z]+),\s*(\d+)/);
  return match ? { department: match[1], semester: match[2] } : {};
}

function emailFor(name: string) {
  return `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@classvault.edu`;
}

async function main() {
  await db.downloadEvent.deleteMany();
  await db.rating.deleteMany();
  await db.savedNote.deleteMany();
  await db.noteTag.deleteMany();
  await db.tag.deleteMany();
  await db.uploadedFile.deleteMany();
  await db.note.deleteMany();
  await db.user.deleteMany();

  const userByName = new Map<string, string>();

  for (const note of initialNotes) {
    if (userByName.has(note.uploader)) continue;
    const isCurrent = note.uploader === currentUser.name;
    const user = await db.user.create({
      data: {
        name: note.uploader,
        email: isCurrent ? currentUser.email : emailFor(note.uploader),
        role: "STUDENT",
        ...parseRole(note.uploaderRole),
      },
    });
    userByName.set(note.uploader, user.id);
  }

  const tagIds = new Map<string, string>();
  const allTags = Array.from(new Set(initialNotes.flatMap((note) => note.tags)));
  for (const name of allTags) {
    const tag = await db.tag.create({ data: { name } });
    tagIds.set(name, tag.id);
  }

  const currentUserId = userByName.get(currentUser.name);

  for (const note of initialNotes) {
    const created = await db.note.create({
      data: {
        title: note.title,
        description: note.summary,
        subject: note.subject,
        semester: note.semester,
        courseCode: note.courseCode,
        unit: note.unit,
        topic: note.topic,
        fileType: note.fileType,
        fileSizeBytes: parseSizeBytes(note.fileSize),
        pageCount: note.pages ?? null,
        storageKey: null,
        status: "PUBLISHED",
        ratingAverage: note.rating,
        ratingCount: note.ratingsCount,
        downloadCount: note.downloads,
        ownerId: userByName.get(note.uploader)!,
        createdAt: new Date(note.uploadDate),
        tags: {
          create: note.tags.map((tag) => ({ tagId: tagIds.get(tag)! })),
        },
      },
    });

    if (note.saved && currentUserId) {
      await db.savedNote.create({
        data: { userId: currentUserId, noteId: created.id },
      });
    }
  }

  const counts = {
    users: await db.user.count(),
    notes: await db.note.count(),
    tags: await db.tag.count(),
    saved: await db.savedNote.count(),
  };
  console.log("Seeded:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
