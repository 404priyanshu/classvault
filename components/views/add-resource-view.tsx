"use client";

import { useState, type FormEvent } from "react";
import { Link2 } from "lucide-react";
import { cx } from "@/lib/cx";
import { useAppShell } from "@/components/app-shell/app-shell-context";

export function AddResourceView() {
  const { openUpload } = useAppShell();
  const [activeTab, setActiveTab] = useState<"file" | "link">("file");
  const [pastedLink, setPastedLink] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkSubject, setLinkSubject] = useState("");
  const [insights, setInsights] = useState<{
    subject: string;
    topic: string;
    type: string;
    action: string;
  } | null>(null);

  function handlePasteLinkSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pastedLink.trim() || !linkTitle.trim()) return;
    setInsights({
      subject: linkSubject || "Computer Networks",
      topic: "TCP Congestion Control & Flow Systems",
      type: pastedLink.includes("youtube.com") || pastedLink.includes("youtu.be") ? "YouTube Lecture" : "Web Resource Link",
      action: "Add to Day 3 study roadmap",
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <p className="text-sm text-ink-soft">
        Ingest new study materials. Upload your files or paste educational links to parse insights and feed your AI study roadmap.
      </p>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-5">
        <div className="flex gap-1 rounded-lg border border-line bg-paper p-1">
          <button
            onClick={() => {
              setActiveTab("file");
              setInsights(null);
            }}
            className={cx(
              "flex-1 py-1.5 rounded text-xs font-bold transition",
              activeTab === "file" ? "bg-ink text-surface" : "text-ink-soft hover:text-ink",
            )}
          >
            Upload File
          </button>
          <button
            onClick={() => {
              setActiveTab("link");
              setInsights(null);
            }}
            className={cx(
              "flex-1 py-1.5 rounded text-xs font-bold transition",
              activeTab === "link" ? "bg-ink text-surface" : "text-ink-soft hover:text-ink",
            )}
          >
            Paste Link
          </button>
        </div>

        {activeTab === "file" && (
          <div className="text-center py-8 border border-dashed border-line rounded-lg bg-paper flex flex-col items-center justify-center space-y-3">
            <span className="text-3xl">📁</span>
            <p className="text-xs text-ink-soft font-semibold">
              PDF, Slides, Docx, or PYQ papers
            </p>
            <button
              onClick={openUpload}
              className="inline-flex h-8 items-center rounded bg-ink px-4 text-xs font-bold text-surface hover:bg-ink/85 transition"
            >
              Choose document file
            </button>
          </div>
        )}

        {activeTab === "link" && (
          <form onSubmit={handlePasteLinkSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-bold text-ink-soft">Pasted URL Link</span>
                <div className="mt-1 flex h-10 items-center gap-2 rounded-md border border-line bg-paper px-3 transition focus-within:border-line-strong focus-within:bg-surface">
                  <Link2 className="h-4 w-4 text-ink-faint" />
                  <input
                    type="url"
                    required
                    value={pastedLink}
                    onChange={(e) => setPastedLink(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or Drive URL"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
                  />
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Resource Title</span>
                  <input
                    type="text"
                    required
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="e.g. TCP Congestion Control Visualized"
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-ink-soft">Subject Tag</span>
                  <input
                    type="text"
                    value={linkSubject}
                    onChange={(e) => setLinkSubject(e.target.value)}
                    placeholder="e.g. Computer Networks"
                    className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none transition focus:border-line-strong focus:bg-surface"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!pastedLink.trim() || !linkTitle.trim()}
              className="w-full h-10 bg-ink text-surface rounded text-xs font-bold hover:bg-ink/85 transition pt-1"
            >
              Analyze and Ingest Link
            </button>
          </form>
        )}
      </div>

      {/* Analysis Insights Card */}
      {insights && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-3 shadow-sm reveal-up">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider leading-none">
              Resource captured. Insights ready.
            </h4>
            <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 uppercase">
              Parsed ok
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-2 text-xs font-medium text-ink-soft">
            <div>
              <span className="text-[10px] text-ink-faint block">Detected Subject</span>
              <span className="text-ink font-semibold">{insights.subject}</span>
            </div>
            <div>
              <span className="text-[10px] text-ink-faint block">Topic Area</span>
              <span className="text-ink font-semibold">{insights.topic}</span>
            </div>
            <div>
              <span className="text-[10px] text-ink-faint block">Type</span>
              <span className="text-ink font-semibold">{insights.type}</span>
            </div>
            <div>
              <span className="text-[10px] text-ink-faint block">Suggested Action</span>
              <span className="text-accent font-semibold">{insights.action}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-emerald-100 pt-3 min-[380px]:flex-row">
            <button
              onClick={() => {
                alert("Simulated: Added to day 3 roadmap!");
                setInsights(null);
                setPastedLink("");
                setLinkTitle("");
                setLinkSubject("");
              }}
              className="h-8 rounded bg-ink px-4 text-xs font-bold text-surface transition hover:bg-ink/85"
            >
              Add to roadmap
            </button>
            <button
              onClick={() => {
                alert("Simulated: Generating summary notes...");
                setInsights(null);
                setPastedLink("");
                setLinkTitle("");
                setLinkSubject("");
              }}
              className="h-8 rounded border border-line bg-paper px-3 text-xs font-semibold text-ink-soft transition hover:bg-surface hover:text-ink"
            >
              Generate summary
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
