import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/server/auth";
import { getCollectionBySlug } from "@/lib/server/collections";
import { formatBytes } from "@/lib/format";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug, null);
  if (!collection) return { title: "Collection · ClassVault" };
  return {
    title: `${collection.title} · ClassVault`,
    description: `A shared collection of ${collection.notes.length} study resources.`,
  };
}

export default async function PublicCollectionPage({ params }: Params) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const collection = await getCollectionBySlug(slug, user?.id ?? null);
  if (!collection) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-xs font-bold text-surface">CV</span>
          <span className="text-sm font-bold tracking-tight">ClassVault</span>
        </Link>
        <Link
          href="/app/library"
          className="inline-flex h-9 items-center rounded-md border border-line px-3.5 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
        >
          Open ClassVault
        </Link>
      </div>

      <header className="mt-10 border-b border-line pb-6">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          Shared collection
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{collection.title}</h1>
        <p className="mt-1 text-sm text-ink-faint">
          {collection.notes.length} {collection.notes.length === 1 ? "resource" : "resources"} · curated by {collection.owner.name}
        </p>
      </header>

      {collection.notes.length === 0 ? (
        <p className="mt-8 text-sm text-ink-faint">This collection is empty.</p>
      ) : (
        <ol className="mt-6 space-y-2">
          {collection.notes.map((note, index) => (
            <li key={note.id}>
              <a
                href={`/api/notes/${note.id}/file?disposition=inline`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 transition hover:border-line-strong"
              >
                <span className="w-5 shrink-0 text-center font-mono text-xs font-semibold text-ink-faint">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{note.title}</span>
                  <span className="block truncate text-[11px] text-ink-faint">
                    {note.subject} · {note.courseCode} · {note.fileType} · {formatBytes(note.fileSizeBytes)}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
