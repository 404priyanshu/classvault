"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FolderPlus, Globe, Link2, Lock, Trash2, X } from "lucide-react";
import type { ApiCollection, ApiCollectionSummary, CollectionsResponse } from "@/lib/api-types";
import { cx } from "@/lib/cx";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { LoadingRows, NoteRow, SectionLabel } from "@/components/notes/note-ui";
import { Button, Card, EmptyState, Input } from "@/components/ui";

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
      <EmptyState
        message={
          <>
            <span className="block text-sm font-medium text-ink">Sign in to build collections</span>
            <span className="mt-1 block">Bundle notes into named, shareable sets like exam sprints.</span>
          </>
        }
      />
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <p className="text-sm text-ink-soft">
        Bundle notes into named sets — exam sprints, unit packs — and share them with a public link.
      </p>

      <Card padded className="p-4">
        <form onSubmit={createCollection} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
            placeholder="New collection name (e.g. DBMS End-Sem Sprint)"
            className="flex-1"
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
          <Button
            type="submit"
            disabled={creating || title.trim().length < 2}
            icon={<FolderPlus className="h-4 w-4" />}
          >
            Create
          </Button>
        </form>
      </Card>

      <section className="space-y-3">
        <SectionLabel>Your collections</SectionLabel>
        {loading ? (
          <LoadingRows count={3} />
        ) : items.length === 0 ? (
          <EmptyState message="No collections yet. Create one above, then add notes from any note's detail panel." />
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
                      <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-800">
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
              <Button
                variant="secondary"
                size="sm"
                onClick={() => togglePublic(selected)}
                icon={selected.isPublic ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
              >
                {selected.isPublic ? "Make private" : "Make public"}
              </Button>
              {selected.isPublic ? (
                <Button size="sm" onClick={() => copyShareLink(selected.slug)} icon={<Link2 className="h-3.5 w-3.5" />}>
                  Copy link
                </Button>
              ) : null}
            </div>
          </div>

          {selected.notes.length === 0 ? (
            <EmptyState message="Empty. Open any note and use “Add to collection”." />
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
