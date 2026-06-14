"use client";

import { useState } from "react";
import { Link2, Plus, Sparkles, Loader2, FileSpreadsheet } from "lucide-react";

export function ResourceCaptureSection() {
  const [urlInput, setUrlInput] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [loadingText, setLoadingText] = useState<string>("StudyVault is organizing it...");
  const [capturedResource, setCapturedResource] = useState<{
    subject: string;
    topic: string;
    action: string;
    type: "youtube" | "pdf";
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setStatus("loading");
    setLoadingText("StudyVault is organizing it...");

    // Phase 1 loading text
    setTimeout(() => {
      setLoadingText("Saved to your learning flow...");
    }, 800);

    // Phase 2 loading text
    setTimeout(() => {
      setLoadingText("Vaulted into your roadmap...");
    }, 1500);

    // Done loading
    setTimeout(() => {
      setStatus("success");
      const isYoutube = urlInput.toLowerCase().includes("youtube.com") || urlInput.toLowerCase().includes("youtu.be");
      setCapturedResource({
        subject: isYoutube ? "Computer Networks" : "Database Management Systems",
        topic: isYoutube ? "TCP Congestion Control (Additive Increase Multiplicative Decrease)" : "Normal Forms & Dependency Preservation",
        action: isYoutube ? "Add to Day 3 roadmap" : "Add to Day 2 revision",
        type: isYoutube ? "youtube" : "pdf",
      });
    }, 2400);
  };

  const handleReset = () => {
    setUrlInput("");
    setStatus("idle");
    setCapturedResource(null);
  };

  return (
    <section className="border-t border-b border-line bg-paper-warm px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          
          {/* Left Column: Interactive Widget */}
          <div className="flex justify-center order-last lg:order-first">
            <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-xl">
              
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-accent">
                  <Link2 className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-semibold text-ink">Interactive Capture Box</span>
                {status === "success" && (
                  <button
                    onClick={handleReset}
                    className="ml-auto text-[10px] text-accent hover:underline font-semibold"
                  >
                    Reset Widget
                  </button>
                )}
              </div>

              {/* Form Input State */}
              {status === "idle" && (
                <form onSubmit={handleSubmit} className="mt-4">
                  <label htmlFor="resource-url" className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                    Paste YouTube link, PDF URL, or Drive document
                  </label>
                  
                  <div className="mt-2 flex gap-2">
                    <input
                      id="resource-url"
                      type="text"
                      required
                      placeholder="e.g. https://www.youtube.com/watch?v=TCP-congestion..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 text-xs font-semibold text-surface transition-colors hover:bg-accent-hover"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add
                    </button>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUrlInput("https://www.youtube.com/watch?v=HndV87-Kz8w")}
                      className="rounded border border-line bg-paper/50 px-2 py-1.5 text-[10px] text-ink-soft hover:bg-paper text-left truncate"
                    >
                      💡 YouTube: TCP Congestion
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrlInput("https://drive.google.com/file/d/dbms-normalization.pdf")}
                      className="rounded border border-line bg-paper/50 px-2 py-1.5 text-[10px] text-ink-soft hover:bg-paper text-left truncate"
                    >
                      💡 Drive: DBMS Normalization
                    </button>
                  </div>
                </form>
              )}

              {/* Loading State */}
              {status === "loading" && (
                <div className="mt-8 mb-6 flex flex-col items-center justify-center text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  <p className="mt-3 text-xs font-medium text-ink-soft animate-pulse">
                    {loadingText}
                  </p>
                </div>
              )}

              {/* Success Result State */}
              {status === "success" && capturedResource && (
                <div className="mt-4 animate-reveal-up">
                  <div className="rounded-lg border border-success/20 bg-success/[0.02] p-3 text-center">
                    <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
                      <Sparkles className="h-3 w-3" />
                    </div>
                    <p className="mt-1.5 text-xs font-bold text-success">
                      “Resource captured. Insights ready.”
                    </p>
                  </div>
                  
                  <div className="mt-4 space-y-2.5 rounded-lg border border-line bg-paper p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">Format:</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-ink-soft">
                        {capturedResource.type === "youtube" ? (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3.5 w-3.5 text-[#FF0000] shrink-0"
                            >
                              <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                              <polygon points="10 15 15 12 10 9" fill="currentColor" />
                            </svg>
                            YouTube Lecture Video
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" />
                            PDF Document
                          </>
                        )}
                      </span>
                    </div>

                    <div className="border-t border-line/60 pt-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint block">Subject</span>
                      <span className="font-semibold text-ink">{capturedResource.subject}</span>
                    </div>

                    <div className="border-t border-line/60 pt-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint block">Topic Detected</span>
                      <span className="font-semibold text-ink leading-relaxed">{capturedResource.topic}</span>
                    </div>

                    <div className="border-t border-line/60 pt-2 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint block">Suggested Action</span>
                        <span className="font-bold text-accent">{capturedResource.action}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="rounded bg-accent px-2.5 py-1 text-[10px] font-semibold text-surface hover:bg-accent-hover transition-colors"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Copy */}
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[9px] font-semibold text-ink-faint uppercase">
              Omnichannel Input
            </div>
            
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Drop any link. StudyVault turns it into study material.
            </h2>
            
            <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
              Save YouTube lectures, PDFs, websites, articles, Drive links, and notes. StudyVault automatically indexes and tags them by subject, unit, topic, and learning goals so they drop straight into your revision pipeline.
            </p>

            <div className="mt-6 border-l-2 border-accent/25 pl-4 py-1">
              <span className="text-xs italic text-ink-soft">
                “Added to your Study Vault. Saved to your learning flow. Vaulted into your roadmap. StudyVault is organizing it.”
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
