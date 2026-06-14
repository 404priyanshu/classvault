"use client";

import {
  Upload,
  Link2,
  Search,
  Sparkles,
  BookOpen,
  Calendar,
  FileCheck,
  AlertCircle,
  GraduationCap,
  Clock,
  Bookmark,
  Star,
} from "lucide-react";

export function FeatureGrid() {
  const capabilities = [
    {
      icon: Upload,
      title: "Upload notes and PDFs",
      desc: "Share your own summaries, diagrams, and exam prep sheets with your batch easily.",
    },
    {
      icon: Link2,
      title: "Save YouTube & web links",
      desc: "Drop video playlists, articles, or documentation links directly into your vault.",
    },
    {
      icon: Search,
      title: "Granular Search",
      desc: "Find content in seconds. Filter by subject, semester, unit, or university course code.",
    },
    {
      icon: Sparkles,
      title: "AI summaries",
      desc: "Get instant key takeaways and high-yield insights from uploaded PDFs or video links.",
    },
    {
      icon: BookOpen,
      title: "AI flashcards & quizzes",
      desc: "Automatically generate revision flashcards and quick quizzes based on your notes.",
    },
    {
      icon: Calendar,
      title: "AI study roadmaps",
      desc: "Build customized, day-by-day learning pathways for any subject in seconds.",
    },
    {
      icon: FileCheck,
      title: "PYQ matcher",
      desc: "Maps previous years' questions directly to your study resources for practice.",
    },
    {
      icon: AlertCircle,
      title: "Missing topic detector",
      desc: "AI flags syllabus topics you've missed before you enter the exam hall.",
    },
    {
      icon: GraduationCap,
      title: "College communities",
      desc: "Unlock campus-exclusive folders, notes, and discussions with verified email domains.",
    },
    {
      icon: Clock,
      title: "Study rooms",
      desc: "Silent, Pomodoro-driven study rooms to help you focus alongside classmates.",
    },
    {
      icon: Bookmark,
      title: "Saved resources",
      desc: "Bookmark files to build your personalized end-semester revision collection.",
    },
    {
      icon: Star,
      title: "Ratings & trust metrics",
      desc: "Every file features rating feedback and download stats to verify its quality.",
    },
  ];

  return (
    <section className="border-t border-b border-line bg-paper-warm px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            Complete Feature Set
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Everything you need to clear exams.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-ink-soft sm:text-base">
            No bloated tools or distraction traps. Just solid student productivity utilities engineered to help you prepare.
          </p>
        </div>

        {/* 12-item Grid */}
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-surface p-6 transition-colors hover:bg-paper/40"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
