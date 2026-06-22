"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { LogOut, Trophy, Upload, User } from "lucide-react";
import type { ApiNote, LeaderboardResponse } from "@/lib/api-types";
import { formatCount } from "@/lib/format";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { Avatar, LoadingRows, NoteRow, SectionLabel } from "@/components/notes/note-ui";
import { Button, Card, EmptyState, Input, Select } from "@/components/ui";

export function ProfileView() {
  const { me, authChecked, stats, openNoteDetail, openUpload, signOut, saveProfile } = useAppShell();
  const onOpenNote = openNoteDetail;
  const onUpload = openUpload;
  const onSignOut = signOut;
  const onSaveProfile = saveProfile;

  // Notes owned by the current user.
  const [uploads, setUploads] = useState<ApiNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [reputation, setReputation] = useState<LeaderboardResponse["me"]>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/notes?owner=me", { signal: controller.signal });
        if (response.ok) {
          setUploads(((await response.json()) as { items: ApiNote[] }).items);
        } else if (response.status === 401) {
          setUploads([]);
        }
      } catch {
        // contributions list degrades to empty on failure
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [me]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch("/api/leaderboard", { signal: controller.signal });
        if (response.ok) {
          setReputation(((await response.json()) as LeaderboardResponse).me);
        }
      } catch {
        // reputation card is optional; ignore failures
      }
    })();
    return () => controller.abort();
  }, [me]);

  const [name, setName] = useState(me?.name ?? "");
  const [department, setDepartment] = useState(me?.department ?? "");
  const [semester, setSemester] = useState(me?.semester ?? "");
  const [saving, setSaving] = useState(false);
  const statItems: Array<[string, string]> = [
    ["Uploads", stats ? String(stats.uploadCount) : "—"],
    ["Saved", stats ? String(stats.savedCount) : "—"],
    ["Downloads", stats ? formatCount(stats.totalDownloads) : "—"],
    ["Avg rating", stats ? stats.ratingAverage.toFixed(1) : "—"],
  ];
  const displayName = me?.name ?? (authChecked ? "Guest preview" : "Loading...");
  const displayEmail = me?.email ?? (authChecked ? "Sign in to manage your profile" : "");
  const avatarName = me?.name ?? (authChecked ? "Guest" : "?");

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!me || saving) return;
    setSaving(true);
    await onSaveProfile({
      name: name.trim(),
      department: department.trim() || null,
      semester: semester || null,
    });
    setSaving(false);
  }

  return (
    <div className="space-y-8">
      <Card padded className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={avatarName} size="lg" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">{displayName}</h2>
            <p className="mt-0.5 truncate text-sm text-ink-faint">{displayEmail}</p>
            <p className="mt-0.5 font-mono text-xs text-ink-faint">{me?.roleLabel ?? ""}</p>
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Button onClick={onUpload} icon={<Upload className="h-4 w-4" />}>
            Upload
          </Button>
          {me ? (
            <Button variant="secondary" onClick={onSignOut} icon={<LogOut className="h-4 w-4" />}>
              Sign out
            </Button>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-line px-3.5 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
            >
              <User className="h-4 w-4" />
              Sign in
            </Link>
          )}
        </div>
      </Card>

      <Card padded className="p-5 sm:p-6">
        <form onSubmit={submitProfile} className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-3">
            Name
            <Input
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!me || saving}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Department
            <Input
              value={department}
              onChange={(event) => setDepartment(event.target.value.toUpperCase())}
              disabled={!me || saving}
              maxLength={40}
              placeholder="CSE"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Semester
            <Select
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
              disabled={!me || saving}
              className="appearance-none"
            >
              <option value="">Not set</option>
              {["1", "2", "3", "4", "5", "6", "7", "8"].map((item) => (
                <option key={item} value={item}>
                  Semester {item}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-end">
            <Button type="submit" disabled={!me || saving} className="w-full">
              {saving ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </form>
      </Card>

      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
        {statItems.map(([label, value]) => (
          <div key={label} className="bg-surface p-4 sm:p-5">
            <p className="font-mono text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs font-medium text-ink-faint">{label}</p>
          </div>
        ))}
      </section>

      {reputation ? (
        <Card padded className="flex items-center gap-4 p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Trophy className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Reputation</p>
            <p className="text-xs text-ink-soft">
              Rank #{reputation.rank} · {reputation.publishedCount} published · {reputation.downloadsReceived} downloads
            </p>
          </div>
          <span className="font-mono text-xl font-bold text-ink">{reputation.score}</span>
        </Card>
      ) : null}

      <section>
        <div className="pb-3">
          <SectionLabel>Your contributions</SectionLabel>
        </div>
        {loading ? (
          <LoadingRows count={3} />
        ) : uploads.length ? (
          <div className="space-y-2">
            {uploads.map((note) => (
              <NoteRow key={note.id} note={note} onOpen={() => onOpenNote(note)} />
            ))}
          </div>
        ) : (
          <EmptyState
            message={
              <>
                <span className="block text-sm font-medium text-ink">No uploads yet</span>
                <span className="mt-1 block">Share your first resource with your class.</span>
              </>
            }
          />
        )}
      </section>
    </div>
  );
}
