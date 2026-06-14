"use client";

import { MessageSquare, Folder, Play, FileText, ArrowRight } from "lucide-react";

export function PainSection() {
  const sources = [
    {
      app: "WhatsApp",
      icon: MessageSquare,
      color: "text-[#25D366]",
      bg: "bg-[#25D366]/5",
      border: "border-[#25D366]/15",
      context: "Group Chat",
      msg: "“Can someone share Unit 3 notes? Exam is tomorrow!”",
      meta: "Shared 20 times, lost in media folder",
    },
    {
      app: "Google Drive",
      icon: Folder,
      color: "text-[#34A853]",
      bg: "bg-[#34A853]/5",
      border: "border-[#34A853]/15",
      context: "Shared Folder",
      msg: "“Access Denied. Request access or switch accounts.”",
      meta: "3 nested subfolders, unnamed PDFs",
    },
    {
      app: "YouTube",
      icon: Play,
      color: "text-[#FF0000]",
      bg: "bg-[#FF0000]/5",
      border: "border-[#FF0000]/15",
      context: "Watch Later",
      msg: "“2-hour lecture playlist on networking protocols”",
      meta: "Saved 3 months ago, never watched",
    },
    {
      app: "Telegram",
      icon: FileText,
      color: "text-[#0088CC]",
      bg: "bg-[#0088CC]/5",
      border: "border-[#0088CC]/15",
      context: "Channels & Bots",
      msg: "“CN_final_notes_revised_v2_temp.pdf (78MB)”",
      meta: "Expired link, download failed twice",
    },
  ];

  return (
    <section className="border-t border-b border-line bg-paper-warm px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            The Student Struggle
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Your study material is everywhere.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-ink-soft sm:text-base">
            Notes are in WhatsApp. PYQs are in someone&apos;s Drive. Lectures are saved on YouTube. Important PDFs are lost in Telegram. And nobody knows what to study first.
          </p>
        </div>

        {/* Grid of Scattered Platforms */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sources.map((src) => {
            const Icon = src.icon;
            return (
              <div
                key={src.app}
                className={`relative overflow-hidden rounded-xl border bg-surface p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${src.border}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${src.bg} ${src.color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-[10px] font-bold tracking-wider text-ink-soft uppercase">
                    {src.app}
                  </span>
                  <span className="ml-auto rounded-full bg-paper px-2 py-0.5 font-mono text-[9px] text-ink-faint">
                    {src.context}
                  </span>
                </div>
                
                <p className="mt-5 text-xs font-medium italic leading-relaxed text-ink">
                  {src.msg}
                </p>
                
                <div className="mt-4 border-t border-line/60 pt-3">
                  <span className="text-[10px] text-ink-faint">{src.meta}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transition Box */}
        <div className="mt-12 flex flex-col items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
            <ArrowRight className="h-4 w-4 rotate-90" />
          </div>
          
          <div className="mt-8 w-full rounded-xl border border-line bg-surface p-6 text-center shadow-lg sm:p-8">
            <div className="inline-flex items-center gap-2 rounded bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              The ClassVault Solution
            </div>
            <h3 className="mt-4 text-xl font-semibold text-ink sm:text-2xl">
              ClassVault puts it all in one place — and turns it into a guided study plan.
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-ink-soft sm:text-sm">
              We compile personal uploads, shared links, YouTube playlists, and previous years&apos; question papers into a structured interface so you stop searching and start learning.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
