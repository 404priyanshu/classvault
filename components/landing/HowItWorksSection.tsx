"use client";

import { Save, Tag, Sparkles, TrendingUp } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      icon: Save,
      title: "Save or upload resources",
      desc: "Compile notes, exam sheets, PYQs, Drive files, lecture videos, and reference links into your workspace.",
    },
    {
      step: "02",
      icon: Tag,
      title: "ClassVault organizes it",
      desc: "Our engine automatically tags resources by course code, unit, topic, semester, and urgency.",
    },
    {
      step: "03",
      icon: Sparkles,
      title: "Generate a roadmap",
      desc: "AI processes the collected materials to construct a structured day-by-day plan leading up to your exam.",
    },
    {
      step: "04",
      icon: TrendingUp,
      title: "Study, revise, & track",
      desc: "Track completed topics, jump into silent pomodoro rooms with peers, and attempt PYQ-linked flashcards.",
    },
  ];

  return (
    <section className="bg-paper px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            Getting Started
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Four steps to study clarity.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-ink-soft sm:text-base">
            No steep learning curves. Drop your syllabus materials and let ClassVault layout the roadmap.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 relative">
          
          {/* Connecting line for desktop */}
          <div className="absolute top-[2.25rem] left-[10%] right-[10%] hidden h-px border-t border-dashed border-line lg:block" />

          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative flex flex-col items-start text-left">
                {/* Step indicator circle */}
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface shadow-sm text-accent">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                
                <span className="mt-6 font-mono text-xs font-bold text-accent">
                  STEP {item.step}
                </span>
                
                <h3 className="mt-2 text-sm font-bold text-ink">
                  {item.title}
                </h3>
                
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
