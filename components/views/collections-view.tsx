"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FolderPlus, Globe, Link2, Lock, Trash2, X } from "lucide-react";
import type { ApiCollection, ApiCollectionSummary, CollectionsResponse } from "@/lib/api-types";
import { cx } from "@/lib/cx";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { LoadingRows, NoteRow, SectionLabel } from "@/components/notes/note-ui";

export function CollectionsView() {
  const { me, authChecked, openAuthPrompt, openNoteDetail, setToast } = useAppShell();

  const [items, setItems] = useState<ApiCollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  const [selected, setSelected] = useState<ApiCollection | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!me?.id) return;
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch("/api/collections", { signal: controller.signal });
        if (response.ok) {
          setItems(((await response.json()) as CollectionsResponse).items);
        }
      } catch {
        // leave empty on failure
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [me?.id]);

  async function reloadSummaries() {
    try {
      const response = await fetch("/api/collections");
      if (response.ok) setItems(((await response.json()) as CollectionsResponse).items);
    } catch {
      // keep current
    }
  }

  async function createCollection(event: FormEvent) {
    event.preventDefault();
    if (!me) {
      openAuthPrompt();
      return;
    }
    const name = title.trim();
    if (name.length < 2) return;
    setCreating(true);
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: name, isPublic }),
      });
      if (response.ok) {
        const created = (await response.json()) as ApiCollection;
        setTitle("");
        setIsPublic(false);
        await reloadSummaries();
        setSelected(created);
      } else {
        setToast("Could not create collection.");
      }
    } catch {
      setToast("Could not create collection.");
    } finally {
      setCreating(false);
    }
  }

  async function openCollection(id: string) {
    setDetailLoading(true);
    setSelected(null);
    try {
      const response = await fetch(`/api/collections/${id}`);
      if (response.ok) setSelected((await response.json()) as ApiCollection);
    } catch {
      setToast("Could not open collection.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function togglePublic(collection: ApiCollection) {
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !collection.isPublic }),
      });
      if (response.ok) {
        setSelected((await response.json()) as ApiCollection);
        await reloadSummaries();
      }
    } catch {
      setToast("Could not update collection.");
    }
  }

  async function removeCollection(id: string) {
    try {
      const response = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (response.ok) {
        if (selected?.id === id) setSelected(null);
        await reloadSummaries();
      }
    } catch {
      setToast("Could not delete collection.");
    }
  }

  async function removeNote(collectionId: string, noteId: string) {
    try {
      const response = await fetch(`/api/collections/${collectionId}/notes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId }),
      });
      if (response.ok) await openCollection(collectionId);
    } catch {
      setToast("Could not remove note.");
    }
  }

  function copyShareLink(slug: string) {
    const url = `${window.location.origin}/c/${slug}`;
    void navigator.clipboard?.writeText(url).then(
      () => setToast("Share link copied."),
      () => setToast(url),
    );
  }

  if (authChecked && !me) {
    return (
      <div className="rounded-lg border border-dashed border-line px-5 py-14 text-center">
        <p className="text-sm font-medium">Sign in to build collections</p>
        <p className="mt-1 text-sm text-ink-faint">
          Bundle notes into named, shareable sets like exam sprints.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <p className="text-sm text-ink-soft">
        Bundle notes into named sets — exam sprints, unit packs — and share them with a public link.
      </p>

      <form
        onSubmit={createCollection}
        className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center"
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={80}
          placeholder="New collection name (e.g. DBMS End-Sem Sprint)"
          className="h-9 min-w-0 flex-1 rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong"
        />
        <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-ink-soft">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
            className="rounded border-line"
          />
          Public
        </label>
        <button
          type="submit"
          disabled={creating || title.trim().length < 2}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-ink px-3.5 text-sm font-medium text-surface transition hover:bg-ink/85 disabled:opacity-60"
        >
          <FolderPlus className="h-4 w-4" />
          Create
        </button>
      </form>

      <section className="space-y-3">
        <SectionLabel>Your collections</SectionLabel>
        {loading ? (
          <LoadingRows count={3} />
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line px-5 py-10 text-center text-sm text-ink-faint">
            No collections yet. Create one above, then add notes from any note&apos;s detail panel.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((collection) => (
              <div
                key={collection.id}
                className={cx(
                  "flex items-center gap-3 rounded-lg border bg-surface px-3.5 py-3 transition",
                  selected?.id === collection.id ? "border-line-strong" : "border-line hover:border-line-strong",
                )}
              >
                <button
                  type="button"
                  onClick={() => openCollection(collection.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{collection.title}</span>
                    {collection.isPublic ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        <Globe className="h-3 w-3" /> Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink-faint">
                        <Lock className="h-3 w-3" /> Private
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-ink-faint">
                    {collection.noteCount} {collection.noteCount === 1 ? "note" : "notes"}
                  </span>
                </button>
                {collection.isPublic ? (
                  <button
                    type="button"
                    onClick={() => copyShareLink(collection.slug)}
                    className="shrink-0 rounded-md p-1.5 text-ink-faint transition hover:bg-paper hover:text-ink"
                    aria-label="Copy share link"
                  >
                    <Link2 className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeCollection(collection.id)}
                  className="shrink-0 rounded-md p-1.5 text-ink-faint transition hover:bg-paper hover:text-red-600"
                  aria-label="Delete collection"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {detailLoading ? (
        <LoadingRows count={2} />
      ) : selected ? (
        <section className="space-y-3">
          <div className="flex flex-col gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-ink">{selected.title}</h3>
              <p className="text-[11px] text-ink-faint">
                {selected.notes.length} {selected.notes.length === 1 ? "note" : "notes"}
                {selected.isPublic ? ` · /c/${selected.slug}` : " · private"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => togglePublic(selected)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
              >
                {selected.isPublic ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                {selected.isPublic ? "Make private" : "Make public"}
              </button>
              {selected.isPublic ? (
                <button
                  type="button"
                  onClick={() => copyShareLink(selected.slug)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-ink px-2.5 text-xs font-medium text-surface transition hover:bg-ink/85"
                >
                  <Link2 className="h-3.5 w-3.5" /> Copy link
                </button>
              ) : null}
            </div>
          </div>

          {selected.notes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line px-5 py-10 text-center text-sm text-ink-faint">
              Empty. Open any note and use “Add to collection”.
            </div>
          ) : (
            <div className="space-y-2">
              {selected.notes.map((note) => (
                <div key={note.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <NoteRow note={note} onOpen={() => openNoteDetail(note)} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNote(selected.id, note.id)}
                    className="shrink-0 rounded-md p-1.5 text-ink-faint transition hover:bg-paper hover:text-red-600"
                    aria-label="Remove from collection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
