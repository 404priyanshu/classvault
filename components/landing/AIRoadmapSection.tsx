"use client";

import { useState } from "react";
import { Sparkles, CalendarRange, Users, Award, Zap, BarChart2 } from "lucide-react";

export function AIRoadmapSection() {
  const [dbmsCompleted, setDbmsCompleted] = useState<boolean[]>([false, false, false]);

  const toggleTask = (index: number) => {
    const nextCompleted = [...dbmsCompleted];
    nextCompleted[index] = !nextCompleted[index];
    setDbmsCompleted(nextCompleted);
  };

  const completedCount = dbmsCompleted.filter(Boolean).length;
  const progressPercent = Math.round((completedCount / dbmsCompleted.length) * 100);

  const features = [
    {
      icon: CalendarRange,
      title: "Day-wise study plan",
      desc: "Takes your exam date and back-calculates a realistic, daily study schedule so you stay on track.",
    },
    {
      icon: Users,
      title: "Personal + community resources",
      desc: "Combines your uploaded sheets with the best documents shared by toppers and classmates in your batch.",
    },
    {
      icon: Award,
      title: "PYQ-based practice",
      desc: "Links relevant past exam questions directly to each day's topic so you study exactly what gets tested.",
    },
    {
      icon: Zap,
      title: "Exam-focused revision",
      desc: "Detects missing concepts in your study flow and prioritizes high-yield topics when time is short.",
    },
    {
      icon: BarChart2,
      title: "Progress tracking",
      desc: "Monitor your preparation status topic-by-topic and visualize your readiness for the test.",
    },
  ];

  return (
    <section className="bg-paper px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          
          {/* Left Column: Feature Details */}
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
              <Sparkles className="h-4 w-4" />
              Flagship Feature
            </div>
            
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              AI roadmaps built from your actual study material.
            </h2>
            
            <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
              Ask for a roadmap for any subject. ClassVault uses your saved resources, uploaded notes, community material, syllabus, and PYQs to generate a day-wise study plan.
            </p>
            
            <div className="mt-8 space-y-6">
              {features.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                      <p className="mt-1 text-xs text-ink-soft leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Right Column: High Fidelity Card Mockup */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-xl transition-all duration-300 hover:shadow-2xl">
              
              {/* DBMS Header */}
              <div className="flex items-center justify-between border-b border-line pb-3.5">
                <div>
                  <span className="text-[9px] font-bold tracking-widest text-ink-faint uppercase">Active Plan</span>
                  <h3 className="text-sm font-bold text-ink">AI Roadmap for DBMS</h3>
                </div>
                <span className="rounded bg-success/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-success">
                  {progressPercent}% Done
                </span>
              </div>
              
              {/* Day Details */}
              <div className="mt-4 rounded-lg bg-paper p-3">
                <span className="font-mono text-[10px] font-bold text-accent">DAY 1 OF 6</span>
                <h4 className="mt-1 text-xs font-bold text-ink">ER Model + SQL Basics</h4>
                
                <div className="mt-3.5 border-t border-line/60 pt-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-faint">Sources to study</p>
                  <ul className="mt-1.5 space-y-2 text-[11px] text-ink-soft">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      <span>Your saved YouTube lecture</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span>Community DBMS Unit 1 Notes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <span>2024 PYQ Set (Topics 1.1 - 1.4)</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Progress Checklist */}
              <div className="mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">Goals for today</p>
                
                <div className="mt-2 space-y-2 text-xs">
                  {[
                    "Complete ER diagrams video & quiz",
                    "Read pages 3-12 of Unit 1 notes",
                    "Solve 5 questions from 2024 PYQ paper",
                  ].map((goal, idx) => (
                    <label
                      key={goal}
                      className="flex cursor-pointer items-start gap-2.5 rounded border border-line bg-paper/30 p-2 transition-colors hover:bg-paper"
                    >
                      <input
                        type="checkbox"
                        checked={dbmsCompleted[idx]}
                        onChange={() => toggleTask(idx)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-line text-accent focus:ring-accent"
                      />
                      <span className={`text-[11px] leading-tight ${dbmsCompleted[idx] ? "text-ink-faint line-through" : "text-ink-soft"}`}>
                        {goal}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Simulated Progress bar */}
              <div className="mt-4 border-t border-line/60 pt-3">
                <div className="flex items-center justify-between text-[10px] text-ink-faint">
                  <span>Progress</span>
                  <span>{completedCount} of 3 tasks</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full bg-success transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
