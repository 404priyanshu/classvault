import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, FolderPlus } from "lucide-react";
import type { ApiCollectionSummary, CollectionsResponse } from "@/lib/api-types";

export function AddToCollection({
  noteId,
  currentUser,
  onAuthRequired,
}: {
  noteId: string;
  currentUser: { id: string; role: string } | null;
  onAuthRequired: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ApiCollectionSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  async function load() {
    try {
      const response = await fetch("/api/collections");
      if (response.ok) {
        setItems(((await response.json()) as CollectionsResponse).items);
        setLoaded(true);
      }
    } catch {
      // leave empty on failure
    }
  }

  function toggleOpen() {
    if (!currentUser) {
      onAuthRequired();
      return;
    }
    const next = !open;
    setOpen(next);
    if (next && !loaded) void load();
  }

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function addTo(collectionId: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId }),
      });
      if (response.ok) setAdded((current) => new Set(current).add(collectionId));
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  async function createAndAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    if (title.length < 2) return;
    setBusy(true);
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, isPublic: false }),
      });
      if (response.ok) {
        const created = (await response.json()) as ApiCollectionSummary;
        setNewTitle("");
        setItems((current) => [created, ...current]);
        await addTo(created.id);
      }
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6" ref={ref}>
      <div className="relative inline-block">
        <button
          type="button"
          onClick={toggleOpen}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
        >
          <FolderPlus className="h-4 w-4" /> Add to collection
        </button>
        {open ? (
          <div className="absolute left-0 z-50 mt-2 w-72 max-w-[80vw] overflow-hidden rounded-lg border border-line bg-surface">
            <div className="max-h-64 overflow-y-auto">
              {!loaded ? (
                <p className="px-3 py-3 text-xs text-ink-faint">Loading…</p>
              ) : items.length === 0 ? (
                <p className="px-3 py-3 text-xs text-ink-faint">No collections yet. Create one below.</p>
              ) : (
                items.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    disabled={busy || added.has(collection.id)}
                    onClick={() => addTo(collection.id)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition hover:bg-paper disabled:opacity-60"
                  >
                    <span className="truncate font-medium text-ink">{collection.title}</span>
                    {added.has(collection.id) ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
                    ) : null}
                  </button>
                ))
              )}
            </div>
            <form onSubmit={createAndAdd} className="flex gap-1.5 border-t border-line p-2">
              <input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                maxLength={80}
                placeholder="New collection…"
                className="h-8 min-w-0 flex-1 rounded-md border border-line bg-paper px-2.5 text-xs outline-none focus:border-line-strong"
              />
              <button
                type="submit"
                disabled={busy || newTitle.trim().length < 2}
                className="inline-flex h-8 shrink-0 items-center rounded-md bg-ink px-2.5 text-xs font-semibold text-surface transition hover:bg-ink/85 disabled:opacity-60"
              >
                Add
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
