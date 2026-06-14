"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Check, Play, FileText, Calendar, Network } from "lucide-react";

export function HeroSection() {
  const [activeDay, setActiveDay] = useState<number>(1);

  const roadmapDays = [
    { day: 1, title: "OSI + TCP/IP Model", resources: "2 readings · 1 video lecture", focus: "Physical & Data Link layer differences, headers" },
    { day: 2, title: "Data Link Layer & LANs", resources: "1 class note · 1 PYQ set", focus: "ARP, Ethernet, sliding window protocols, error control" },
    { day: 3, title: "Routing & IP Addressing", resources: "3 community PDFs · 1 video", focus: "Subnetting, IPv4/IPv6, Dijkstra's & Distance Vector" },
    { day: 4, title: "Transport Layer Protocols", resources: "2 personal files · 1 PYQ set", focus: "TCP 3-way handshake, congestion control vs flow control" },
    { day: 5, title: "PYQ Sprint & Mock Exam", resources: "3 PYQ sets · 1 quiz", focus: "Solving 2022-2025 exam papers under exam conditions" },
  ];

  return (
    <section className="relative overflow-hidden bg-paper px-5 pt-16 pb-20 sm:pt-24 sm:pb-28">
      {/* Background radial accent */}
      <div className="absolute top-0 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-accent-soft/40 blur-[100px]" />

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          
          {/* Left Column: Copy & CTAs */}
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Notes · PYQs · Videos · AI Roadmaps
            </div>
            
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Turn scattered study material into a clear <span className="text-accent">exam roadmap.</span>
            </h1>
            
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              ClassVault collects your notes, PYQs, PDFs, YouTube links, and college resources — then uses AI to tell you what to study, in what order, and from which material.
            </p>
            
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-surface transition-colors hover:bg-accent-hover"
              >
                Generate my roadmap
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/app"
                className="inline-flex h-11 items-center rounded-md border border-line-strong bg-surface px-5 text-sm font-medium text-ink transition-colors hover:bg-paper-warm hover:border-ink/20"
              >
                Browse notes
              </Link>
            </div>
            
            {/* Trust/Feature Chips */}
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-8">
              {[
                "College communities",
                "AI study plans",
                "PYQ-based revision",
                "Live study rooms",
              ].map((chip) => (
                <div key={chip} className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                  {chip}
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Column: High Fidelity Mockup */}
          <div className="relative w-full">
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-2xl transition-transform duration-300 hover:scale-[1.01]">
              
              {/* Mockup Header */}
              <div className="flex h-11 items-center justify-between border-b border-line bg-paper px-4">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#FF5F56] opacity-80" />
                  <span className="h-3 w-3 rounded-full bg-[#FFBD2E] opacity-80" />
                  <span className="h-3 w-3 rounded-full bg-[#27C93F] opacity-80" />
                </div>
                <div className="flex items-center gap-1.5 rounded border border-line bg-surface px-3 py-1 font-mono text-[10px] text-ink-faint">
                  <Sparkles className="h-3 w-3 text-accent" />
                  <span>classvault.in/roadmap</span>
                </div>
                <div className="w-12" />
              </div>
              
              {/* Mockup Workspace */}
              <div className="p-4 sm:p-5">
                
                {/* Subject & Settings Box */}
                <div className="rounded-lg border border-line bg-paper/60 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-accent-soft text-accent">
                          <Network className="h-3 w-3" />
                        </span>
                        <h3 className="font-semibold text-sm text-ink">Computer Networks</h3>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-ink-soft">
                        <span className="flex items-center gap-1 rounded bg-line/55 px-2 py-0.5 font-mono text-[10px]">
                          <Calendar className="h-3 w-3 text-ink-faint" />
                          Exam in 5 days
                        </span>
                      </div>
                    </div>
                    <span className="rounded bg-accent/10 px-2 py-1 font-mono text-[10px] font-semibold text-accent">
                      AI GENERATED
                    </span>
                  </div>
                  
                  {/* Source Materials list */}
                  <div className="mt-3.5 border-t border-line/60 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Sources ingested</p>
                    <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs text-ink-soft">
                      <div className="flex items-center gap-1.5">
                        <span className="text-success text-xs font-bold">✓</span>
                        <span>4 personal resources</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-success text-xs font-bold">✓</span>
                        <span>12 community notes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-success text-xs font-bold">✓</span>
                        <span>3 PYQ sets</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-success text-xs font-bold">✓</span>
                        <span>2 YouTube lectures</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generated Roadmap Timeline */}
                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-ink">Study Roadmap</p>
                    <span className="text-[11px] text-ink-faint">Click days to preview detail</span>
                  </div>
                  
                  <div className="mt-3 space-y-2.5">
                    {roadmapDays.map((item) => {
                      const isSelected = activeDay === item.day;
                      return (
                        <div
                          key={item.day}
                          onClick={() => setActiveDay(item.day)}
                          className={`group cursor-pointer rounded-lg border p-3 transition-all ${
                            isSelected
                              ? "border-accent bg-accent/[0.02] shadow-[0_4px_12px_rgba(99,91,255,0.04)]"
                              : "border-line bg-surface hover:border-line-strong"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                                isSelected
                                  ? "bg-accent text-surface"
                                  : "bg-paper text-ink-soft group-hover:bg-line"
                              }`}
                            >
                              D{item.day}
                            </span>
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`truncate text-xs font-semibold ${isSelected ? "text-ink" : "text-ink-soft"}`}>
                                  {item.title}
                                </p>
                                <span className="shrink-0 font-mono text-[9px] text-ink-faint">{item.resources}</span>
                              </div>
                              
                              {isSelected && (
                                <div className="mt-2 border-t border-line/60 pt-2 animate-reveal-up">
                                  <p className="text-[10px] text-ink-soft leading-relaxed">
                                    <strong className="text-accent">Focus: </strong> {item.focus}
                                  </p>
                                  <div className="mt-1.5 flex gap-1.5">
                                    <span className="inline-flex items-center gap-1 rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[9px] text-ink-soft">
                                      <FileText className="h-2.5 w-2.5 text-accent" />
                                      Readings
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[9px] text-ink-soft">
                                      <Play className="h-2.5 w-2.5 text-[#FF0000]" />
                                      Lecture Video
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
            
            {/* Visual floaters */}
            <div className="absolute -bottom-4 -left-4 hidden rounded-lg border border-line bg-surface p-3 shadow-lg sm:flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success text-[10px] font-bold">✓</span>
              <span className="text-xs font-semibold text-ink">Revision Plan Ready</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
