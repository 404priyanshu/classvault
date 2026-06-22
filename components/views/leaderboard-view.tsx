"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import type { LeaderboardResponse } from "@/lib/api-types";
import { cx } from "@/lib/cx";
import { Avatar, SectionLabel } from "@/components/notes/note-ui";
import { Card, EmptyState } from "@/components/ui";

export function LeaderboardView() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/leaderboard", { signal: controller.signal });
        if (res.ok) setData((await res.json()) as LeaderboardResponse);
      } catch {
        // leave the board empty on failure
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const entries = data?.entries ?? [];
  const me = data?.me ?? null;
  const meInTop = me ? entries.some((entry) => entry.userId === me.userId) : false;

  return (
    <div className="space-y-6 pb-12">
      <p className="text-sm text-ink-soft">
        Reputation rewards contribution: +10 per published upload, +1 per download your
        notes earn, and a +25 bonus for a 4.5★ average rating.
      </p>

      {me ? (
        <Card padded className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Trophy className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Your reputation</p>
            <p className="text-xs text-ink-soft">
              {me.publishedCount} published · {me.downloadsReceived} downloads · {me.avgRating.toFixed(1)}★ avg
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xl font-bold text-ink">{me.score}</p>
            <p className="text-[10px] font-semibold text-ink-faint">Rank #{me.rank}</p>
          </div>
        </Card>
      ) : null}

      <section className="space-y-3">
        <SectionLabel>Top contributors</SectionLabel>
        {loading ? (
          <p className="text-xs text-ink-faint">Loading leaderboard…</p>
        ) : entries.length === 0 ? (
          <EmptyState message="No contributors yet. Upload notes to get on the board." />
        ) : (
          <Card>
            <div className="divide-y divide-line">
              {entries.map((entry, index) => {
                const isMe = me?.userId === entry.userId;
                return (
                  <div
                    key={entry.userId}
                    className={cx("flex items-center gap-3 px-3.5 py-3", isMe ? "bg-accent-soft" : "")}
                  >
                    <span className="w-6 shrink-0 text-center font-mono text-sm font-semibold text-ink-faint">
                      {index + 1}
                    </span>
                    <Avatar name={entry.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {entry.name}
                        {isMe ? (
                          <span className="ml-1.5 text-[10px] font-semibold text-accent">You</span>
                        ) : null}
                      </p>
                      <p className="truncate text-[11px] text-ink-faint">
                        {entry.roleLabel} · {entry.publishedCount} published · {entry.downloadsReceived} downloads
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold text-ink">{entry.score}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
        {me && !meInTop ? (
          <p className="text-center text-[11px] text-ink-faint">
            You are ranked #{me.rank} with {me.score} points.
          </p>
        ) : null}
      </section>
    </div>
  );
}
